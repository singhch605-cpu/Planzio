const cron = require('node-cron');
const { db } = require('../utils/firebase');
const whatsappService = require('./whatsappService');

// Runs every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminder check...');

  const projectsSnapshot = await db.collection('projects')
    .where('status', '==', 'active').get();

  for (const projectDoc of projectsSnapshot.docs) {
    const project = { id: projectDoc.id, ...projectDoc.data() };

    for (const task of project.tasks) {
      if (task.status === 'done') continue;

      const today = new Date();
      const due = new Date(task.dueDate);
      const diffMs = today - due;
      task.daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (task.assigneePhone) {
        await whatsappService.sendTaskReminder(task, project);
      }
    }
  }
});
