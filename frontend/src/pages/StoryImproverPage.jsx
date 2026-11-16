import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { storyService, improverService } from '../services/api';
import { 
  Wand2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw,
  Gauge,
  Check,
  X
} from 'lucide-react';

export const StoryImproverPage = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState(searchParams.get('storyId') || '');
  
  // Current Story state
  const [title, setTitle] = useState('');
  const [role, setRole] = useState('User');
  const [action, setAction] = useState('');
  const [benefit, setBenefit] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');

  // AI Output state
  const [improvement, setImprovement] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, [projectId]);

  useEffect(() => {
    if (selectedStoryId && stories.length > 0) {
      const match = stories.find((s) => s.id === parseInt(selectedStoryId));
      if (match) {
        populateFields(match);
      }
    }
  }, [selectedStoryId, stories]);

  const loadStories = async () => {
    setLoading(true);
    try {
      if (projectId) {
        const list = await storyService.listByProject(projectId);
        setStories(list);
        if (list.length > 0 && !selectedStoryId) {
          setSelectedStoryId(String(list[0].id));
          populateFields(list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (story) => {
    setTitle(story.title || '');
    setRole(story.role || 'User');
    setAction(story.action || '');
    setBenefit(story.benefit || '');
    setAcceptanceCriteria(
      Array.isArray(story.acceptance_criteria)
        ? story.acceptance_criteria.join('\n')
        : story.acceptance_criteria || ''
    );
    setImprovement(null);
    setSuccessMsg('');
    setError('');
  };

  const handleSelectChange = (e) => {
    const sId = e.target.value;
    setSelectedStoryId(sId);
  };

  const handleAnalyzeStory = async (e) => {
    if (e) e.preventDefault();
    if (!title || !action || !benefit) {
      setError('Please fill in Title, Action, and Benefit before analyzing.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setSuccessMsg('');
    try {
      const acList = acceptanceCriteria
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const result = await improverService.analyze({
        story_id: selectedStoryId ? parseInt(selectedStoryId) : null,
        title,
        role,
        action,
        benefit,
        acceptance_criteria: acList,
      });
      setImprovement(result);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI Improvement analysis failed.';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyImprovements = async () => {
    if (!selectedStoryId || !improvement) return;
    setApplying(true);
    setError('');
    try {
      await improverService.apply(parseInt(selectedStoryId), improvement);
      setSuccessMsg('Improvements applied successfully to the story record!');
      // Update local inputs
      setTitle(improvement.improved_title);
      setRole(improvement.improved_role);
      setAction(improvement.improved_action);
      setBenefit(improvement.improved_benefit);
      setAcceptanceCriteria(improvement.improved_acceptance_criteria.join('\n'));
      // Refresh story list in background
      storyService.listByProject(projectId).then(setStories);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to apply improvements.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading AI Story Coach...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Wand2 className="w-7 h-7 text-purple-600" /> AI User Story Improver & Coach
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Evaluate clarity, enforce strict INVEST criteria, auto-generate Gherkin acceptance tests, and surface unhandled edge cases.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Notice:</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Story Selector & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Story Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select or Edit Story
            </span>

            {stories.length > 0 && (
              <select
                value={selectedStoryId}
                onChange={handleSelectChange}
                className="text-xs font-semibold rounded-lg border border-slate-300 py-1.5 px-3 bg-slate-50 focus:border-blue-500 focus:outline-none max-w-xs"
              >
                {stories.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <form onSubmit={handleAnalyzeStory} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Story Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Story title"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">As a [Role]:</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">I want [Action]:</label>
                <textarea
                  rows={2}
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">So that [Benefit]:</label>
                <textarea
                  rows={2}
                  required
                  value={benefit}
                  onChange={(e) => setBenefit(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Existing Acceptance Criteria (one per line)
              </label>
              <textarea
                rows={3}
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                placeholder="Given... When... Then..."
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Story with Local AI...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Critique & Improve Story</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Analysis & Suggestions Output */}
        <div className="lg:col-span-6 space-y-5">
          {!improvement ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Awaiting AI Evaluation</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Click <strong>"Critique & Improve Story"</strong> to inspect this user story against INVEST standards, detect edge cases, and generate testable criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Score & INVEST Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-purple-600" /> Story Quality Score
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${
                      improvement.clarity_score >= 80 ? 'text-emerald-600' : improvement.clarity_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {improvement.clarity_score}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                </div>

                {/* INVEST Checklist Matrix */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  {['independent', 'negotiable', 'valuable', 'estimable', 'small', 'testable'].map((key) => {
                    const passed = improvement.invest_check && improvement.invest_check[key] !== false;
                    return (
                      <div
                        key={key}
                        className={`p-2 rounded-lg border font-semibold flex flex-col items-center justify-center gap-1 ${
                          passed
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}
                      >
                        {passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span className="capitalize text-[10px]">{key}</span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-600 bg-purple-50/60 p-3 rounded-lg border border-purple-100 leading-relaxed">
                  <strong className="text-purple-900 block mb-0.5">Critique:</strong>
                  {improvement.critique_summary}
                </p>
              </div>

              {/* Enhanced Story Output */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AI Refined User Story
                  </h3>
                  <button
                    onClick={handleApplyImprovements}
                    disabled={applying || !selectedStoryId}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition disabled:opacity-50"
                  >
                    <span>{applying ? 'Applying...' : 'Apply Improvements'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm mb-1">{improvement.improved_title}</div>
                  <div><strong className="text-slate-800">As a:</strong> {improvement.improved_role}</div>
                  <div><strong className="text-slate-800">I want:</strong> {improvement.improved_action}</div>
                  <div><strong className="text-slate-800">So that:</strong> {improvement.improved_benefit}</div>
                </div>

                {/* Improved Criteria */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Enhanced Acceptance Criteria (Gherkin):</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {improvement.improved_acceptance_criteria.map((ac, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{ac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Reqs & Edge Cases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 text-xs space-y-1.5">
                    <h5 className="font-bold text-amber-900 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Missing Requirements:
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {improvement.missing_requirements.map((mr, i) => (
                        <li key={i}>{mr}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-xs space-y-1.5">
                    <h5 className="font-bold text-rose-900 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Detected Edge Cases:
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {improvement.suggested_edge_cases.map((ec, i) => (
                        <li key={i}>{ec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
