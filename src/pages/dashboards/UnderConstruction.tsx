import React from 'react';
import { PageHeader } from '../../components/ui';
import { Construction } from 'lucide-react';

export default function UnderConstruction({ title }: { title: string }) {
  return (
    <div className="max-w-7xl mx-auto h-[80vh] flex flex-col items-center justify-center">
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center max-w-md w-full">
        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
          <Construction className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">{title}</h2>
        <p className="text-slate-500 mb-8">
          This module is currently under development. Please check back later.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition w-full"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
