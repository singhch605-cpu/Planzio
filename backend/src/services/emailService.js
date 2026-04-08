/**
 * emailService.js
 * Sends emails via the Firebase "Trigger Email from Firestore" extension.
 * The extension listens to the `mail` collection and delivers emails automatically.
 *
 * Setup (one-time, in Firebase Console):
 *   Extensions → Install → "Trigger Email from Firestore"
 *   Configure with your SMTP / SendGrid / Mailgun credentials inside the extension settings.
 *   The extension will watch the `mail` Firestore collection.
 */

const { db } = require('../utils/firebase');

const sendReminderEmail = async (task, project) => {
  if (!task.assigneeEmail) {
    return { sent: false, reason: 'No email address on this task' };
  }

  const daysOverdue = task.daysOverdue > 0 ? ` (${task.daysOverdue} days overdue!)` : '';

  try {
    await db.collection('mail').add({
      to: [task.assigneeEmail],
      message: {
        subject: `⏰ Reminder: "${task.name}" is due${daysOverdue} — Planzio`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0d1117;color:#e2e8f0;border-radius:12px;overflow:hidden;border:1px solid #21262d">
            <div style="background:#6366f1;padding:24px">
              <h2 style="margin:0;color:white;font-size:20px;font-weight:700">📋 Task Reminder</h2>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px">Sent by Planzio Task Manager</p>
            </div>
            <div style="padding:24px">
              <p style="color:#94a3b8;margin:0 0 20px">Hi <strong style="color:white">${task.assigneeName}</strong>,</p>
              <p style="margin:0 0 20px;color:#e2e8f0">You have a pending task that needs your attention:</p>
              <div style="background:#161b22;border:1px solid #30363d;border-radius:10px;padding:20px;margin-bottom:20px">
                <table style="width:100%;border-collapse:collapse">
                  <tr>
                    <td style="color:#64748b;padding:6px 0;font-size:13px;width:90px">Project</td>
                    <td style="color:#e2e8f0;padding:6px 0;font-size:13px;font-weight:600">${project.name}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;padding:6px 0;font-size:13px">Task</td>
                    <td style="color:#818cf8;padding:6px 0;font-size:14px;font-weight:700">${task.name}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;padding:6px 0;font-size:13px">Due Date</td>
                    <td style="color:${task.daysOverdue > 0 ? '#ef4444' : '#f59e0b'};padding:6px 0;font-size:13px;font-weight:600">${task.dueDate}${daysOverdue}</td>
                  </tr>
                  ${task.assigneeDept ? `<tr><td style="color:#64748b;padding:6px 0;font-size:13px">Department</td><td style="color:#e2e8f0;padding:6px 0;font-size:13px">${task.assigneeDept}</td></tr>` : ''}
                </table>
              </div>
              ${task.description ? `<p style="color:#94a3b8;font-size:13px;margin:0 0 16px;padding:12px;background:#161b22;border-radius:8px;border-left:3px solid #6366f1">${task.description}</p>` : ''}
              <p style="color:#64748b;font-size:12px;margin:24px 0 0">Please update your task status in Planzio once complete.</p>
            </div>
            <div style="padding:14px 24px;background:#161b22;border-top:1px solid #21262d;text-align:center">
              <span style="color:#4b5563;font-size:11px">Planzio — Automated Task Reminder System</span>
            </div>
          </div>
        `
      },
      createdAt: new Date().toISOString()
    });

    return { sent: true, to: task.assigneeEmail };
  } catch (err) {
    console.error('[EMAIL] Failed to queue email in Firestore:', err.message);
    return { sent: false, reason: err.message };
  }
};

module.exports = { sendReminderEmail };
