import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// 10 Application Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { RequirementAnalysisPage } from './pages/RequirementAnalysisPage';
import { StoryMappingBoardPage } from './pages/StoryMappingBoardPage';
import { StoryImproverPage } from './pages/StoryImproverPage';
import { SprintPlanningPage } from './pages/SprintPlanningPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Marketing & Auth Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated Application Shell */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/projects/:projectId/analyze" element={<RequirementAnalysisPage />} />
          <Route path="/projects/:projectId/map" element={<StoryMappingBoardPage />} />
          <Route path="/projects/:projectId/improve" element={<StoryImproverPage />} />
          <Route path="/projects/:projectId/sprints" element={<SprintPlanningPage />} />
          <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
