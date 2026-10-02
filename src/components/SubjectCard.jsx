import React from 'react';
import { Icons } from './Icons.js';

/**
 * SubjectCard Component
 * =====================
 * Displays a subject tile with color-coded theme,
 * resource statistics, and direct navigation.
 */
export function SubjectCard({
  subject,
  notesCount = 0,
  lecturesCount = 0,
  iconType = 'book',
  onClick
}) {
  const getSubjectColor = (name) => {
    switch (name) {
      case 'Engineering Physics':
        return {
          bg: 'bg-indigo-50 hover:bg-indigo-100/80',
          border: 'border-indigo-200',
          badge: 'bg-indigo-600 text-white',
          text: 'text-indigo-950'
        };
      case 'Engineering Mathematics':
        return {
          bg: 'bg-blue-50 hover:bg-blue-100/80',
          border: 'border-blue-200',
          badge: 'bg-blue-600 text-white',
          text: 'text-blue-950'
        };
      case 'Programming / C':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100/80',
          border: 'border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-950'
        };
      case 'Electrical Engineering':
        return {
          bg: 'bg-amber-50 hover:bg-amber-100/80',
          border: 'border-amber-200',
          badge: 'bg-amber-600 text-white',
          text: 'text-amber-950'
        };
      case 'Engineering Chemistry':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100/80',
          border: 'border-purple-200',
          badge: 'bg-purple-600 text-white',
          text: 'text-purple-950'
        };
      default:
        return {
          bg: 'bg-slate-50 hover:bg-slate-100/80',
          border: 'border-slate-200',
          badge: 'bg-slate-600 text-white',
          text: 'text-slate-950'
        };
    }
  };

  const style = getSubjectColor(subject);

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border ${style.border} ${style.bg} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg ${style.badge} flex items-center justify-center shadow-sm`}>
            <Icons.GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-white/80 px-2.5 py-1 rounded-full border border-slate-200">
            {notesCount + lecturesCount} Resources
          </span>
        </div>

        <h3 className={`text-base font-bold ${style.text} mb-1.5`}>
          {subject}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-2">
          First-year foundational curriculum modules, exam formulas & video masterclasses.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-700">
            <Icons.FileText className="w-3.5 h-3.5 text-blue-600" />
            {notesCount} Notes
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <Icons.Video className="w-3.5 h-3.5 text-rose-600" />
            {lecturesCount} Lectures
          </span>
        </div>
        <Icons.ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
