import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/api';
import { FolderPlus, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export const CreateProjectPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goToAnalysis, setGoToAnalysis] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const newProject = await projectService.create({
        name,
        description,
        target_audience: targetAudience,
      });

      if (goToAnalysis) {
        navigate(`/projects/${newProject.id}/analyze`);
      } else {
        navigate(`/projects/${newProject.id}/map`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project. Please verify inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FolderPlus className="w-7 h-7 text-blue-600" /> Create New Agile Project
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up your workspace to map user journeys and generate structured Agile user stories.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 sm:p-8">
        {error && (
          <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HealthTracker AI Mobile App"
              className="w-full rounded-lg border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Target Audience & User Personas
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Fitness Enthusiasts, Personal Trainers, Dieticians"
              className="w-full rounded-lg border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Initial Vision or Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product goals, target outcomes, key features or problem statements..."
              className="w-full rounded-lg border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* AI Quick Pipeline Option */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <input
              type="checkbox"
              id="aiPipeline"
              checked={goToAnalysis}
              onChange={(e) => setGoToAnalysis(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="aiPipeline" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Continue to AI Requirement Analyzer immediately
              </span>
              Analyze the project vision with local Ollama AI to extract objectives, user personas, and functional requirements.
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              <span>{submitting ? 'Creating Project...' : 'Create Project'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
