const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboards/TeacherDashboard.tsx', 'utf-8');

code = code.replace("import React from 'react';", "import React from 'react';\nimport { useNavigate } from 'react-router-dom';");
code = code.replace("const { user } = useAuth();", "const { user } = useAuth();\n  const navigate = useNavigate();");

code = code.replace(
  `<button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">`,
  `<button onClick={() => navigate('/dashboard/teacher/attendance')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">`
);

code = code.replace(
  `<button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">\n              <BookOpen className="w-8 h-8" />`,
  `<button onClick={() => navigate('/dashboard/teacher/homework')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">\n              <BookOpen className="w-8 h-8" />`
);

code = code.replace(
  `<button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">\n              <MessageSquareWarning className="w-8 h-8" />`,
  `<button onClick={() => navigate('/dashboard/complaints')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">\n              <MessageSquareWarning className="w-8 h-8" />`
);

code = code.replace(
  `<button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">\n              <Users className="w-8 h-8" />`,
  `<button onClick={() => navigate('/dashboard/teacher/students')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-slate-100 text-slate-700">\n              <Users className="w-8 h-8" />`
);

// Add full timetable button
code = code.replace(
  `<h3 className="text-lg font-bold text-slate-900">Today's Timetable</h3>`,
  `<h3 className="text-lg font-bold text-slate-900">Today's Timetable</h3>\n            <button onClick={() => navigate('/dashboard/teacher/timetable')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View Full Schedule</button>`
);

fs.writeFileSync('src/pages/dashboards/TeacherDashboard.tsx', code);
