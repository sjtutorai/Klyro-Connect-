import React, { useState } from 'react';
import { PageHeader } from '../../components/ui';
import Notices from './Notices';
import Events from './Events';
import Complaints from './Complaints';
import { Bell, Calendar, MessageSquareWarning } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Communications() {
  const [activeTab, setActiveTab] = useState<'notices' | 'events' | 'complaints'>('notices');
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Communications Hub" 
        description="Manage notices, events, and complaints in one place."
      />
      
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'notices' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
        >
          <Bell className="w-4 h-4" /> Notices
        </button>
        <button
          onClick={() => setActiveTab('events')}
           className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'events' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
        >
          <Calendar className="w-4 h-4" /> Events
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
           className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'complaints' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
        >
          <MessageSquareWarning className="w-4 h-4" /> Complaints
        </button>
      </div>

      <div className="pt-4">
        <div className={activeTab === 'notices' ? 'block' : 'hidden'}><Notices hideHeader={true} /></div>
        <div className={activeTab === 'events' ? 'block' : 'hidden'}><Events hideHeader={true} /></div>
        <div className={activeTab === 'complaints' ? 'block' : 'hidden'}><Complaints hideHeader={true} /></div>
      </div>
    </div>
  );
}
