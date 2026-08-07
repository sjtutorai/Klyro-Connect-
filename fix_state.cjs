const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

if (!code.includes('import { Country, State, City }')) {
  code = code.replace(
    "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';",
    "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';\nimport { Country, State, City } from 'country-state-city';"
  );
}

if (!code.includes('const [selectedCountryCode')) {
  code = code.replace(
    "const [isSubmitting, setIsSubmitting] = useState(false);",
    "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [selectedCountryCode, setSelectedCountryCode] = useState('');\n  const [selectedStateCode, setSelectedStateCode] = useState('');"
  );
}

fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
