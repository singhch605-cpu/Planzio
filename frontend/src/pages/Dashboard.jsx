import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { auth } from '../utils/firebase';
import { signOut } from 'firebase/auth';
import {
  Plus, Calendar, Clock, CheckCircle2, AlertCircle, FileText,
  Trash2, Filter, Search, ChevronRight, Layout, Settings, LogOut, Eye, Mail, MessageSquare, PlusCircle, X
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [projectForm, setProjectForm] = useState({ name: '', description: '', deadline: '' });
  const [taskForm, setTaskForm] = useState({
    name: '', assigneeName: '', assigneePhone: '', assigneeEmail: '', assigneeDept: '',
    dueDate: '', description: '', priority: 'Medium'
  });

  useEffect(() => { loadProjects(); }, []);

  const notify = (text, type = 'info') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const loadProjects = async () => {
    try {
      const res = await api.getProjects();
      if (res.success) setProjects(res.data);
      else notify('Error loading projects: ' + (res.message || 'Unknown'), 'error');
    } catch (e) { notify('Failed to load projects: ' + e.message, 'error'); }
  };

  const loadTasks = async (project) => {
    setSelectedProject(project);
    try {
      const res = await api.getTasks(project.id);
      setTasks(res.success ? res.data : project.tasks || []);
    } catch (e) { setTasks(project.tasks || []); }
  };

  const createProject = async () => {
    if (!projectForm.name.trim()) { notify('Project name is required', 'error'); return; }
    setLoading(true);
    try {
      let data = projectForm;
      if (selectedFile) {
        data = new FormData();
        data.append('name', projectForm.name);
        data.append('description', projectForm.description);
        data.append('deadline', projectForm.deadline);
        data.append('file', selectedFile);
        notify('🤖 Gemini is analyzing your document and extracting tasks...', 'info');
      }

      const res = await api.createProject(data);
      if (res.success) {
        notify('✅ Project created successfully!', 'success');
        setShowProjectForm(false);
        setProjectForm({ name: '', description: '', deadline: '' });
        setSelectedFile(null);
        loadProjects();
      } else {
        notify('Error: ' + (res.message || 'Unknown error'), 'error');
      }
    } catch (e) { notify('Network error: ' + e.message, 'error'); }
    setLoading(false);
  };

  const addTask = async () => {
    if (!taskForm.name || !taskForm.assigneeName || !taskForm.assigneePhone || !taskForm.dueDate) {
      notify('Please fill Task Name, Responsible Person, Phone and Due Date', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await api.addTask(selectedProject.id, taskForm);
      if (res.success) {
        notify('✅ Task added!', 'success');
        setShowTaskForm(false);
        setTaskForm({ name: '', assigneeName: '', assigneePhone: '', assigneeEmail: '', assigneeDept: '', dueDate: '', description: '', priority: 'Medium' });
        loadTasks(selectedProject);
      } else { notify('Error: ' + (res.message || 'Unknown error'), 'error'); }
    } catch (e) { notify('Network error: ' + e.message, 'error'); }
    setLoading(false);
  };

  const markStatus = async (taskId, status) => {
    try {
      await api.updateTaskStatus(selectedProject.id, taskId, status);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      notify(status === 'done' ? '✅ Marked complete!' : '↩ Reopened', 'success');
    } catch (e) { notify('Error: ' + e.message, 'error'); }
  };

  const sendReminder = async (taskId, name) => {
    notify(`📲 Sending reminder to ${name}...`, 'info');
    try {
      const res = await api.sendReminder(selectedProject.id, taskId);
      notify(res.message || '✅ Reminder sent!', 'success');
    } catch (e) { notify('Error: ' + e.message, 'error'); }
  };

  const getDaysInfo = (dueDate) => {
    if (!dueDate) return { text: 'No date', color: '#64748b', bg: '#1e293b' };
    const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    if (diff === 0) return { text: 'Due today', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
    if (diff <= 3) return { text: `${diff}d left`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { text: `${diff}d left`, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
  };

  const getPriorityColor = (p) => ({ High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }[p] || '#94a3b8');

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const pendingCount = tasks.filter(t => t.status !== 'done').length;
  const overdueCount = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date()).length;

  const th = {
    padding: '10px 14px', fontSize: '11px', color: '#64748b', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left',
    borderBottom: '2px solid #1e293b', whiteSpace: 'nowrap', background: '#0d1117'
  };
  const td = {
    padding: '12px 14px', fontSize: '13px', color: '#e2e8f0',
    borderBottom: '1px solid #1e293b', verticalAlign: 'middle'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top bar */}
      <nav style={{ 
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        height: '64px', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectedProject && (
            <button onClick={() => { setSelectedProject(null); setTasks([]); }}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px', padding: '0 4px', display: 'flex', alignItems: 'center' }}>
              <ChevronRight style={{ transform: 'rotate(180deg)', width: '20px' }} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
              P
            </div>
            <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.025em' }}>PLANZIO</span>
          </div>
          {selectedProject && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#cbd5e1', fontSize: '18px' }}>/</span>
              <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{selectedProject.name}</span>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '600' }}>{user?.displayName || 'User'}</span>
            <span style={{ color: '#64748b', fontSize: '11px' }}>{user?.email}</span>
          </div>
          
          <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 4px' }}></div>

          {!selectedProject && (
            <button onClick={() => setShowProjectForm(true)}
              style={{ background: '#001D4F', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              + New Project
            </button>
          )}
          {selectedProject && (
            <button onClick={() => setShowTaskForm(true)}
              style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 16px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              + Add Work Row
            </button>
          )}
          
          <button onClick={() => signOut(auth)}
            style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Notification */}
      {msg.text && (
        <div style={{
          position: 'fixed', top: '64px', right: '20px', zIndex: 999,
          background: msg.type === 'error' ? '#450a0a' : msg.type === 'success' ? '#052e16' : '#1e1b4b',
          border: `1px solid ${msg.type === 'error' ? '#ef4444' : msg.type === 'success' ? '#22c55e' : '#6366f1'}`,
          color: msg.type === 'error' ? '#fca5a5' : msg.type === 'success' ? '#86efac' : '#a5b4fc',
          padding: '12px 20px', borderRadius: '10px', fontSize: '13px', maxWidth: '380px'
        }}>{msg.text}</div>
      )}

      <div style={{ padding: '24px' }}>

        {/* PROJECTS VIEW */}
        {!selectedProject && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginBottom: '32px' }}>
              {[
                { label: 'Total Projects', val: projects.length, color: '#6366f1', icon: Layout },
                { label: 'Active Projects', val: projects.filter(p => p.status === 'active').length, color: '#10b981', icon: CheckCircle2 },
                { label: 'Total Tasks', val: projects.reduce((a, p) => a + (p.tasks || []).length, 0), color: '#f59e0b', icon: FileText },
              ].map((s, i) => (
                <div key={i} style={{ 
                  background: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '20px', 
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>{s.label}</div>
                    <div style={{ color: '#0f172a', fontSize: '32px', fontWeight: '800' }}>{s.val}</div>
                  </div>
                  <div style={{ 
                    background: `${s.color}10`, 
                    color: s.color, 
                    padding: '8px', 
                    borderRadius: '12px' 
                  }}>
                    <s.icon size={20} />
                  </div>
                </div>
              ))}
            </div>

            {/* Projects Table */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '20px', 
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '16px' }}>📂 All Projects</span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Click a project to view and manage tasks</span>
              </div>
              {projects.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px opacity: 0.5' }}>📋</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#0f172a' }}>No projects yet</div>
                  <div style={{ fontSize: '14px' }}>Click "+ New Project" to create your first project</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Project Name', 'Description', 'Deadline', 'Tasks', 'Progress', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ 
                            ...th, 
                            background: '#f8fafc', 
                            color: '#64748b', 
                            borderBottom: '1px solid #e2e8f0',
                            padding: '16px 24px'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p, i) => {
                        const total = (p.tasks || []).length;
                        const done = (p.tasks || []).filter(t => t.status === 'done').length;
                        const pct = total ? Math.round(done / total * 100) : 0;
                        return (
                          <tr key={p.id} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => loadTasks(p)}>
                            <td style={{ ...td, color: '#2563eb', fontWeight: '700', padding: '16px 24px', borderBottom: 'none' }}>{p.name}</td>
                            <td style={{ ...td, color: '#64748b', maxWidth: '300px', padding: '16px 24px', borderBottom: 'none' }}>{p.description || '—'}</td>
                            <td style={{ ...td, whiteSpace: 'nowrap', color: '#0f172a', padding: '16px 24px', borderBottom: 'none' }}>{p.deadline || '—'}</td>
                            <td style={{ ...td, textAlign: 'center', padding: '16px 24px', borderBottom: 'none' }}>
                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>
                                  {total}
                                </span>
                            </td>
                            <td style={{ ...td, minWidth: '150px', padding: '16px 24px', borderBottom: 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                                  <div style={{ width: pct + '%', background: pct === 100 ? '#10b981' : '#2563eb', height: '100%', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                                </div>
                                <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600', minWidth: '32px' }}>{pct}%</span>
                              </div>
                            </td>
                            <td style={{ ...td, padding: '16px 24px', borderBottom: 'none' }}>
                              <span style={{ background: p.status === 'active' ? '#ecfdf5' : '#f8fafc', color: p.status === 'active' ? '#10b981' : '#64748b', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize' }}>
                                {p.status}
                              </span>
                            </td>
                            <td style={{ ...td, padding: '16px 24px', borderBottom: 'none' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <button style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '700', fontSize: '13px', padding: '0' }}>Open</button>
                                <button onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Delete this project?')) {
                                    const res = await api.deleteProject(p.id);
                                    if (res.success) loadProjects();
                                    else alert('Error: ' + res.message);
                                  }
                                }}
                                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all' }}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* TASKS SPREADSHEET VIEW */}
        {selectedProject && (
          <>
            {/* Project header */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '20px', 
              padding: '24px', 
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>{selectedProject.name}</h2>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '14px', maxWidth: '500px', leading: 'relaxed' }}>{selectedProject.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { val: tasks.length, label: 'Total', color: '#6366f1' },
                    { val: completedCount, label: 'Done', color: '#10b981' },
                    { val: pendingCount, label: 'Pending', color: '#f59e0b' },
                    { val: overdueCount, label: 'Overdue', color: '#ef4444' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#f8fafc', borderRadius: '16px', padding: '12px 20px', border: '1px solid #e2e8f0', minWidth: '80px', textAlign: 'center' }}>
                      <div style={{ color: s.color, fontSize: '20px', fontWeight: '800' }}>{s.val}</div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {tasks.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>Overall Project Progress</span>
                    <span style={{ color: '#2563eb', fontSize: '12px', fontWeight: '800' }}>{Math.round(completedCount / tasks.length * 100)}%</span>
                  </div>
                  <div style={{ background: '#e2e8f0', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: (completedCount / tasks.length * 100) + '%', 
                      background: 'linear-gradient(90deg, #2563eb, #6366f1)', 
                      height: '100%', 
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Excel-style task table */}
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '20px', 
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '15px' }}>📊 Task Lifecycle Tracker</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#2563eb', fontSize: '11px', padding: '6px 14px', background: '#eff6ff', borderRadius: '100px', fontWeight: '700', border: '1px solid #dbeafe' }}>
                    🤖 AI Agent Active: Daily 9AM reminders enabled
                  </span>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>➕</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>No tasks yet</div>
                  <div style={{ fontSize: '14px' }}>Click "+ Add Work Row" to populate your tracker</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead>
                      <tr style={{ background: '#ffffff' }}>
                        {['#', 'Task Details', 'Assignee', 'Contact', 'Due Date', 'Priority', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ 
                            ...th, 
                            background: '#ffffff', 
                            color: '#64748b', 
                            borderBottom: '1px solid #e2e8f0',
                            padding: '16px 20px',
                            fontWeight: '700'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, i) => {
                        const dl = getDaysInfo(task.dueDate);
                        const done = task.status === 'done';
                        return (
                          <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ ...td, color: '#94a3b8', width: '40px', textAlign: 'center', fontSize: '12px', borderBottom: 'none' }}>{i + 1}</td>
                            <td style={{ ...td, borderBottom: 'none', padding: '16px 20px' }}>
                              <div style={{ fontWeight: '700', color: done ? '#94a3b8' : '#0f172a', textDecoration: done ? 'line-through' : 'none', fontSize: '14px' }}>
                                {task.name}
                              </div>
                              {task.description && <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '400', marginTop: '4px' }}>{task.description}</div>}
                            </td>
                            <td style={{ ...td, borderBottom: 'none', padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ 
                                  width: '32px', height: '32px', borderRadius: '10px', 
                                  background: done ? '#f1f5f9' : '#e0e7ff', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                  color: done ? '#94a3b8' : '#4338ca', 
                                  fontSize: '12px', fontWeight: '800' 
                                }}>
                                  {task.assigneeName?.split(' ').map(n => n[0]).join('') || '?'}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: done ? '#94a3b8' : '#0f172a', fontSize: '13px' }}>{task.assigneeName}</div>
                                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>{task.assigneeDept || 'No Dept'}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ ...td, borderBottom: 'none', padding: '16px 20px' }}>
                              <div style={{ color: '#64748b', fontSize: '12px' }}>{task.assigneeEmail || '—'}</div>
                              <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>{task.assigneePhone || '—'}</div>
                            </td>
                            <td style={{ ...td, borderBottom: 'none', padding: '16px 20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ color: dl.color, fontWeight: '700', fontSize: '13px' }}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                                </span>
                                <span style={{ background: dl.bg, color: dl.color, padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', width: 'fit-content' }}>
                                  {dl.text}
                                </span>
                              </div>
                            </td>
                            <td style={{ ...td, borderBottom: 'none', padding: '16px 20px' }}>
                              <span style={{ 
                                border: `1px solid ${getPriorityColor(task.priority)}44`, 
                                color: getPriorityColor(task.priority), 
                                padding: '4px 10px', 
                                borderRadius: '100px', 
                                fontSize: '11px', 
                                fontWeight: '700',
                                background: `${getPriorityColor(task.priority)}08`
                              }}>
                                {task.priority || 'Medium'}
                              </span>
                            </td>
                            <td style={{ ...td, borderBottom: 'none', padding: '16px 20px' }}>
                              <span style={{ 
                                background: done ? '#ecfdf5' : '#fff7ed', 
                                color: done ? '#10b981' : '#f59e0b', 
                                padding: '4px 12px', 
                                borderRadius: '100px', 
                                fontSize: '11px', 
                                fontWeight: '800', 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {done ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                {done ? 'COMPLETED' : 'IN PROGRESS'}
                              </span>
                            </td>
                            <td style={{ ...td, whiteSpace: 'nowrap', borderBottom: 'none', padding: '16px 20px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {!done ? (
                                  <>
                                    <button onClick={() => markStatus(task.id, 'done')}
                                      style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>
                                      Mark Done
                                    </button>
                                    <button onClick={() => sendReminder(task.id, task.assigneeName)}
                                      title="Send WhatsApp Reminder"
                                      style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #dbeafe', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
                                      <Mail size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button onClick={() => markStatus(task.id, 'pending')}
                                    style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                                    Reopen
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* NEW PROJECT MODAL */}
      {showProjectForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setShowProjectForm(false)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}>
            <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>New Project</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Define your workspace to start tracking tasks.</p>
            
            {[
              { label: 'Project Name', key: 'name', placeholder: 'e.g. Factory Site Expansion', type: 'text' },
              { label: 'Description', key: 'description', placeholder: 'Scope and objectives...', type: 'text' },
              { label: 'Target Deadline', key: 'deadline', placeholder: '', type: 'date' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '20px' }}>
                <label style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={projectForm[f.key]}
                  onChange={e => setProjectForm({ ...projectForm, [f.key]: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'all' }} 
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}

            <div style={{ marginBottom: '32px', padding: '20px', background: '#f0f9ff', border: '1px dashed #bae6fd', borderRadius: '20px' }}>
              <label style={{ color: '#0369a1', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '800' }}>
                <Sparkles size={14}/> AI PROJECT EXTRACTION
              </label>
              <p style={{ color: '#0c4a6e', fontSize: '11px', margin: '0 0 16px', lineHeight: '1.5' }}>
                Upload an Excel or PDF. PLANZIO AI will automatically extract milestones and assignees.
              </p>
              <input type="file" accept=".pdf,.xlsx,.csv"
                onChange={e => setSelectedFile(e.target.files[0])}
                style={{ color: '#64748b', fontSize: '12px', width: '100%', cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={createProject} disabled={loading}
                style={{ flex: 1, padding: '14px', background: '#001D4F', color: 'white', border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px', transition: 'all', boxShadow: '0 4px 6px -1px rgba(0,29,79,0.2)' }}>
                {loading ? 'Processing...' : 'Create Project'}
              </button>
              <button onClick={() => setShowProjectForm(false)}
                style={{ padding: '14px 24px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showTaskForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setShowTaskForm(false)}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}>
            <h2 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '24px', fontWeight: '800' }}>Add Task Row</h2>
            <p style={{ color: '#64748b', margin: '0 0 32px', fontSize: '14px' }}>Defining workload for <strong style={{ color: '#2563eb' }}>{selectedProject?.name}</strong></p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {[
                { label: 'Task Name', key: 'name', placeholder: 'e.g. Structural steel audit', type: 'text', full: true },
                { label: 'Responsible Lead', key: 'assigneeName', placeholder: 'Name', type: 'text' },
                { label: 'Department', key: 'assigneeDept', placeholder: 'Quality Control', type: 'text' },
                { label: 'Email Address', key: 'assigneeEmail', placeholder: 'lead@company.com', type: 'email' },
                { label: 'WhatsApp #', key: 'assigneePhone', placeholder: '+91...', type: 'text' },
                { label: 'Target Date', key: 'dueDate', placeholder: '', type: 'date' },
                { label: 'Task Priority', key: 'priority', placeholder: '', type: 'select' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}>
                  <label style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={taskForm[f.key]} onChange={e => setTaskForm({ ...taskForm, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '14px', outline: 'none' }}>
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  ) : (
                    <input type={f.type} placeholder={f.placeholder} value={taskForm[f.key]}
                      onChange={e => setTaskForm({ ...taskForm, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '8px', fontWeight: '700', textTransform: 'uppercase' }}>Scope Details</label>
              <textarea placeholder="Specific instructions for lead..." value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box', outline: 'none', height: '80px', resize: 'none' }} />
            </div>

            <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '16px', padding: '16px', marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <MessageSquare size={20} style={{ color: '#db2777' }} />
              <span style={{ color: '#9d174d', fontSize: '12px', fontWeight: '600', lineHeight: '1.4' }}>
                Automated WhatsApp & Email follow-ups will be triggered daily at 9:00 AM for this lead.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={addTask} disabled={loading}
                style={{ flex: 1, padding: '14px', background: '#059669', color: 'white', border: 'none', borderRadius: '14px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 6px -1px rgba(5,150,105,0.2)' }}>
                {loading ? 'Adding...' : 'Confirm Task Row'}
              </button>
              <button onClick={() => setShowTaskForm(false)}
                style={{ padding: '14px 24px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
