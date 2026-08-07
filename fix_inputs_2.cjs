const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

// The `name` variable is not defined in the scope of JSX element, we need to use the actual name attribute.
// Let's fix formErrors[name] to formErrors['theName']
code = code.replace(/<input([^>]*?)name="([^"]+)"([^>]*?)className=\{\`w-full px-4 py-2\.5 rounded-xl border \$\{formErrors\[name\] \? 'border-red-500 focus:ring-red-500\/20' : 'border-slate-300 focus:ring-indigo-500\/20'\} focus:ring-2 focus:border-indigo-500 outline-none transition(.*?)\`\}/g, (match, before, nameAttr, after, extra) => {
    return `<input${before}name="${nameAttr}"${after}className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['${nameAttr}'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition${extra}\`}`;
});

code = code.replace(/<select([^>]*?)name="([^"]+)"([^>]*?)className=\{\`w-full px-4 py-2\.5 rounded-xl border \$\{formErrors\[name\] \? 'border-red-500 focus:ring-red-500\/20' : 'border-slate-300 focus:ring-indigo-500\/20'\} focus:ring-2 focus:border-indigo-500 outline-none transition(.*?)\`\}/g, (match, before, nameAttr, after, extra) => {
    return `<select${before}name="${nameAttr}"${after}className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['${nameAttr}'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition${extra}\`}`;
});

code = code.replace(/<textarea([^>]*?)name="([^"]+)"([^>]*?)className=\{\`w-full px-4 py-2\.5 rounded-xl border \$\{formErrors\[name\] \? 'border-red-500 focus:ring-red-500\/20' : 'border-slate-300 focus:ring-indigo-500\/20'\} focus:ring-2 focus:border-indigo-500 outline-none transition(.*?)\`\}/g, (match, before, nameAttr, after, extra) => {
    return `<textarea${before}name="${nameAttr}"${after}className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['${nameAttr}'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition${extra}\`}`;
});

fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
