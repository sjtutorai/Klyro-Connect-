import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'INSTITUTION', 'TEACHER', 'STUDENT']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull(),
  institutionId: uuid('institution_id'), // Optional, null for Super Admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const institutions = pgTable('institutions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').default('PENDING').notNull(), // PENDING, APPROVED, REJECTED
  contactEmail: text('contact_email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  institutionId: uuid('institution_id').references(() => institutions.id).notNull(),
  subject: text('subject'),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  institutionId: uuid('institution_id').references(() => institutions.id).notNull(),
  grade: text('grade'),
  section: text('section'),
  rollNumber: text('roll_number'),
});

export const complaints = pgTable('complaints', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull(), // Low, Medium, High, Urgent
  status: text('status').default('PENDING').notNull(), // Pending, In Progress, Resolved, Rejected, Escalated
  authorId: uuid('author_id').references(() => users.id).notNull(),
  institutionId: uuid('institution_id').references(() => institutions.id).notNull(),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  date: timestamp('date').notNull(),
  institutionId: uuid('institution_id').references(() => institutions.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const homework = pgTable('homework', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date').notNull(),
  teacherId: uuid('teacher_id').references(() => teachers.id).notNull(),
  grade: text('grade'), // targeting specific grade
  section: text('section'), // targeting specific section
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  date: timestamp('date').notNull(),
  status: text('status').notNull(), // PRESENT, ABSENT, LATE
  markedById: uuid('marked_by_id').references(() => teachers.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  complaints: many(complaints),
}));

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  complaints: many(complaints),
  events: many(events),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  author: one(users, {
    fields: [complaints.authorId],
    references: [users.id],
  }),
  institution: one(institutions, {
    fields: [complaints.institutionId],
    references: [institutions.id],
  }),
}));
