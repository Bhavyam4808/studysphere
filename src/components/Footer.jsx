import React from 'react';
import { Icons } from './Icons.js';

/**
 * Footer Component
 * ================
 * Clean student hackathon project footer.
 */
export function Footer({ onNavigate }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Icons.BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">StudySphere</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              "Learn. Explore. Grow." A peer-curated open study platform designed for first-year engineering students to discover syllabus notes, video lectures, and clear conceptual explanations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-0.5 bg-slate-800 text-blue-400 rounded font-mono">
                First-Year Hackathon 2026
              </span>
              <span>•</span>
              <span>Open Academic Resource Hub</span>
            </div>
          </div>

          {/* Quick Subjects */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Core Subjects
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Physics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Mathematics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Programming / C
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Electrical Engineering
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subjects')}
                  className="hover:text-white transition-colors"
                >
                  Engineering Chemistry
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Features */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('ai')}
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Icons.Bot className="w-3.5 h-3.5 text-blue-400" />
                  StudySphere AI
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="hover:text-white transition-colors"
                >
                  Lecture Catalog
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('resources')}
                  className="hover:text-white transition-colors"
                >
                  Verified PDF Notes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-white transition-colors"
                >
                  Progress Tracker
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 StudySphere. Designed & developed by a student hackathon team.</p>
          <p className="flex items-center gap-1 text-[11px]">
            <span>Clean code</span> • <span>Modular React</span> • <span>Fast SQLite backend</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
