import React from 'react';

export const StatCard = ({ title, value, icon, trend }: { title: string, value: string | number, icon: React.ReactNode, trend?: { value: string, positive: boolean } }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
        {icon}
      </div>
      {trend && (
        <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend.positive ? '+' : '-'}{trend.value}
        </span>
      )}
    </div>
    <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
    <div className="text-3xl font-bold text-slate-900">{value}</div>
  </div>
);

export const PageHeader = ({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {description && <p className="text-slate-500 mt-1">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
