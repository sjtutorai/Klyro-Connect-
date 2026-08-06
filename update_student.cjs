const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboards/StudentDashboard.tsx', 'utf-8');

code = code.replace("import React from 'react';", "import React from 'react';\nimport { useNavigate } from 'react-router-dom';");
code = code.replace("const { user } = useAuth();", "const { user } = useAuth();\n  const navigate = useNavigate();");

// Add link to Homework
code = code.replace(
  `<button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>`,
  `<button onClick={() => navigate('/dashboard/student/homework')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>`
);

// Add link to Attendance
code = code.replace(
  `<h3 className="text-lg font-bold text-slate-900">Attendance This Week</h3>`,
  `<h3 className="text-lg font-bold text-slate-900">Attendance This Week</h3>\n              <button onClick={() => navigate('/dashboard/student/attendance')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View Details</button>`
);

// Add link to Notices
code = code.replace(
  `<button className="w-full mt-6 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">\n            View All Notices\n          </button>`,
  `<button onClick={() => navigate('/dashboard/notices')} className="w-full mt-6 py-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">\n            View All Notices\n          </button>`
);

fs.writeFileSync('src/pages/dashboards/StudentDashboard.tsx', code);
