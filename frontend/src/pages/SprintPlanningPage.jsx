import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sprintService, storyService } from '../services/api';
import { PriorityBadge, PointsBadge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { 
  CalendarRange, 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';

export const SprintPlanningPage = () => {
  const { projectId } = useParams();
  const [sprints, setSprints] = useState([]);
  const [backlogStories, setBacklogStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create/Edit Sprint Modal
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintCapacity, setSprintCapacity] = useState(20);
  const [sprintStatus, setSprintStatus] = useState('PLANNED');

  // AI Sprint Planner Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [velocity, setVelocity] = useState(20);
  const [sprintCount, setSprintCount] = useState(3);
  const [planningAi, setPlanningAi] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState(null);

  useEffect(() => {
    loadSprintData();
  }, [projectId]);

  const loadSprintData = async () => {
    setLoading(true);
    setError('');
    try {
      if (projectId) {
        const [spList, allStories] = await Promise.all([
          sprintService.getByProject(projectId),
          storyService.listByProject(projectId),
        ]);
        setSprints(spList);
        setBacklogStories(allStories.filter((s) => !s.sprint_id));
      }
    } catch (err) {
      console.error('Failed to load sprints:', err);
      setError('Failed to load sprint planning board.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateSprint = () => {
    setEditingSprint(null);
    setSprintName(`Sprint ${sprints.length + 1}`);
    setSprintGoal('');
    setSprintCapacity(20);
    setSprintStatus('PLANNED');
    setIsSprintModalOpen(true);
  };

  const handleOpenEditSprint = (sprint) => {
    setEditingSprint(sprint);
    setSprintName(sprint.name);
    setSprintGoal(sprint.goal || '');
    setSprintCapacity(sprint.capacity_points);
    setSprintStatus(sprint.status);
    setIsSprintModalOpen(true);
  };

  const handleSaveSprint = async (e) => {
    e.preventDefault();
    try {
      if (editingSprint) {
        await sprintService.update(editingSprint.id, {
          name: sprintName,
          goal: sprintGoal,
          capacity_points: parseInt(sprintCapacity),
          status: sprintStatus,
        });
      } else {
        await sprintService.create({
          project_id: parseInt(projectId),
          name: sprintName,
          goal: sprintGoal,
          capacity_points: parseInt(sprintCapacity),
        });
      }
      setIsSprintModalOpen(false);
      loadSprintData();
    } catch (err) {
      alert('Failed to save sprint.');
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm('Delete this sprint? Stories will return to the backlog.')) return;
    try {
      await sprintService.delete(sprintId);
      loadSprintData();
    } catch (err) {
      alert('Failed to delete sprint.');
    }
  };

  const handleAssignStory = async (storyId, sprintId) => {
    try {
      await sprintService.assignStory(storyId, sprintId);
      loadSprintData();
    } catch (err) {
      alert('Failed to assign story.');
    }
  };

  const handleRunAiPlanner = async () => {
    setPlanningAi(true);
    setError('');
    try {
      const result = await sprintService.generateAIPlan(
        parseInt(projectId),
        parseInt(velocity),
        parseInt(sprintCount)
      );
      setAiPlanResult(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'AI sprint planning failed.');
    } finally {
      setPlanningAi(false);
    }
  };

  const handleApplyAiPlan = async () => {
    if (!aiPlanResult) return;
    setPlanningAi(true);
    try {
      for (const spItem of aiPlanResult.sprints) {
        // Create sprint if not already existing
        const newSprint = await sprintService.create({
          project_id: parseInt(projectId),
          name: spItem.sprint_name,
          goal: spItem.sprint_goal,
          capacity_points: parseInt(velocity),
        });

        // Assign the stories
        for (const storyId of spItem.story_ids) {
          try {
            await sprintService.assignStory(storyId, newSprint.id);
          } catch (e) {
            // Ignore if story id not found
          }
        }
      }
      setIsAiModalOpen(false);
      setAiPlanResult(null);
      setSuccessMsg('AI sprint plan successfully applied!');
      loadSprintData();
    } catch (err) {
      alert('Failed to apply sprint plan.');
    } finally {
      setPlanningAi(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Calculating sprint capacity allocations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarRange className="w-7 h-7 text-blue-600" /> Sprint Planning & Capacity Manager
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Group user stories into sprint iterations respecting story points velocity, or utilize AI to propose balanced plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Sprint Optimizer</span>
          </button>

          <button
            onClick={handleOpenCreateSprint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sprint</span>
          </button>
        </div>
      </div>

      {/* Agile Disclaimer Note */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-2.5 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Scrum Best Practice:</strong> AI-generated plans are heuristic recommendations based on velocity and story estimates. Team velocity and priorities should always be reviewed during Sprint Planning.
        </span>
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

      {/* Sprints Board & Backlog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sprints List */}
        <div className="lg:col-span-8 space-y-5">
          {sprints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-card space-y-3">
              <CalendarRange className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No active sprints defined</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a sprint or run the AI Sprint Optimizer to distribute your backlog stories into balanced sprints.
              </p>
              <button
                onClick={handleOpenCreateSprint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Sprint
              </button>
            </div>
          ) : (
            sprints.map((sprint) => {
              const assignedPts = sprint.total_assigned_points || 0;
              const cap = sprint.capacity_points || 20;
              const pct = Math.min(100, Math.round((assignedPts / cap) * 100));
              const isOverCapacity = assignedPts > cap;

              return (
                <div
                  key={sprint.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4"
                >
                  {/* Sprint Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">{sprint.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          sprint.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sprint.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {sprint.status}
                        </span>
                      </div>
                      {sprint.goal && (
                        <p className="text-xs text-slate-500 italic">Goal: {sprint.goal}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditSprint(sprint)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
                        title="Edit sprint"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSprint(sprint.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                        title="Delete sprint"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Velocity Meter */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Capacity Utilization</span>
                      <span className={isOverCapacity ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                        {assignedPts} / {cap} Story Points ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isOverCapacity ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stories inside Sprint */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Assigned User Stories ({sprint.stories?.length || 0})
                    </span>

                    {sprint.stories?.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        No stories assigned to this sprint yet. Choose stories from the Backlog on the right.
                      </div>
                    ) : (
                      sprint.stories.map((story) => (
                        <div
                          key={story.id}
                          className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <PointsBadge points={story.story_points} />
                            <div>
                              <span className="font-bold text-slate-900 block">{story.title}</span>
                              <span className="text-[11px] text-slate-500">
                                As a {story.role}, I want {story.action}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={story.priority} />
                            <button
                              onClick={() => handleAssignStory(story.id, 0)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-slate-100 transition"
                            >
                              Move to Backlog
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Unassigned Backlog Stories */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" /> Backlog Queue ({backlogStories.length})
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {backlogStories.reduce((acc, s) => acc + (s.story_points || 0), 0)} pts total
            </span>
          </div>

          {backlogStories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700">All Stories Assigned!</p>
              <p className="text-[11px]">There are no unassigned stories in the project backlog.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {backlogStories.map((story) => (
                <div
                  key={story.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 leading-snug">{story.title}</span>
                    <PointsBadge points={story.story_points} />
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    As a {story.role}, I want {story.action}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <PriorityBadge priority={story.priority} />

                    {sprints.length > 0 && (
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleAssignStory(story.id, parseInt(val));
                        }}
                        defaultValue=""
                        className="text-[10px] font-semibold bg-white border border-slate-300 rounded px-1.5 py-1 text-blue-600 focus:outline-none"
                      >
                        <option value="" disabled>Assign Sprint...</option>
                        {sprints.map((sp) => (
                          <option key={sp.id} value={sp.id}>{sp.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create/Edit Sprint */}
      <Modal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        title={editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsSprintModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSprint}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
            >
              Save Sprint
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveSprint} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Name</label>
            <input
              type="text"
              required
              value={sprintName}
              onChange={(e) => setSprintName(e.target.value)}
              placeholder="e.g. Sprint 1: Onboarding MVP"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Goal</label>
            <textarea
              rows={2}
              value={sprintGoal}
              onChange={(e) => setSprintGoal(e.target.value)}
              placeholder="Deliver core user registration and login workflows..."
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Velocity (Points)</label>
              <input
                type="number"
                min={5}
                max={100}
                required
                value={sprintCapacity}
                onChange={(e) => setSprintCapacity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Status</label>
              <select
                value={sprintStatus}
                onChange={(e) => setSprintStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: AI Sprint Optimizer */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI-Assisted Sprint Optimizer"
        maxWidth="max-w-2xl"
        footer={
          aiPlanResult ? (
            <>
              <button
                type="button"
                onClick={() => setAiPlanResult(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Re-configure
              </button>
              <button
                type="button"
                onClick={handleApplyAiPlan}
                disabled={planningAi}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
              >
                Apply AI Plan to Project
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunAiPlanner}
                disabled={planningAi}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
              >
                {planningAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Optimizing Sprints...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Sprint Plan</span>
                  </>
                )}
              </button>
            </>
          )
        }
      >
        {!aiPlanResult ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Ollama AI will evaluate all backlog user stories, prioritize Critical and High-priority items, and distribute them into sprints respecting your team's velocity limit.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team Velocity (Points / Sprint)
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Sprint Iterations
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={sprintCount}
                  onChange={(e) => setSprintCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
              <strong>Notice:</strong> AI plans are recommendations to help fast-track team planning sessions, not immutable mandates.
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-900">
              <strong className="block mb-0.5">AI Planning Rationale:</strong>
              {aiPlanResult.rationale}
            </div>

            <div className="space-y-3">
              {aiPlanResult.sprints.map((sp, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{sp.sprint_name}</span>
                    <span className="text-slate-500 font-semibold">{sp.story_ids?.length || 0} stories allocated</span>
                  </div>
                  <p className="text-slate-600 italic">{sp.sprint_goal}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
