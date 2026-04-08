import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const getHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

export const api = {
  getProjects: async () => {
    const res = await fetch(`${BASE_URL}/api/projects`, { headers: await getHeaders() });
    return res.json();
  },
  createProject: async (dataOrFormData) => {
    const isFormData = dataOrFormData instanceof FormData;
    const token = await auth.currentUser?.getIdToken();
    const reqHeaders = { Authorization: `Bearer ${token}` };
    if (!isFormData) reqHeaders['Content-Type'] = 'application/json';
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: reqHeaders,
      body: isFormData ? dataOrFormData : JSON.stringify(dataOrFormData)
    });
    return res.json();
  },
  deleteProject: async (id) => {
    const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
      headers: await getHeaders()
    });
    return res.json();
  },
  getTasks: async (projectId) => {
    const res = await fetch(`${BASE_URL}/api/tasks/${projectId}`, { headers: await getHeaders() });
    return res.json();
  },
  addTask: async (projectId, task) => {
    const res = await fetch(`${BASE_URL}/api/tasks/${projectId}`, {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(task)
    });
    return res.json();
  },
  updateTaskStatus: async (projectId, taskId, status) => {
    const res = await fetch(`${BASE_URL}/api/tasks/${projectId}/${taskId}/status`, {
      method: 'PATCH', headers: await getHeaders(), body: JSON.stringify({ status })
    });
    return res.json();
  },
  sendReminder: async (projectId, taskId) => {
    const res = await fetch(`${BASE_URL}/api/tasks/${projectId}/${taskId}/remind`, {
      method: 'POST', headers: await getHeaders()
    });
    return res.json();
  }
};
