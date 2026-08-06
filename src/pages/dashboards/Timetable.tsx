import React from 'react';
import { PageHeader } from '../../components/ui';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Timetable() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const schedule = [
    { time: '09:00 AM', monday: 'Math', tuesday: 'Physics', wednesday: 'Math', thursday: 'Physics', friday: 'Chemistry' },
    { time: '10:00 AM', monday: 'English', tuesday: 'Math', wednesday: 'History', thursday: 'English', friday: 'Biology' },
    { time: '11:00 AM', monday: 'Physics', tuesday: 'Chemistry', wednesday: 'Biology', thursday: 'Math', friday: 'History' },
    { time: '12:00 PM', monday: 'Break', tuesday: 'Break', wednesday: 'Break', thursday: 'Break', friday: 'Break' },
    { time: '01:00 PM', monday: 'History', tuesday: 'English', wednesday: 'Chemistry', thursday: 'Biology', friday: 'Math' },
    { time: '02:00 PM', monday: 'Biology', tuesday: 'History', wednesday: 'Physics', thursday: 'Chemistry', friday: 'English' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title={isTeacher ? "My Teaching Schedule" : "My Class Timetable"} 
        description="View your weekly academic schedule."
      />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Current Week</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase w-24">Time</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Monday</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Tuesday</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Wednesday</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Thursday</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Friday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((slot, i) => (
                <tr key={i} className={slot.monday === 'Break' ? 'bg-slate-50/50' : 'hover:bg-slate-50/50 transition-colors'}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.time}
                    </div>
                  </td>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                    const subject = slot[day as keyof typeof slot];
                    const isBreak = subject === 'Break';
                    return (
                      <td key={day} className="px-4 py-4">
                        <div className={`
                          py-2 px-3 rounded-lg text-sm font-semibold mx-auto max-w-[120px]
                          ${isBreak ? 'bg-slate-100 text-slate-500' : 'bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm'}
                        `}>
                          {subject}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
