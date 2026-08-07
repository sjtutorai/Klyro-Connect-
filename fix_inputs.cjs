const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

// Find all inputs, selects, and textareas and replace className with dynamic one
code = code.replace(/className="w-full px-4 py-2\.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500\/20 focus:border-indigo-500 outline-none transition( bg-white)?"/g, (match, p1) => {
    return `className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors[name] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition${p1 ? ' bg-white' : ''}\`}`;
});

code = code.replace(/className="w-full px-4 py-2\.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500\/20 focus:border-indigo-500 outline-none transition resize-none"/g, () => {
    return `className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors[name] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition resize-none\`}`;
});

fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
