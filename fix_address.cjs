const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

// We need to inject the import
if (!code.includes('country-state-city')) {
  code = code.replace(
    "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';",
    "import { collection, addDoc, serverTimestamp } from 'firebase/firestore';\nimport { Country, State, City } from 'country-state-city';"
  );
}

// Add state for ISO codes so we can fetch states and cities
// search for: const [isSubmitting, setIsSubmitting] = useState(false);
if (!code.includes('selectedCountryCode')) {
  code = code.replace(
    "const [isSubmitting, setIsSubmitting] = useState(false);",
    "const [isSubmitting, setIsSubmitting] = useState(false);\n  const [selectedCountryCode, setSelectedCountryCode] = useState('');\n  const [selectedStateCode, setSelectedStateCode] = useState('');"
  );
}

// Modify the handler for country to also set country code, and state to set state code.
// Actually, it's easier to just handle it directly in the select's onChange.
// Let's replace the address fields in Step 2.
// Currently it's:
// <input name="country" value={formData.country} onChange={handleChange} ... placeholder="Country" />
// <input name="state" value={formData.state} ... placeholder="State" />
// <input name="district" value={formData.district} ... placeholder="District / Region" />
// <input name="city" value={formData.city} ... placeholder="City" />

fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
