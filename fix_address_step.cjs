const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

const addressBlockOriginal = `                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                        <input name="country" value={formData.country} onChange={handleChange} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['country'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition\`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label>
                        <input name="state" value={formData.state} onChange={handleChange} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['state'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition\`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                        <input name="district" value={formData.district} onChange={handleChange} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['district'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition\`} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Taluk / Region</label>
                        <input name="taluk" value={formData.taluk} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City / Town / Village</label>
                        <input name="city" value={formData.city} onChange={handleChange} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['city'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition\`} />
                      </div>`;

const addressBlockNew = `                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                        <select name="country" value={formData.country} onChange={(e) => {
                          const countryName = e.target.value;
                          const country = Country.getAllCountries().find(c => c.name === countryName);
                          setSelectedCountryCode(country ? country.isoCode : '');
                          setSelectedStateCode('');
                          setFormData(prev => ({ ...prev, country: countryName, state: '', city: '' }));
                          if (formErrors['country']) setFormErrors(prev => { const n = {...prev}; delete n['country']; return n; });
                        }} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['country'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition bg-white\`}>
                          <option value="">Select Country</option>
                          {Country.getAllCountries().map(country => (
                            <option key={country.isoCode} value={country.name}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">State / Province</label>
                        <select name="state" value={formData.state} onChange={(e) => {
                          const stateName = e.target.value;
                          const state = State.getStatesOfCountry(selectedCountryCode).find(s => s.name === stateName);
                          setSelectedStateCode(state ? state.isoCode : '');
                          setFormData(prev => ({ ...prev, state: stateName, city: '' }));
                          if (formErrors['state']) setFormErrors(prev => { const n = {...prev}; delete n['state']; return n; });
                        }} disabled={!selectedCountryCode} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['state'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition bg-white disabled:bg-slate-50\`}>
                          <option value="">Select State</option>
                          {selectedCountryCode && State.getStatesOfCountry(selectedCountryCode).map(state => (
                            <option key={state.isoCode} value={state.name}>{state.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">District / Region</label>
                        <input name="district" value={formData.district} onChange={handleChange} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['district'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition\`} placeholder="Enter district" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">City / Town</label>
                        <select name="city" value={formData.city} onChange={handleChange} disabled={!selectedStateCode} className={\`w-full px-4 py-2.5 rounded-xl border \${formErrors['city'] ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 focus:ring-indigo-500/20'} focus:ring-2 focus:border-indigo-500 outline-none transition bg-white disabled:bg-slate-50\`}>
                          <option value="">Select City</option>
                          {selectedStateCode && City.getCitiesOfState(selectedCountryCode, selectedStateCode).map(city => (
                            <option key={city.name} value={city.name}>{city.name}</option>
                          ))}
                        </select>
                      </div>`;

code = code.replace(addressBlockOriginal, addressBlockNew);
fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
