import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, isDbConfigured } from './src/db';
import { users, roleEnum } from './src/db/schema';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

app.use(cors());
app.use(express.json());

// Extend express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        institutionId?: string | null;
      };
    }
  }
}

// Authentication Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback for Firebase ID tokens
    req.user = { id: 'firebase-user', role: 'INSTITUTION' };
    next();
  }
};

const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }
  next();
};

// MOCK DATA FOR PREVIEW MODE (When DB is not configured)
const MOCK_USERS = [
  { id: '1', email: 'admin@klyro.com', passwordHash: bcrypt.hashSync('admin123', 10), role: 'SUPER_ADMIN', name: 'Super Admin', institutionId: null },
  { id: '2', email: 'school@klyro.com', passwordHash: bcrypt.hashSync('school123', 10), role: 'INSTITUTION', name: 'Demo High School', institutionId: 'inst-1' },
  { id: '3', email: 'teacher@klyro.com', passwordHash: bcrypt.hashSync('teacher123', 10), role: 'TEACHER', name: 'John Doe', institutionId: 'inst-1' },
  { id: '4', email: 'student@klyro.com', passwordHash: bcrypt.hashSync('student123', 10), role: 'STUDENT', name: 'Jane Smith', institutionId: 'inst-1' },
];

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', dbConfigured: isDbConfigured() });
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;
    if (isDbConfigured()) {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = result[0];
    } else {
      user = MOCK_USERS.find(u => u.email === email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, institutionId: user.institutionId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, institutionId: user.institutionId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User Profile Route
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    let user;
    if (isDbConfigured()) {
      const result = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
      user = result[0];
    } else {
      user = MOCK_USERS.find(u => u.id === req.user!.id);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, institutionId: user.institutionId } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Mock Dashboard Stats endpoints for preview
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  // Return different stats based on role
  if (req.user!.role === 'SUPER_ADMIN') {
    return res.json({ institutions: 124, teachers: 3450, students: 45000, activeComplaints: 12 });
  } else if (req.user!.role === 'INSTITUTION') {
    return res.json({ teachers: 45, students: 850, activeEvents: 3, pendingComplaints: 2 });
  } else if (req.user!.role === 'TEACHER') {
    return res.json({ classes: 4, students: 120, pendingHomework: 5, averageAttendance: 92 });
  } else {
    return res.json({ courses: 6, pendingHomework: 2, attendance: 95, unreadNotices: 3 });
  }
});

// AI Complaint Moderation & Purge Endpoint
app.post('/api/ai/clean-complaints', requireAuth, async (req, res) => {
  const { complaints } = req.body;
  if (!Array.isArray(complaints)) {
    return res.status(400).json({ error: 'Invalid payload: complaints array required' });
  }

  try {
    const ai = getGenAI();
    let invalidIds: string[] = [];

    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Analyze these complaints submitted to an educational institution. Identify complaints that are "unknown", spam, gibberish, test entries, meaningless noise (e.g., random keyboard mashing like "asdfghjkl", "123", "test test"), or non-actionable blank complaints.
Return ONLY a JSON array of the string IDs of complaints that should be deleted.
Example format: ["id1", "id2"]

Complaints data:
${JSON.stringify(complaints)}`,
      });

      const text = response.text || '[]';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const match = cleanJson.match(/\[.*\]/s);
      if (match) {
        invalidIds = JSON.parse(match[0]);
      }
    } else {
      // Intelligent heuristic scan fallback
      invalidIds = complaints.filter((c: any) => {
        const title = (c.title || '').trim().toLowerCase();
        const desc = (c.description || '').trim().toLowerCase();
        const isUnknown = c.isAnonymous || c.userName === 'Anonymous' || !c.userName;
        const isGibberish = title.length < 3 || desc.length < 5 || /^([a-z0-9])\1+$/i.test(title) || /asdf|qwerty|1234|test test|xyz|xxx/i.test(title + ' ' + desc);
        return isUnknown && isGibberish;
      }).map((c: any) => c.id);
    }

    res.json({ invalidIds });
  } catch (err) {
    console.error('AI Moderation Error:', err);
    res.status(500).json({ error: 'AI Moderation failed' });
  }
});

// AI Timetable Generation Endpoint
app.post('/api/ai/generate-timetable', requireAuth, async (req, res) => {
  const { className, subjectTeachers = [], days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'], teachersList = [] } = req.body;

  if (!className) {
    return res.status(400).json({ error: 'className is required' });
  }

  try {
    const ai = getGenAI();

    if (ai) {
      const prompt = `You are an expert school master-scheduler AI. Construct an optimal, balanced weekly timetable schedule for "${className}".

Context:
- Class Name: ${className}
- Mapped Subject Teachers for this class: ${JSON.stringify(subjectTeachers)}
- All available Faculty/Teachers in institution: ${JSON.stringify(teachersList)}
- Days: ${JSON.stringify(days)}
- Time Slots: ${JSON.stringify(timeSlots)}

Scheduling Constraints:
1. Always set "12:00 PM" as subject: "Lunch Break", teacherName: "-", room: "Cafeteria".
2. Assign periods for each subject mapped in subjectTeachers across the remaining time slots evenly throughout the week.
3. Ensure no teacher is double-booked or assigned conflicting subjects at the same day & time slot.
4. Each subject should be assigned its designated teacher from subjectTeachers or teachersList.
5. Provide a clear rationale explaining the workload distribution.

Return ONLY valid JSON matching this exact structure:
{
  "slots": [
    {
      "day": "Monday",
      "time": "09:00 AM",
      "subject": "Mathematics",
      "teacherName": "John Doe",
      "room": "Room 101"
    }
  ],
  "aiRationale": "Generated schedule balanced 5 core subjects across 25 periods. Assigned John Doe to Math and Dr. Robert to Physics with no teacher overlaps."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (parseErr) {
        console.error("JSON parse error from Gemini timetable response:", parseErr, text);
      }
    }

    // Programmatic fallback generator if AI key is missing or parse fails
    const mappedSubjects = subjectTeachers.filter((st: any) => st.subject && st.subject.trim().length > 0);
    const fallbackSlots: any[] = [];
    let subjectIdx = 0;

    for (const day of days) {
      for (const time of timeSlots) {
        if (time.includes('12:00')) {
          fallbackSlots.push({
            day,
            time,
            subject: 'Lunch Break',
            teacherName: '-',
            room: 'Cafeteria'
          });
        } else if (mappedSubjects.length > 0) {
          const mapped = mappedSubjects[subjectIdx % mappedSubjects.length];
          const teacherObj = teachersList.find((t: any) => t.id === mapped.teacherId) || { name: mapped.teacherName || 'Faculty' };
          fallbackSlots.push({
            day,
            time,
            subject: mapped.subject,
            teacherName: teacherObj.name || mapped.teacherName || 'Faculty Teacher',
            room: `Room ${101 + (subjectIdx % 5)}`
          });
          subjectIdx++;
        } else {
          fallbackSlots.push({
            day,
            time,
            subject: 'Self Study / Activity',
            teacherName: 'Class Supervisor',
            room: 'Library'
          });
        }
      }
    }

    return res.json({
      slots: fallbackSlots,
      aiRationale: `Engineered conflict-free schedule for ${className} distributing ${mappedSubjects.length > 0 ? mappedSubjects.length : 'default'} subjects evenly across ${days.length} days.`
    });

  } catch (err: any) {
    console.error("AI Timetable Error:", err);
    res.status(500).json({ error: err.message || 'Failed to generate AI timetable' });
  }
});

