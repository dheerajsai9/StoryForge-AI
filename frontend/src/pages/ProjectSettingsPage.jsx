import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, exportService } from '../services/api';
import { 
  Settings, 
  FileSpreadsheet, 
  FileJson, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Save,
  ArrowDownToLine
} from 'lucide-react';

export const ProjectSettingsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      if (projectId) {
        const p = await projectService.getById(projectId);
        setProject(p);
        setName(p.name);
        setDescription(p.description || '');
        setTargetAudience(p.target_audience || '');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await projectService.update(projectId, {
        name,
        description,
        target_audience: targetAudience,
      });
      setSuccessMsg('Project settings updated successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update project.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to delete this project and all associated stories, epics, and sprints? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await projectService.delete(projectId);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete project.');
      setDeleting(false);
    }
  };

  const handleExport = async (type) => {
    setDownloading(type);
    setError('');
    try {
      if (type === 'story-map-csv') {
        await exportService.downloadFile(
          exportService.getStoryMapCsvUrl(projectId),
          `${name.replace(/\s+/g, '_').toLowerCase()}_story_map.csv`
        );
      } else if (type === 'sprints-csv') {
        await exportService.downloadFile(
          exportService.getSprintCsvUrl(projectId),
          `${name.replace(/\s+/g, '_').toLowerCase()}_sprints.csv`
        );
      } else if (type === 'project-json') {
        await exportService.downloadFile(
          exportService.getProjectJsonUrl(projectId),
          `${name.replace(/\s+/g, '_').toLowerCase()}_project_backup.json`
        );
      }
    } catch (err) {
      setError('Export download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading project settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" /> Project Settings & Data Export
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage project configuration, download Agile export artifacts, or archive workspace.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          General Project Information
        </h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Description / Scope</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Feature 7: Export Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Agile Data Export</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export your structured project artifacts for external issue trackers or archival backups.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Story Map CSV */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">User Story Map (CSV)</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Full export of Epics, Activities, Tasks, Stories, Acceptance Criteria, Points, and Priorities.
              </p>
            </div>
            <button
              onClick={() => handleExport('story-map-csv')}
              disabled={downloading === 'story-map-csv'}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{downloading === 'story-map-csv' ? 'Exporting...' : 'Export Map CSV'}</span>
            </button>
          </div>

          {/* Sprint Plan CSV */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Sprint Plans (CSV)</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Iteration schedules, sprint goals, capacities, and assigned user stories for Scrum tracking.
              </p>
            </div>
            <button
              onClick={() => handleExport('sprints-csv')}
              disabled={downloading === 'sprints-csv'}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{downloading === 'sprints-csv' ? 'Exporting...' : 'Export Sprints CSV'}</span>
            </button>
          </div>

          {/* Full Project JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileJson className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Full Project Backup (JSON)</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Complete relational JSON dump including raw requirements, analysis, and story map hierarchy.
              </p>
            </div>
            <button
              onClick={() => handleExport('project-json')}
              disabled={downloading === 'project-json'}
              className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'project-json' ? 'Exporting...' : 'Export JSON Backup'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Project */}
      <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-rose-900">Danger Zone</h2>
          <p className="text-xs text-rose-700 mt-0.5">
            Permanently delete this project along with all generated epics, stories, and sprint assignments.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-rose-600 font-medium">
            This action cannot be undone.
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Deleting...' : 'Delete Project Permanently'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
