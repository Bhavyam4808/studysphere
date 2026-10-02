import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons.js';
import { RatingStars } from '../components/RatingStars.js';
import { api } from '../api.js';

/**
 * AdminDashboard Page Component
 * ==============================
 * Dedicated administrative workspace for course staff.
 * Gated strictly to users with role === 'admin'.
 * 
 * Sections:
 *   1. Resources:
 *      - [ Upload Notes ]
 *      - [ Upload Lecture ]
 *      - [ Manage Resources ] (Search, filter by subject, edit, delete with confirmation)
 *   2. Users:
 *      - [ Login History ] (Real login events only)
 *      - [ Registered Students ] (Real student profiles without sensitive credentials)
 */
export function AdminDashboard({
  user,
  resources = [],
  onRefreshResources,
  onShowToast
}) {
  // Navigation tabs: 'manage', 'upload_notes', 'upload_lecture', 'login_history', 'registered_students'
  const [activeTab, setActiveTab] = useState('manage');

  // Real data state
  const [loginHistory, setLoginHistory] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Search & filter state for Manage Resources
  const [manageSearch, setManageSearch] = useState('');
  const [manageSubjectFilter, setManageSubjectFilter] = useState('All');

  // Form state for Uploading Notes
  const [noteForm, setNoteForm] = useState({
    title: '',
    subject: 'Engineering Physics',
    unit: '',
    description: '',
    tags: '',
    pdfFile: null
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Form state for Uploading Lecture
  const [lectureForm, setLectureForm] = useState({
    title: '',
    subject: 'Engineering Physics',
    unit: '',
    description: '',
    tags: '',
    videoUrl: ''
  });

  // Edit resource modal state
  const [editingResource, setEditingResource] = useState(null);
  const [deleteConfirmResource, setDeleteConfirmResource] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Login History when tab is active
  useEffect(() => {
    if (activeTab === 'login_history') {
      fetchLoginHistory();
    } else if (activeTab === 'registered_students') {
      fetchRegisteredUsers();
    }
  }, [activeTab]);

  const fetchLoginHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.adminGetLoginHistory();
      setLoginHistory(data.loginHistory || []);
    } catch (err) {
      onShowToast(err.message || 'Failed to load login history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await api.adminGetUsers();
      setRegisteredUsers(data.users || []);
    } catch (err) {
      onShowToast(err.message || 'Failed to load registered students.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Authorization Guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Icons.Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-600">
          This portal is reserved strictly for faculty and course administrators. Your current account does not have administrator privileges.
        </p>
      </div>
    );
  }

  const subjects = [
    'Engineering Physics',
    'Engineering Mathematics',
    'Programming / C',
    'Electrical Engineering',
    'Engineering Chemistry',
    'Other'
  ];

  // Handle Note PDF upload submission
  const handleUploadNotes = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.unit.trim() || !noteForm.description.trim()) {
      onShowToast('Please fill in Title, Subject, Unit, and Description.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let finalFileUrl = '';
      let extractedText = '';

      if (noteForm.pdfFile) {
        setUploadingPdf(true);
        const uploadRes = await api.adminUploadPdf(noteForm.pdfFile);
        finalFileUrl = uploadRes.fileUrl;
        extractedText = uploadRes.extractedText || '';
        setUploadingPdf(false);
      }

      await api.adminCreateResource({
        title: noteForm.title.trim(),
        subject: noteForm.subject,
        unit: noteForm.unit.trim(),
        type: 'pdf',
        description: noteForm.description.trim(),
        fileUrl: finalFileUrl,
        tags: noteForm.tags.trim(),
        contentText: extractedText
      });

      onShowToast('Note uploaded successfully.', 'success');
      setNoteForm({
        title: '',
        subject: 'Engineering Physics',
        unit: '',
        description: '',
        tags: '',
        pdfFile: null
      });
      setActiveTab('manage');
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to upload note.', 'error');
    } finally {
      setSubmitting(false);
      setUploadingPdf(false);
    }
  };

  // Handle Lecture video submission
  const handleUploadLecture = async (e) => {
    e.preventDefault();
    if (!lectureForm.title.trim() || !lectureForm.unit.trim() || !lectureForm.videoUrl.trim() || !lectureForm.description.trim()) {
      onShowToast('Please fill in Lecture Title, Subject, Unit, Video URL, and Description.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.adminCreateResource({
        title: lectureForm.title.trim(),
        subject: lectureForm.subject,
        unit: lectureForm.unit.trim(),
        type: 'lecture',
        description: lectureForm.description.trim(),
        videoUrl: lectureForm.videoUrl.trim(),
        tags: lectureForm.tags.trim(),
        contentText: `${lectureForm.title}. ${lectureForm.description}`
      });

      onShowToast('Lecture added successfully.', 'success');
      setLectureForm({
        title: '',
        subject: 'Engineering Physics',
        unit: '',
        description: '',
        tags: '',
        videoUrl: ''
      });
      setActiveTab('manage');
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to publish lecture.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit submission
  const handleUpdateResource = async (e) => {
    e.preventDefault();
    if (!editingResource) return;

    setSubmitting(true);
    try {
      await api.adminUpdateResource(editingResource.id, editingResource);
      onShowToast('Resource information updated successfully.', 'success');
      setEditingResource(null);
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to update resource.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete confirmation
  const handleDeleteResource = async (id) => {
    setSubmitting(true);
    try {
      await api.adminDeleteResource(id);
      onShowToast('Resource deleted successfully.', 'success');
      setDeleteConfirmResource(null);
      onRefreshResources();
    } catch (err) {
      onShowToast(err.message || 'Failed to delete resource.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered resources for Manage Resources tab
  const filteredManageResources = resources.filter((res) => {
    if (manageSubjectFilter !== 'All' && res.subject !== manageSubjectFilter) return false;
    if (manageSearch.trim()) {
      const q = manageSearch.toLowerCase();
      const matchTitle = res.title?.toLowerCase().includes(q);
      const matchUnit = res.unit?.toLowerCase().includes(q);
      const matchTags = res.tags?.toLowerCase().includes(q);
      if (!matchTitle && !matchUnit && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-100 text-amber-800">
              <Icons.Shield className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Authenticated administrator: <strong>{user.email}</strong>
          </p>
        </div>

        {/* Navigation Sections */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden lg:block">
            Resources:
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manage'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manage Resources
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload_notes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'upload_notes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Upload Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload_lecture')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'upload_lecture'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            Upload Lecture
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden lg:block">
            Users:
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('login_history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'login_history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.Eye className="w-3.5 h-3.5" />
            Login History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('registered_students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'registered_students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icons.User className="w-3.5 h-3.5" />
            Registered Students
          </button>
        </div>
      </div>

      {/* SECTION 1: MANAGE RESOURCES */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Uploaded Resources ({resources.length})
              </h2>
              <p className="text-xs text-slate-500">
                Search, filter by subject, edit details, or remove study materials.
              </p>
            </div>

            {/* Quick Filter & Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manageSearch}
                  onChange={(e) => setManageSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                />
              </div>

              <select
                value={manageSubjectFilter}
                onChange={(e) => setManageSubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="All">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredManageResources.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Icons.FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No resources found.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {resources.length === 0
                  ? "No materials have been uploaded yet. Click 'Upload Notes' or 'Upload Lecture' to publish your first resource."
                  : "No resources matched your current filter criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Title & Unit</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Ratings</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredManageResources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {res.title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {res.unit}
                        </p>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-800">
                        {res.subject}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            res.type === 'pdf'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {res.type === 'pdf' ? '📄 Notes' : '🎥 Lecture'}
                        </span>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <RatingStars rating={res.average_rating} count={res.rating_count} size="w-3.5 h-3.5" />
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap font-semibold text-slate-800">
                        {res.view_count || 0}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingResource({ ...res })}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmResource(res)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: UPLOAD NOTES */}
      {activeTab === 'upload_notes' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Study Notes
            </h2>
            <p className="text-xs text-slate-500">
              Attach course syllabus notes in PDF format. Text is automatically indexed for StudySphere AI.
            </p>
          </div>

          <form onSubmit={handleUploadNotes} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="e.g. Quantum Physics — Photoelectric Effect Notes"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={noteForm.subject}
                  onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={noteForm.unit}
                  onChange={(e) => setNoteForm({ ...noteForm, unit: e.target.value })}
                  placeholder="e.g. Unit 1: Quantum Mechanics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PDF File (.pdf)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setNoteForm({ ...noteForm, pdfFile: e.target.files[0] })}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Maximum file size: 10MB.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={noteForm.description}
                onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                placeholder="Summary of formulas, derivations, and exam topics covered..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={noteForm.tags}
                onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                placeholder="e.g. quantum, physics, exam notes"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                {uploadingPdf ? 'Uploading PDF...' : submitting ? 'Saving...' : 'Upload Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: UPLOAD LECTURE */}
      {activeTab === 'upload_lecture' && (
        <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Video Lecture
            </h2>
            <p className="text-xs text-slate-500">
              Add curated video lectures or YouTube links for undergraduate subjects.
            </p>
          </div>

          <form onSubmit={handleUploadLecture} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lecture Title *
              </label>
              <input
                type="text"
                required
                value={lectureForm.title}
                onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                placeholder="e.g. Compton Scattering & Wave Hypothesis Masterclass"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={lectureForm.subject}
                  onChange={(e) => setLectureForm({ ...lectureForm, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={lectureForm.unit}
                  onChange={(e) => setLectureForm({ ...lectureForm, unit: e.target.value })}
                  placeholder="e.g. Unit 1: Quantum Mechanics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Video URL (YouTube or MP4) *
              </label>
              <input
                type="url"
                required
                value={lectureForm.videoUrl}
                onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={lectureForm.description}
                onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                placeholder="Overview of lecture topics and concepts..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={lectureForm.tags}
                onChange={(e) => setLectureForm({ ...lectureForm, tags: e.target.value })}
                placeholder="e.g. compton, scattering, wave hypothesis"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                {submitting ? 'Publishing...' : 'Add Lecture'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 4: LOGIN HISTORY (Real login events) */}
      {activeTab === 'login_history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Login History
              </h2>
              <p className="text-xs text-slate-500">
                Recorded whenever a registered user logs into the website. Real events only.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLoginHistory}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Refresh
            </button>
          </div>

          {loadingHistory ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading login events...</div>
          ) : loginHistory.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No login history recorded yet.</p>
              <p className="text-xs text-slate-400">Login events will appear here as users sign in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">User Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Login Date</th>
                    <th className="px-6 py-3">Login Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loginHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {item.user_name}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {item.email}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {item.login_date}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-500">
                        {item.login_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 5: REGISTERED STUDENTS */}
      {activeTab === 'registered_students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registered Students
              </h2>
              <p className="text-xs text-slate-500">
                Real student accounts created on the platform. Passwords and credentials are never shown.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchRegisteredUsers}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Refresh
            </button>
          </div>

          {loadingUsers ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading student list...</div>
          ) : registeredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No registered students yet.</p>
              <p className="text-xs text-slate-400">Student accounts will appear here once they sign up.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registeredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {u.email}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {u.joinedFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDIT RESOURCE MODAL */}
      {editingResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Edit Resource Information
              </h3>
              <button
                type="button"
                onClick={() => setEditingResource(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateResource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingResource.title}
                  onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={editingResource.subject}
                    onChange={(e) => setEditingResource({ ...editingResource, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={editingResource.unit}
                    onChange={(e) => setEditingResource({ ...editingResource, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingResource.description}
                  onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={editingResource.tags || ''}
                  onChange={(e) => setEditingResource({ ...editingResource, tags: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmResource && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Icons.Trash className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Confirm Resource Deletion
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this resource?
            </p>
            <p className="text-xs font-semibold text-slate-900 bg-slate-100 p-2 rounded-lg">
              "{deleteConfirmResource.title}"
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmResource(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteResource(deleteConfirmResource.id)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
