import React, { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/api';
import { 
  LayoutDashboard, 
  FileText, 
  Map, 
  Wand2, 
  CalendarRange, 
  Settings, 
  PlusCircle, 
  Layers,
  ChevronDown
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAll();
        setProjects(data);
        if (projectId) {
          const match = data.find((p) => p.id === parseInt(projectId));
          if (match) setCurrentProject(match);
        } else if (data.length > 0 && !currentProject) {
          setCurrentProject(data[0]);
        }
      } catch (err) {
        console.error('Failed to load sidebar projects:', err);
      }
    };
    fetchProjects();
  }, [projectId]);

  const activeId = projectId || currentProject?.id || 1;

  const handleSelectProject = (e) => {
    const newId = e.target.value;
    if (newId === 'new') {
      navigate('/projects/new');
    } else {
      const match = projects.find((p) => p.id === parseInt(newId));
      setCurrentProject(match);
      // Navigate to current active view with new projectId
      const pathParts = window.location.pathname.split('/');
      const section = pathParts[3] || 'map';
      navigate(`/projects/${newId}/${section}`);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/dashboard',
      exact: true,
    },
    {
      label: 'AI Requirement Analyzer',
      icon: FileText,
      to: `/projects/${activeId}/analyze`,
    },
    {
      label: 'Visual Story Mapping',
      icon: Map,
      to: `/projects/${activeId}/map`,
    },
    {
      label: 'AI Story Improver',
      icon: Wand2,
      to: `/projects/${activeId}/improve`,
    },
    {
      label: 'Sprint Planning',
      icon: CalendarRange,
      to: `/projects/${activeId}/sprints`,
    },
    {
      label: 'Settings & Export',
      icon: Settings,
      to: `/projects/${activeId}/settings`,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Project Switcher */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Active Project
            </label>
            <div className="relative">
              <select
                value={projectId || currentProject?.id || ''}
                onChange={handleSelectProject}
                className="w-full appearance-none rounded-lg bg-slate-800 border border-slate-700 py-2.5 pl-3 pr-8 text-sm font-medium text-white focus:border-blue-500 focus:outline-none transition cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {projects.length === 0 && (
                  <option value="" disabled>No projects yet</option>
                )}
                <option value="new">+ Create New Project...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Agile Workspace
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <NavLink
            to="/projects/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>New Agile Project</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
