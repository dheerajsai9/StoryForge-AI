import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for long AI model generation
});

// Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('storyforge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to catch 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('storyforge_token');
        localStorage.removeItem('storyforge_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ================= AUTH APIs =================
export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (fullName, email, password) => {
    const res = await api.post('/auth/register', { full_name: fullName, email, password });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// ================= PROJECT APIs =================
export const projectService = {
  getAll: async () => {
    const res = await api.get('/projects');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/projects', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    await api.delete(`/projects/${id}`);
  },
  getStats: async (id) => {
    const res = await api.get(`/projects/${id}/stats`);
    return res.data;
  },
};

// ================= REQUIREMENT APIs =================
export const requirementService = {
  checkAiStatus: async () => {
    const res = await api.get('/requirements/ai-status');
    return res.data;
  },
  analyze: async (data) => {
    const res = await api.post('/requirements/analyze', data);
    return res.data;
  },
  getByProject: async (projectId) => {
    const res = await api.get(`/requirements/project/${projectId}`);
    return res.data;
  },
};

// ================= STORY & MAP APIs =================
export const storyService = {
  getStoryMap: async (projectId) => {
    const res = await api.get(`/stories/project/${projectId}/map`);
    return res.data;
  },
  listByProject: async (projectId) => {
    const res = await api.get(`/stories/project/${projectId}`);
    return res.data;
  },
  generateAIStoryMap: async (projectId, requirementText = null) => {
    const res = await api.post('/stories/generate', {
      project_id: projectId,
      requirement_text: requirementText,
    });
    return res.data;
  },
  createStory: async (storyData) => {
    const res = await api.post('/stories', storyData);
    return res.data;
  },
  updateStory: async (storyId, updates) => {
    const res = await api.put(`/stories/${storyId}`, updates);
    return res.data;
  },
  deleteStory: async (storyId) => {
    await api.delete(`/stories/${storyId}`);
  },
  createEpic: async (epicData) => {
    const res = await api.post('/stories/epics', epicData);
    return res.data;
  },
  createActivity: async (actData) => {
    const res = await api.post('/stories/activities', actData);
    return res.data;
  },
  createTask: async (taskData) => {
    const res = await api.post('/stories/tasks', taskData);
    return res.data;
  },
};

// ================= STORY IMPROVER APIs =================
export const improverService = {
  analyze: async (storyData) => {
    const res = await api.post('/improver/analyze', storyData);
    return res.data;
  },
  apply: async (storyId, improvedData) => {
    const res = await api.post(`/improver/apply/${storyId}`, improvedData);
    return res.data;
  },
};

// ================= SPRINT APIs =================
export const sprintService = {
  getByProject: async (projectId) => {
    const res = await api.get(`/sprints/project/${projectId}`);
    return res.data;
  },
  create: async (sprintData) => {
    const res = await api.post('/sprints', sprintData);
    return res.data;
  },
  update: async (sprintId, sprintData) => {
    const res = await api.put(`/sprints/${sprintId}`, sprintData);
    return res.data;
  },
  delete: async (sprintId) => {
    await api.delete(`/sprints/${sprintId}`);
  },
  assignStory: async (storyId, sprintId) => {
    const res = await api.post(`/sprints/assign-story?story_id=${storyId}&sprint_id=${sprintId}`);
    return res.data;
  },
  generateAIPlan: async (projectId, velocity = 20, sprintCount = 3) => {
    const res = await api.post('/sprints/ai-plan', {
      project_id: projectId,
      team_velocity_per_sprint: velocity,
      sprint_count: sprintCount,
    });
    return res.data;
  },
};

// ================= EXPORT APIs =================
export const exportService = {
  getStoryMapCsvUrl: (projectId) => `${API_BASE_URL}/export/project/${projectId}/story-map/csv`,
  getSprintCsvUrl: (projectId) => `${API_BASE_URL}/export/project/${projectId}/sprints/csv`,
  getProjectJsonUrl: (projectId) => `${API_BASE_URL}/export/project/${projectId}/json`,
  downloadFile: async (url, fallbackName) => {
    const token = localStorage.getItem('storyforge_token');
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  },
};

export default api;
