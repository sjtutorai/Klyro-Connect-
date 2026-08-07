const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

code = code.replace(/currentStep < 13/g, 'currentStep < 14');
code = code.replace(/setCurrentStep\(13\)/g, 'setCurrentStep(14)');
code = code.replace(/currentStep === 13/g, 'currentStep === 14');
code = code.replace(/currentStep === 12/g, 'currentStep === 13');
code = code.replace(/currentStep < 12/g, 'currentStep < 13');
code = code.replace(/currentStep \/ 13/g, 'currentStep / 14');

fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
