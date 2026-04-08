const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = 'whatsapp:+14155238886'; // Twilio sandbox number

const sendMessage = async (toPhone, message) => {
  // Strip spaces, dashes, parentheses — keep digits and leading +
  const cleaned = toPhone.replace(/[\s\-().]/g, '');
  const formattedTo = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  console.log(`[WHATSAPP] Sending to whatsapp:${formattedTo}`);
  return await client.messages.create({
    body: message,
    from: WHATSAPP_FROM,
    to: `whatsapp:${formattedTo}`
  });
};

const sendTaskReminder = async (task, project) => {
  const daysOverdue = task.daysOverdue > 0 ? ` (${task.daysOverdue} days overdue!)` : '';
  const message = `Hello ${task.assigneeName},

This is a reminder for your pending task:

Project: ${project.name}
Task: ${task.name}
Due: ${task.dueDate}${daysOverdue}

Please update your status. Reply DONE when complete.

--- Planzio`;

  await sendMessage(task.assigneePhone, message);
  return { sent: true, to: task.assigneePhone };
};

module.exports = { sendMessage, sendTaskReminder };
