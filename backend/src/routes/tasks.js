const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { db } = require('../utils/firebase');
const { sendTaskReminder } = require('../services/whatsappService');
const { sendReminderEmail } = require('../services/emailService');

router.get('/:projectId', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('projects').doc(req.params.projectId).get();
    if (!doc.exists) return res.status(404).json({ message: 'Project not found' });
    res.json({ success: true, data: doc.data().tasks || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:projectId', authenticate, async (req, res) => {
  try {
    const { name, assigneeName, assigneePhone, assigneeEmail, assigneeDept, dueDate, description, priority } = req.body;
    const ref = db.collection('projects').doc(req.params.projectId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ message: 'Project not found' });

    const tasks = doc.data().tasks || [];
    const newTask = {
      id: Date.now().toString(),
      name, assigneeName, assigneePhone, assigneeEmail, assigneeDept, dueDate,
      description: description || '',
      priority: priority || 'Medium',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    await ref.update({ tasks });
    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:projectId/:taskId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const ref = db.collection('projects').doc(req.params.projectId);
    const doc = await ref.get();
    const tasks = doc.data().tasks || [];
    const updated = tasks.map(t => t.id === req.params.taskId ? { ...t, status } : t);
    await ref.update({ tasks: updated });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:projectId/:taskId/remind', authenticate, async (req, res) => {
  try {
    const doc = await db.collection('projects').doc(req.params.projectId).get();
    const project = { id: doc.id, ...doc.data() };
    const task = project.tasks.find(t => t.id === req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const today = new Date();
    const due = new Date(task.dueDate);
    task.daysOverdue = Math.floor((today - due) / (1000 * 60 * 60 * 24));

    const results = { whatsapp: null, email: null };
    const errors = [];

    // Try WhatsApp via Twilio
    try {
      await sendTaskReminder(task, project);
      results.whatsapp = { sent: true, to: task.assigneePhone };
    } catch (waErr) {
      console.error('[REMIND] WhatsApp failed:', waErr.message);
      results.whatsapp = { sent: false, reason: waErr.message };
      errors.push(`WhatsApp: ${waErr.message}`);
    }

    // Try Email via Nodemailer
    try {
      const emailResult = await sendReminderEmail(task, project);
      results.email = emailResult;
      if (!emailResult.sent) errors.push(`Email: ${emailResult.reason}`);
    } catch (emailErr) {
      console.error('[REMIND] Email failed:', emailErr.message);
      results.email = { sent: false, reason: emailErr.message };
      errors.push(`Email: ${emailErr.message}`);
    }

    const waSent = results.whatsapp?.sent;
    const emailSent = results.email?.sent;

    let message;
    if (waSent && emailSent) {
      message = `✅ WhatsApp + Email reminder sent to ${task.assigneeName}!`;
    } else if (waSent) {
      message = `📲 WhatsApp reminder sent to ${task.assigneeName}! (Email: ${results.email?.reason || 'not sent'})`;
    } else if (emailSent) {
      message = `📧 Email reminder sent to ${task.assigneeName}! (WhatsApp: ${results.whatsapp?.reason || 'not sent'})`;
    } else {
      return res.status(500).json({
        success: false,
        message: `Failed to send reminder. ${errors.join('; ')}`,
        results
      });
    }

    res.json({ success: true, message, results });
  } catch (error) {
    console.error('[TASKS REMIND ERROR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

