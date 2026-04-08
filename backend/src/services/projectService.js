const { db, storage } = require('../utils/firebase');
const aiService = require('./aiService');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');

const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '../../db-log.txt');

const getUserProjects = async (userId) => {
  const log = (msg) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    console.log(msg);
  };

  log(`[DEBUG] Fetching projects for userId: ${userId}`);
  const snapshot = await db.collection('projects')
    .where('userId', '==', userId)
    .get();

  const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  log(`[DEBUG] Found projects count: ${projects.length}`);
  return projects;
};

const createProject = async ({ name, description, deadline, file, userId }) => {
  let extractedTasks = [];

  if (file) {
    let text = '';

    if (file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      text = pdfData.text;
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      text = JSON.stringify(json);
    }

    if (text) {
      extractedTasks = await aiService.extractTasksFromText(text);
    }
  }

  console.log('[DEBUG] Creating project for userId:', userId, 'with tasks:', extractedTasks.length);
  const docRef = await db.collection('projects').add({
    name, description, deadline, userId,
    tasks: extractedTasks,
    progress: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  });

  console.log('[DEBUG] Project created with ID:', docRef.id);
  return { id: docRef.id, name, tasks: extractedTasks };
};

const getProject = async (projectId, userId) => {
  const doc = await db.collection('projects').doc(projectId).get();
  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error('Project not found');
  }
  return { id: doc.id, ...doc.data() };
};

const deleteProject = async (projectId, userId) => {
  const doc = await db.collection('projects').doc(projectId).get();
  if (!doc.exists) throw new Error('Project not found');
  if (doc.data().userId !== userId) throw new Error('Unauthorized');
  await db.collection('projects').doc(projectId).delete();
  return { deleted: true, id: projectId };
};

module.exports = { getUserProjects, createProject, getProject, deleteProject };