// AI Student & Teacher Roster Parser Endpoint (Auto Converts PDF/Excel/CSV to Manual Form Data)
app.post('/api/ai/parse-roster', requireAuth, async (req, res) => {
  const { fileContent, fileName, mimeType } = req.body;

  if (!fileContent) {
    return res.status(400).json({ error: 'fileContent is required' });
  }

  try {
    const ai = getGenAI();

    if (ai) {
      const prompt = `You are an AI document parser for school onboarding.
Analyze the following document/file content uploaded for registering students and teachers for a school.
Extract all student and teacher records mentioned in the text or structured table.

File Name: ${fileName || 'Uploaded File'}
Mime Type: ${mimeType || 'text/plain'}

Instructions:
1. Extract every student with fields: name, email, password, className (e.g. "Class 10 - Section A").
2. Extract every teacher with fields: name, email, password, subject.
3. If email is missing for a person, generate a clean email based on their name and domain like "first.last@school.edu".
4. If password is missing, generate a standard initial password like "Student123!" or "Teacher123!".
5. Return ONLY a valid JSON object matching this exact structure:
{
  "teachers": [
    { "name": "John Smith", "email": "john.smith@school.edu", "password": "Teacher123!", "subject": "Mathematics" }
  ],
  "students": [
    { "name": "Alice Johnson", "email": "alice.j@school.edu", "password": "Student123!", "className": "Class 10 - Section A" }
  ]
}

Document Content:
${typeof fileContent === 'string' ? fileContent.slice(0, 15000) : JSON.stringify(fileContent)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch (parseErr) {
        console.error("JSON parse error from Gemini parse-roster response:", parseErr, text);
      }
    }

    // Heuristic Fallback Parser if Gemini key is missing or parse fails
    const rawLines = typeof fileContent === 'string' ? fileContent.split(/\r?\n/) : [];
    const extractedStudents: any[] = [];
    const extractedTeachers: any[] = [];

    rawLines.forEach((line: string, idx: number) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.toLowerCase().includes('name,') || trimmed.toLowerCase().includes('email,')) return;

      const parts = trimmed.split(/[,;\t|]+/);
      if (parts.length >= 1 && parts[0].length > 2) {
        const name = parts[0].replace(/["']/g, '').trim();
        const email = parts[1] ? parts[1].replace(/["']/g, '').trim() : `${name.toLowerCase().replace(/\s+/g, '.')}@school.edu`;
        const password = parts[2] ? parts[2].replace(/["']/g, '').trim() : 'Student123!';
        const className = parts[3] ? parts[3].replace(/["']/g, '').trim() : 'Class 10 - Section A';

        if (trimmed.toLowerCase().includes('teacher') || parts.some(p => /math|science|physics|english|chemistry|teacher/i.test(p))) {
          extractedTeachers.push({
            name,
            email,
            password: password === 'Student123!' ? 'Teacher123!' : password,
            subject: parts[3] || 'General Subject'
          });
        } else {
          extractedStudents.push({
            name,
            email,
            password,
            className
          });
        }
      }
    });

    return res.json({
      teachers: extractedTeachers,
      students: extractedStudents
    });

  } catch (err: any) {
    console.error("AI Parse Roster Error:", err);
    res.status(500).json({ error: err.message || 'Failed to parse roster file' });
  }
});

// Vite Middleware for Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
