import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectService, requirementService } from '../services/api';
import { 
  FolderKanban, 
  Map, 
  Layers, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Plus, 
  ArrowRight,
  Sparkles,
  BarChart3,
  CalendarRange,
  Cpu
} from 'lucide-react';

export const DashboardPage = () => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalEpics: 0,
    totalStories: 0,
    completedStories: 0,
    pendingStories: 0,
    totalPoints: 0,
    completedPoints: 0,
  });
  const [loading, setLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const projectList = await projectService.getAll();
      setProjects(projectList);

      let epicsSum = 0;
      let storiesSum = 0;
      let completedSum = 0;
      let pendingSum = 0;
      let pointsSum = 0;
      let compPointsSum = 0;

      // Accumulate stats for each project
      for (const p of projectList) {
        try {
          const s = await projectService.getStats(p.id);
          epicsSum += s.total_epics;
          storiesSum += s.total_stories;
          completedSum += s.completed_stories;
          pendingSum += s.pending_stories;
          pointsSum += s.total_story_points;
          compPointsSum += s.completed_story_points;
        } catch (e) {
          // Ignore individual project stat error
        }
      }

      setStats({
        totalProjects: projectList.length,
        totalEpics: epicsSum,
        totalStories: storiesSum,
        completedStories: completedSum,
        pendingStories: pendingSum,
        totalPoints: pointsSum,
        completedPoints: compPointsSum,
      });

      const ai = await requirementService.checkAiStatus();
      setAiStatus(ai);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const progressPct = stats.totalPoints > 0 ? Math.round((stats.completedPoints / stats.totalPoints) * 100) : 0;
  const storyCompletionPct = stats.totalStories > 0 ? Math.round((stats.completedStories / stats.totalStories) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating Agile Portfolio Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Agile Portfolio Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of your active software projects, story velocity, and local AI status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </Link>
        </div>
      </div>

      {/* Ollama Status Notice Banner if offline */}
      {aiStatus && !aiStatus.available && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 text-xs">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Ollama Local Engine Offline:</span> StoryForge AI can run locally without external cloud fees. Run <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">ollama serve</code> in your terminal to enable instant AI generation.
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded bg-amber-200/60 font-semibold">Local AI Mode</span>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Projects */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Projects</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalProjects}</span>
            <span className="text-xs font-semibold text-slate-500">active spaces</span>
          </div>
        </div>

        {/* Total Epics */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Domain Epics</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalEpics}</span>
            <span className="text-xs font-semibold text-slate-500">defined epics</span>
          </div>
        </div>

        {/* User Stories */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">User Stories</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Map className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalStories}</span>
            <span className="text-xs font-semibold text-emerald-600 font-bold">{stats.completedStories} done</span>
          </div>
        </div>

        {/* Story Points Delivered */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Velocity Progress</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{progressPct}%</span>
            <span className="text-xs font-semibold text-slate-500">
              {stats.completedPoints} / {stats.totalPoints} pts
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Story Completion Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Story Completion Ratio
            </h3>
            <span className="text-xs font-bold text-slate-500">{storyCompletionPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${storyCompletionPct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-900 text-base">{stats.completedStories}</span>
              <span className="text-slate-500">Completed Stories</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-900 text-base">{stats.pendingStories}</span>
              <span className="text-slate-500">Remaining Backlog</span>
            </div>
          </div>
        </div>

        {/* Story Point Burnup */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Story Points Velocity
            </h3>
            <span className="text-xs font-bold text-slate-500">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block font-bold text-blue-600 text-base">{stats.completedPoints}</span>
              <span className="text-slate-500">Points Burned</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block font-bold text-slate-900 text-base">{stats.totalPoints}</span>
              <span className="text-slate-500">Total Points Estimated</span>
            </div>
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-6 shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> AI Agile Copilot
            </div>
            <h3 className="text-base font-bold text-white">Generate a Full Story Map</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Describe your software in plain English. StoryForge deconstructs it into Epics, Tasks, and Given-When-Then stories.
            </p>
          </div>
          <div className="pt-4">
            <Link
              to="/projects/new"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md"
            >
              <span>Launch AI Project Creator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Projects</h2>
          <span className="text-xs text-slate-500 font-medium">{projects.length} Total Projects</span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No projects yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first project to experience AI-powered user story mapping and sprint planning.
            </p>
            <div className="pt-2">
              <Link
                to="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Project Name</th>
                  <th className="px-6 py-3.5">Target Audience</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Quick Navigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <Link to={`/projects/${project.id}/map`} className="hover:text-blue-600 flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{project.name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{project.target_audience || 'General Users'}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/projects/${project.id}/analyze`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
                      >
                        Analyzer
                      </Link>
                      <Link
                        to={`/projects/${project.id}/map`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition"
                      >
                        Story Map
                      </Link>
                      <Link
                        to={`/projects/${project.id}/sprints`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold transition"
                      >
                        Sprints
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
