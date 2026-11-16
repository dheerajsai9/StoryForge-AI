import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService, requirementService, storyService } from '../services/api';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Target, 
  ListOrdered, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  Cpu
} from 'lucide-react';

export const RequirementAnalysisPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [rawInput, setRawInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingStories, setGeneratingStories] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (projectId) {
        const p = await projectService.getById(projectId);
        setProject(p);

        // Check if there are already saved requirements
        const savedReq = await requirementService.getByProject(projectId);
        if (savedReq) {
          setRawInput(savedReq.raw_input || '');
          setAnalysis({
            problem_statement: savedReq.problem_statement,
            objectives: savedReq.objectives,
            target_users: savedReq.target_users,
            functional_requirements: savedReq.functional_requirements,
          });
        } else if (p.description) {
          setRawInput(p.description);
        }
      }
    } catch (err) {
      console.error('Failed to load project requirements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!rawInput.trim() || rawInput.trim().length < 10) {
      setError('Please provide a descriptive project outline with at least 10 characters.');
      return;
    }

    setError('');
    setAnalyzing(true);
    try {
      const result = await requirementService.analyze({
        project_id: projectId ? parseInt(projectId) : null,
        project_name: project?.name || '',
        raw_input: rawInput,
      });

      setAnalysis({
        problem_statement: result.problem_statement,
        objectives: result.objectives,
        target_users: result.target_users,
        functional_requirements: result.functional_requirements,
      });
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI Analysis failed.';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateStoryMap = async () => {
    if (!projectId) return;
    setGeneratingStories(true);
    setError('');
    try {
      await storyService.generateAIStoryMap(projectId, rawInput);
      navigate(`/projects/${projectId}/map`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Story Map generation failed. Ensure Ollama is running.');
      setGeneratingStories(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading requirements workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" /> AI Requirement Analyzer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Project: <strong className="text-slate-800">{project?.name || 'Agile Project'}</strong> — Analyze natural-language specs with local Ollama AI.
          </p>
        </div>

        {analysis && (
          <button
            onClick={handleGenerateStoryMap}
            disabled={generatingStories}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generatingStories ? 'Synthesizing Story Map...' : 'Generate 2D Story Map from Analysis'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold">Error during analysis:</strong>
            <p>{error}</p>
            {error.includes('Ollama') && (
              <p className="font-semibold text-rose-900 mt-1">
                Tip: Start local Ollama by running <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono">ollama serve</code>, and ensure you pulled the model with <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono">ollama pull qwen2.5-coder</code>.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> Enter Software Project Requirements
          </label>
          <span className="text-xs text-slate-400 font-mono">
            {rawInput.length} characters
          </span>
        </div>

        <textarea
          rows={6}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Describe your software system: what problem does it solve, what are the primary workflows, who uses it, and what are the main features? (e.g., We need an online medical appointment booking platform where patients can find doctors by specialty...)"
          className="w-full rounded-xl border border-slate-300 p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" /> Runs 100% locally via Ollama API
          </span>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deconstructing Requirements with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Requirements</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output Presentation */}
      {analysis && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Structured Requirement Analysis
            </h2>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Validated Schema
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problem Statement */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Core Problem Statement
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {analysis.problem_statement}
              </p>
            </div>

            {/* Target Users */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Target User Personas
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.target_users.map((user, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{user}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Objectives */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Strategic Objectives
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Functional Requirements */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4" /> Functional Requirements
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {analysis.functional_requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                    <span className="font-mono text-purple-700 font-bold shrink-0">FR-{idx + 1}:</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action to proceed to story map */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold">Ready to build the Visual Story Map?</h3>
              <p className="text-xs text-blue-200">
                Transform these functional requirements into Epics, Activities, Tasks, and INVEST User Stories.
              </p>
            </div>
            <button
              onClick={handleGenerateStoryMap}
              disabled={generatingStories}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{generatingStories ? 'Generating Story Map...' : 'Convert to 2D Story Map'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
