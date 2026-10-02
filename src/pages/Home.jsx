import React, { useState } from 'react';
import { Icons } from '../components/Icons.js';
import { ResourceCard } from '../components/ResourceCard.js';
import { SubjectCard } from '../components/SubjectCard.js';

/**
 * Home Page Component
 * ===================
 * Welcomes students, presents clean search, subject cards,
 * and dynamically displays popular, top-rated, and recently added materials
 * strictly calculated from real database records with graceful empty states.
 */
export function Home({
  resources = [],
  user,
  onNavigate,
  onOpenResource,
  onToggleBookmark,
  bookmarkedIds = new Set(),
  completedIds = new Set()
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onNavigate('resources', { search: searchQuery });
  };

  const subjectsList = [
    'Engineering Physics',
    'Engineering Mathematics',
    'Programming / C',
    'Electrical Engineering',
    'Engineering Chemistry'
  ];

  const getSubjectStats = (subjectName) => {
    const list = resources.filter((r) => r.subject === subjectName);
    return {
      notes: list.filter((r) => r.type === 'pdf').length,
      lectures: list.filter((r) => r.type === 'lecture').length
    };
  };

  // Popular resources (weighted ranking score on real data)
  const popularResources = [...resources]
    .sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0))
    .slice(0, 4);

  // Top-rated resources (only those with at least 1 actual rating)
  const topRatedResources = [...resources]
    .filter((r) => (r.rating_count || 0) > 0)
    .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    .slice(0, 4);

  // Recently added resources
  const recentResources = [...resources]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            <Icons.Sparkles className="w-3.5 h-3.5" />
            <span>Undergraduate Study Hub • Learn. Explore. Grow.</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Your study material, <br />
            <span className="text-blue-600">all in one place.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Browse course notes, watch video lectures organized by subject,
            rate materials, and ask questions to StudySphere AI.
          </p>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto relative flex items-center shadow-md rounded-2xl bg-white border border-slate-200 p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
          >
            <div className="pl-3.5 text-slate-400">
              <Icons.Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lectures, notes, quantum physics, eigenvalues, C pointers..."
              className="w-full px-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-colors"
            >
              <span>Explore Resources</span>
              <Icons.ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ai')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl shadow-sm transition-colors"
            >
              <Icons.Bot className="w-4 h-4 text-blue-600" />
              <span>Ask StudySphere AI</span>
            </button>
          </div>
        </div>
      </section>

      {/* Subject Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Subject Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Core undergraduate syllabus subjects with notes and video lectures.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('subjects')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Subjects</span>
            <Icons.ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjectsList.map((subject) => {
            const stats = getSubjectStats(subject);
            return (
              <SubjectCard
                key={subject}
                subject={subject}
                notesCount={stats.notes}
                lecturesCount={stats.lectures}
                onClick={() => onNavigate('subjects', { subject })}
              />
            );
          })}
        </div>
      </section>

      {/* Popular Resources Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Popular Resources
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ranked dynamically by student ratings and view activity.
            </p>
          </div>

          {popularResources.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('resources', { sort: 'popular' })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>See more</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {popularResources.length === 0 ? (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">No resources available yet.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Materials uploaded by course administrators will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {popularResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onOpenResource={onOpenResource}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={bookmarkedIds.has(res.id)}
                isCompleted={completedIds.has(res.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top-Rated Lectures & Notes */}
      {topRatedResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Top-Rated Lectures & Notes ⭐
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Highest rated materials based on verified student reviews.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('resources', { sort: 'highest_rated' })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>See more</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topRatedResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onOpenResource={onOpenResource}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={bookmarkedIds.has(res.id)}
                isCompleted={completedIds.has(res.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added Section */}
      {recentResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Recently Added Resources
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Latest study materials and lectures published to the platform.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('resources', { sort: 'newest' })}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Browse all</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onOpenResource={onOpenResource}
                onToggleBookmark={onToggleBookmark}
                isBookmarked={bookmarkedIds.has(res.id)}
                isCompleted={completedIds.has(res.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Logged-Out Callout */}
      {!user && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold">
                Join your classmates on StudySphere
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                Create a student profile to save bookmarks, submit ratings, track read progress, and chat with StudySphere AI.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
