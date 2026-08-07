const fs = require('fs');
let code = fs.readFileSync('src/pages/SchoolRegistration.tsx', 'utf8');

const step13Start = `                {currentStep === 13 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Review & Submit</h2>`;

const step12UI = `                {currentStep === 12 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Initial Users Setup</h2>
                      <p className="text-slate-500 mt-1">Add initial teachers and students. You can add them manually or upload an Excel/PDF file with Name, Email, and Password columns. AI will automatically parse and validate the file.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Teachers File</h3>
                        <p className="text-xs text-slate-500 mb-4">Excel or PDF format</p>
                        <input type="file" accept=".pdf,.csv,.xlsx,.xls" className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>

                      <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">Upload Students File</h3>
                        <p className="text-xs text-slate-500 mb-4">Excel or PDF format</p>
                        <input type="file" accept=".pdf,.csv,.xlsx,.xls" className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 text-amber-800 rounded-xl flex items-start gap-3 border border-amber-200">
                      <Shield className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <div className="text-sm">
                        <span className="font-semibold block mb-1">AI Validation</span>
                        Our AI system will automatically extract and validate the users from your uploaded files, checking for required fields: <strong>Name, Email, and Password</strong>. Blank forms will be rejected.
                      </div>
                    </div>
                  </div>
                )}

`;

code = code.replace(step13Start, step12UI + step13Start);
fs.writeFileSync('src/pages/SchoolRegistration.tsx', code);
