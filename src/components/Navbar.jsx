import React, { useState } from 'react';
import { Icons } from './Icons.js';

/**
 * Navbar Component
 * ================
 * Clean, academic navigation bar. Displays logo, tagline, main links,
 * authenticated student status, and Admin Dashboard link when user is admin.
 */
export function Navbar({
  user,
  activeTab,
  onNavigate,
  onLogout
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user && user.role === 'admin';

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'resources', label: 'Resources' },
    { id: 'ai', label: 'StudySphere AI', badge: 'AI' },
    ...(user ? [
      { id: 'bookmarks', label: 'Bookmarks' },
      { id: 'dashboard', label: 'Dashboard' }
    ] : [])
  ];

  const handleLinkClick = (tabId) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Tagline */}
        <div
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 group-hover:bg-blue-700 flex items-center justify-center text-white shadow-sm transition-colors">
            <Icons.BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                StudySphere
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium hidden sm:block">
              Learn. Explore. Grow.
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Dashboard Button (Only visible for admin accounts) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Icons.Shield className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
          )}
        </nav>

        {/* User Auth Buttons / Profile Menu */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div
                onClick={() => handleLinkClick('dashboard')}
                className="cursor-pointer flex items-center gap-2"
                title="Go to Dashboard"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-600 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <Icons.LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLinkClick('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleLinkClick('register')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleLinkClick(link.id)}
              className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                activeTab === link.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => handleLinkClick('admin')}
              className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 flex items-center gap-2"
            >
              <Icons.Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          )}

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-600">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleLinkClick('login')}
                  className="w-full py-2 text-xs font-semibold text-center border border-slate-300 rounded-lg text-slate-700"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleLinkClick('register')}
                  className="w-full py-2 text-xs font-semibold text-center bg-blue-600 text-white rounded-lg"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
