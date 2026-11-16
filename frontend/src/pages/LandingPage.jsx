import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Map, 
  Wand2, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Zap, 
  GitBranch, 
  CheckCircle,
  FileSpreadsheet,
  Cpu
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-600">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30">
          <div className="w-[600px] h-[600px] rounded-full bg-blue-600 blur-[130px]" />
        </div>

        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> 100% Free & Open-Source • Powered by Local Ollama AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Turn Rough Requirements into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Release-Ready User Story Maps</span>
          </h1>

          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop wrestling with unstructured feature requests. StoryForge AI deconstructs your product vision into Epics, Activities, Tasks, User Stories with Acceptance Criteria, and optimized Sprint plans.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5"
            >
              <span>Start Story Mapping Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition"
            >
              <span>Sign In to Existing Project</span>
            </Link>
          </div>

          {/* Privacy & Zero-API-Cost Guarantee */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% On-Premise & Local AI</span>
            <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-blue-400" /> Zero Paid API Keys Required</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-indigo-400" /> Standard INVEST Agile Quality</span>
          </div>
        </div>

        {/* Visual Story Mapping Preview Mockup */}
        <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-400">StoryForge AI Board — E-Commerce Checkout Flow</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 font-medium border border-blue-700/50">
              Interactive 2D Board
            </span>
          </div>

          {/* Preview Story Map Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Column 1 */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <div className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider">
                Epic 1: User Onboarding
              </div>
              <div className="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs font-semibold">
                Activity: Account Setup
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">OAuth Google Sign-in</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">3 Pts</span>
                  </div>
                  <p className="text-slate-400 italic">As a customer, I want 1-click Google login, so that I don't remember passwords.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Two-Factor Auth</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold">5 Pts</span>
                  </div>
                  <p className="text-slate-400 italic">As a verified user, I want SMS/TOTP 2FA, so that my account is protected.</p>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <div className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider">
                Epic 2: Product Discovery
              </div>
              <div className="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs font-semibold">
                Activity: Search & Filter
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Faceted Facet Filters</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold">5 Pts</span>
                  </div>
                  <p className="text-slate-400 italic">As a shopper, I want to filter by price & brand, so that I find relevant items faster.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Autosuggest Search</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">2 Pts</span>
                  </div>
                  <p className="text-slate-400 italic">As a buyer, I want real-time autocomplete search, so that I can discover terms instantly.</p>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
              <div className="px-3 py-1.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider">
                Epic 3: Payment & Checkout
              </div>
              <div className="px-3 py-1 rounded bg-slate-800 text-slate-200 text-xs font-semibold">
                Activity: Order Fulfillment
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Stripe Card Processing</span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-semibold">8 Pts</span>
                  </div>
                  <p className="text-slate-400 italic">As a customer, I want to pay with credit card securely, so that my purchase is finalized.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">PDF Invoice Generation</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold">3 Pts</span>
                  </div>
                  <p className="text-slate-400 italic">As an accountant, I want an emailed VAT receipt, so that expenses are recorded.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Built for Modern Scrum Teams & Product Architects
          </h2>
          <p className="mt-3 text-slate-400">
            A complete suite from raw problem statements down to sprint delivery metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. AI Requirement Analyzer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Feed raw project briefs. The AI extracts core problem statements, key business objectives, user personas, and numbered functional requirements.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Map className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Visual 2D Story Mapping</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Arrange Epics and User Activities along the horizontal backbone, with User Tasks and Stories prioritized vertically with Drag & Drop simplicity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">3. AI Story Improver</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Run automated INVEST reviews, score story clarity, synthesize Gherkin Given-When-Then acceptance criteria, and spot hidden edge cases.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">4. AI Sprint Planner</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cluster stories into sprint iterations using team velocity and Fibonacci story points, with interactive manual override.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">5. CSV & JSON Export</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Export story maps and sprint plans into standard CSV for Jira/Trello/Excel, or full project JSON backups with one click.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">6. Release Planning</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Slice your story map horizontally into MVP, Release 1.0, and Future Horizons to maintain strict delivery focus.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-slate-500">
        <p>© 2026 StoryForge AI — Built for High-Performance Agile Teams. Completely Free & Open Source.</p>
      </footer>
    </div>
  );
};
