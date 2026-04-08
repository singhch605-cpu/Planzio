const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const projectService = require('../services/projectService');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/projects — get all projects for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await projectService.getUserProjects(req.user.uid);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects — create new project (with optional file upload)
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const project = await projectService.createProject({
      ...req.body,
      file: req.file,
      userId: req.user.uid
    });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects/:id — get one project
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user.uid);
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/projects/:id — delete a project
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user.uid);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[PROJECTS DELETE ERROR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
