import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, isDbConfigured } from './src/db';
import { users, roleEnum } from './src/db/schema';

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
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
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
