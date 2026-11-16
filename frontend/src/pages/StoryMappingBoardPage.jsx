import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storyService, projectService, sprintService } from '../services/api';
import { PriorityBadge, StatusBadge, PointsBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { 
  Map, 
  Plus, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Wand2, 
  Filter, 
  Layers, 
  CheckCircle,
  AlertCircle,
  GripVertical
} from 'lucide-react';

export const StoryMappingBoardPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [storyMap, setStoryMap] = useState({ epics: [], unassigned_stories: [] });
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRelease, setSelectedRelease] = useState('ALL');

  // Modal states
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [targetTaskId, setTargetTaskId] = useState(null);

  // Form fields for story create/edit
  const [storyTitle, setStoryTitle] = useState('');
  const [storyRole, setStoryRole] = useState('User');
  const [storyAction, setStoryAction] = useState('');
  const [storyBenefit, setStoryBenefit] = useState('');
  const [storyPoints, setStoryPoints] = useState(3);
  const [storyPriority, setStoryPriority] = useState('MEDIUM');
  const [storyStatus, setStoryStatus] = useState('BACKLOG');
  const [storyRelease, setStoryRelease] = useState('MVP Release');
  const [storySprintId, setStorySprintId] = useState('');
  const [acceptanceCriteriaText, setAcceptanceCriteriaText] = useState('');

  // Manual Epic / Activity / Task modal state
  const [isHierarchyModalOpen, setIsHierarchyModalOpen] = useState(false);
  const [hierarchyType, setHierarchyType] = useState('epic'); // epic, activity, task
  const [hierarchyParentId, setHierarchyParentId] = useState(null);
  const [hierarchyTitle, setHierarchyTitle] = useState('');

  // Drag and drop state
  const [draggedStoryId, setDraggedStoryId] = useState(null);

  useEffect(() => {
    loadBoardData();
  }, [projectId]);

  const loadBoardData = async () => {
    setLoading(true);
    setError('');
    try {
      if (projectId) {
        const [proj, map, spList] = await Promise.all([
          projectService.getById(projectId),
          storyService.getStoryMap(projectId),
          sprintService.getByProject(projectId),
        ]);
        setProject(proj);
        setStoryMap(map);
        setSprints(spList);
      }
    } catch (err) {
      console.error('Failed to load story map:', err);
      setError('Failed to load user story mapping board.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddStory = (taskId = null) => {
    setEditingStory(null);
    setTargetTaskId(taskId);
    setStoryTitle('');
    setStoryRole('User');
    setStoryAction('');
    setStoryBenefit('');
    setStoryPoints(3);
    setStoryPriority('MEDIUM');
    setStoryStatus('BACKLOG');
    setStoryRelease('MVP Release');
    setStorySprintId('');
    setAcceptanceCriteriaText('');
    setIsStoryModalOpen(true);
  };

  const handleOpenEditStory = (story) => {
    setEditingStory(story);
    setTargetTaskId(story.task_id);
    setStoryTitle(story.title);
    setStoryRole(story.role);
    setStoryAction(story.action);
    setStoryBenefit(story.benefit);
    setStoryPoints(story.story_points);
    setStoryPriority(story.priority);
    setStoryStatus(story.status);
    setStoryRelease(story.release_tag);
    setStorySprintId(story.sprint_id ? String(story.sprint_id) : '');
    setAcceptanceCriteriaText(
      Array.isArray(story.acceptance_criteria)
        ? story.acceptance_criteria.join('\n')
        : story.acceptance_criteria || ''
    );
    setIsStoryModalOpen(true);
  };

  const handleSaveStory = async (e) => {
    e.preventDefault();
    const acArray = acceptanceCriteriaText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      if (editingStory) {
        await storyService.updateStory(editingStory.id, {
          title: storyTitle,
          role: storyRole,
          action: storyAction,
          benefit: storyBenefit,
          story_points: parseInt(storyPoints),
          priority: storyPriority,
          status: storyStatus,
          release_tag: storyRelease,
          sprint_id: storySprintId ? parseInt(storySprintId) : null,
          acceptance_criteria: acArray,
        });
      } else {
        await storyService.createStory({
          project_id: parseInt(projectId),
          task_id: targetTaskId,
          title: storyTitle,
          role: storyRole,
          action: storyAction,
          benefit: storyBenefit,
          story_points: parseInt(storyPoints),
          priority: storyPriority,
          status: storyStatus,
          release_tag: storyRelease,
          sprint_id: storySprintId ? parseInt(storySprintId) : null,
          acceptance_criteria: acArray,
        });
      }
      setIsStoryModalOpen(false);
      loadBoardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save story.');
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this user story?')) return;
    try {
      await storyService.deleteStory(storyId);
      loadBoardData();
    } catch (err) {
      alert('Failed to delete story.');
    }
  };

  // Hierarchy creation (Epic, Activity, Task)
  const handleOpenAddHierarchy = (type, parentId = null) => {
    setHierarchyType(type);
    setHierarchyParentId(parentId);
    setHierarchyTitle('');
    setIsHierarchyModalOpen(true);
  };

  const handleSaveHierarchy = async (e) => {
    e.preventDefault();
    if (!hierarchyTitle.trim()) return;
    try {
      if (hierarchyType === 'epic') {
        await storyService.createEpic({
          project_id: parseInt(projectId),
          title: hierarchyTitle,
        });
      } else if (hierarchyType === 'activity') {
        await storyService.createActivity({
          project_id: parseInt(projectId),
          epic_id: hierarchyParentId,
          title: hierarchyTitle,
        });
      } else if (hierarchyType === 'task') {
        await storyService.createTask({
          project_id: parseInt(projectId),
          activity_id: hierarchyParentId,
          title: hierarchyTitle,
        });
      }
      setIsHierarchyModalOpen(false);
      loadBoardData();
    } catch (err) {
      alert('Failed to create item.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, storyId) => {
    setDraggedStoryId(storyId);
    e.dataTransfer.setData('text/plain', String(storyId));
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleDropOnTask = async (e, targetTaskId) => {
    e.preventDefault();
    const storyId = e.dataTransfer.getData('text/plain') || draggedStoryId;
    if (!storyId) return;

    try {
      await storyService.updateStory(parseInt(storyId), {
        task_id: targetTaskId,
      });
      loadBoardData();
    } catch (err) {
      console.error('Failed to move story:', err);
    } finally {
      setDraggedStoryId(null);
    }
  };

  // Filter stories by release tag
  const filterStory = (story) => {
    if (selectedRelease === 'ALL') return true;
    return (story.release_tag || 'MVP Release') === selectedRelease;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Constructing 2D User Story Map...</p>
      </div>
    );
  }

  const allEpics = storyMap.epics || [];
  const hasContent = allEpics.length > 0 || (storyMap.unassigned_stories && storyMap.unassigned_stories.length > 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Map className="w-6 h-6 text-blue-600" /> User Story Mapping Board
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
              2D Backbone
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Horizontal user journey (Epics → Activities → Tasks) with vertical prioritization & drag-and-drop assignment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Release Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedRelease}
              onChange={(e) => setSelectedRelease(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-700"
            >
              <option value="ALL">All Releases</option>
              <option value="MVP Release">MVP Release</option>
              <option value="Release 2.0">Release 2.0</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenAddHierarchy('epic')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Epic</span>
          </button>

          <button
            onClick={() => handleOpenAddStory(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User Story</span>
          </button>

          <Link
            to={`/projects/${projectId}/analyze`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Generator</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Story Board Content */}
      {!hasContent ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-card space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Map className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Your Story Map is Empty</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate an entire user story hierarchy automatically using Ollama AI from your requirements, or start creating Epics and Stories manually.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/projects/${projectId}/analyze`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with Local Ollama AI</span>
            </Link>
            <button
              onClick={() => handleOpenAddHierarchy('epic')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Add First Epic Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="inline-flex min-w-full space-x-6 items-start">
            {allEpics.map((epic) => (
              <div
                key={epic.id}
                className="flex-shrink-0 w-80 bg-slate-100/80 rounded-2xl border border-slate-200 p-3.5 space-y-3"
              >
                {/* Epic Header Card */}
                <div className="p-3.5 rounded-xl bg-blue-900 text-white shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      Domain Epic
                    </span>
                    <button
                      onClick={() => handleOpenAddHierarchy('activity', epic.id)}
                      className="text-[11px] font-semibold text-blue-200 hover:text-white hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Activity
                    </button>
                  </div>
                  <h3 className="font-extrabold text-sm leading-snug">{epic.title}</h3>
                  {epic.description && (
                    <p className="text-[11px] text-blue-200 line-clamp-2">{epic.description}</p>
                  )}
                </div>

                {/* User Activities within Epic */}
                <div className="space-y-4">
                  {epic.activities?.map((activity) => (
                    <div key={activity.id} className="space-y-3 bg-white/70 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          {activity.title}
                        </span>
                        <button
                          onClick={() => handleOpenAddHierarchy('task', activity.id)}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Task
                        </button>
                      </div>

                      {/* User Tasks within Activity */}
                      <div className="space-y-3">
                        {activity.tasks?.map((task) => {
                          const visibleStories = (task.stories || []).filter(filterStory);
                          return (
                            <div
                              key={task.id}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDropOnTask(e, task.id)}
                              className="bg-slate-50/90 rounded-lg p-2.5 border border-slate-200 space-y-2 transition-colors duration-150 hover:border-blue-300"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 truncate" title={task.title}>
                                  📋 {task.title}
                                </span>
                                <button
                                  onClick={() => handleOpenAddStory(task.id)}
                                  className="text-[10px] text-blue-600 hover:underline font-bold"
                                  title="Add Story under this task"
                                >
                                  + Story
                                </button>
                              </div>

                              {/* Stories Droppable Zone */}
                              <div className="space-y-2 min-h-[40px] pt-1">
                                {visibleStories.map((story) => (
                                  <div
                                    key={story.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, story.id)}
                                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow hover:border-blue-400 transition cursor-grab active:cursor-grabbing text-left space-y-2 group"
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                        {story.title}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <PointsBadge points={story.story_points} />
                                      </div>
                                    </div>

                                    {/* Standard Agile Format Preview */}
                                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 space-y-0.5">
                                      <div><strong className="text-slate-800">As a:</strong> {story.role}</div>
                                      <div><strong className="text-slate-800">I want:</strong> {story.action}</div>
                                      <div><strong className="text-slate-800">So that:</strong> {story.benefit}</div>
                                    </div>

                                    {/* Badges and Actions */}
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <PriorityBadge priority={story.priority} />
                                        <StatusBadge status={story.status} />
                                      </div>

                                      <div className="flex items-center gap-1 text-slate-400">
                                        <Link
                                          to={`/projects/${projectId}/improve?storyId=${story.id}`}
                                          className="p-1 hover:text-purple-600 transition"
                                          title="Improve with AI"
                                        >
                                          <Wand2 className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                          onClick={() => handleOpenEditStory(story)}
                                          className="p-1 hover:text-blue-600 transition"
                                          title="Edit story"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteStory(story.id)}
                                          className="p-1 hover:text-rose-600 transition"
                                          title="Delete story"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {visibleStories.length === 0 && (
                                  <div className="py-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 rounded">
                                    Drop story here
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Unassigned Stories Backlog Column */}
            {storyMap.unassigned_stories && storyMap.unassigned_stories.length > 0 && (
              <div className="flex-shrink-0 w-80 bg-amber-50/70 rounded-2xl border border-amber-200 p-3.5 space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-800 text-white shadow-sm space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    Floating Backlog
                  </span>
                  <h3 className="font-extrabold text-sm">Unassigned Stories</h3>
                  <p className="text-[11px] text-amber-100">
                    Drag these onto any task column on the board.
                  </p>
                </div>

                <div className="space-y-2">
                  {storyMap.unassigned_stories.filter(filterStory).map((story) => (
                    <div
                      key={story.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, story.id)}
                      className="p-3 bg-white rounded-lg border border-amber-200 shadow-sm text-xs space-y-2 cursor-grab"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">{story.title}</span>
                        <PointsBadge points={story.story_points} />
                      </div>
                      <p className="text-[11px] text-slate-600 italic">
                        As a {story.role}, I want {story.action}, so that {story.benefit}.
                      </p>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <PriorityBadge priority={story.priority} />
                        <button
                          onClick={() => handleOpenEditStory(story)}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add/Edit User Story */}
      <Modal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        title={editingStory ? 'Edit User Story' : 'Create User Story'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveStory}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
            >
              {editingStory ? 'Save Changes' : 'Create Story'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveStory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Story Title</label>
            <input
              type="text"
              required
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="e.g. Social Login with Google"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Standard User Story Format */}
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
              Standard User Story Template
            </span>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                As a [type of user]:
              </label>
              <input
                type="text"
                required
                value={storyRole}
                onChange={(e) => setStoryRole(e.target.value)}
                placeholder="e.g. Registered Customer"
                className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                I want [functionality / action]:
              </label>
              <textarea
                rows={2}
                required
                value={storyAction}
                onChange={(e) => setStoryAction(e.target.value)}
                placeholder="e.g. to sign in using my Google account with 1-click"
                className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                So that [business value / outcome]:
              </label>
              <textarea
                rows={2}
                required
                value={storyBenefit}
                onChange={(e) => setStoryBenefit(e.target.value)}
                placeholder="e.g. I do not need to memorize another password and can access my account quickly"
                className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Agile Metadata: Points, Priority, Status, Release, Sprint */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Story Points</label>
              <select
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
              >
                {[1, 2, 3, 5, 8, 13, 21].map((pt) => (
                  <option key={pt} value={pt}>{pt} points</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={storyPriority}
                onChange={(e) => setStoryPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Status</label>
              <select
                value={storyStatus}
                onChange={(e) => setStoryStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Release Slice</label>
              <input
                type="text"
                value={storyRelease}
                onChange={(e) => setStoryRelease(e.target.value)}
                placeholder="MVP Release"
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Sprint Assignment</label>
              <select
                value={storySprintId}
                onChange={(e) => setStorySprintId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-1.5 px-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">(No Sprint — Backlog)</option>
                {sprints.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.name} ({sp.status})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Acceptance Criteria (one condition per line)
            </label>
            <textarea
              rows={3}
              value={acceptanceCriteriaText}
              onChange={(e) => setAcceptanceCriteriaText(e.target.value)}
              placeholder="Given a valid Google token, when user authenticates, then create session.&#10;System records email and full name."
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Add Epic, Activity, or Task */}
      <Modal
        isOpen={isHierarchyModalOpen}
        onClose={() => setIsHierarchyModalOpen(false)}
        title={`Add New ${hierarchyType.toUpperCase()}`}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsHierarchyModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveHierarchy}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
            >
              Save {hierarchyType}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveHierarchy} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {hierarchyType === 'epic' ? 'Epic Title' : hierarchyType === 'activity' ? 'Activity Name' : 'Task Name'}
            </label>
            <input
              type="text"
              required
              value={hierarchyTitle}
              onChange={(e) => setHierarchyTitle(e.target.value)}
              placeholder={
                hierarchyType === 'epic'
                  ? 'e.g. Identity & Security'
                  : hierarchyType === 'activity'
                  ? 'e.g. User Authentication'
                  : 'e.g. Social Login Form'
              }
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
