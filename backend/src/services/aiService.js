const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractTasksFromText = async (documentText) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a project management assistant. Extract all tasks, milestones, and action items from the following document.
For each item, try to identify the responsible person and their contact details if available in the text.
Return ONLY a valid JSON array of objects with the following schema:
[{"name": "task name", "description": "details", "suggestedDeadline": "YYYY-MM-DD", "assigneeName": "name", "assigneeEmail": "email", "assigneePhone": "whatsapp number"}]

Document: ${documentText}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const rawText = response.text()
    .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(rawText);
};

module.exports = { extractTasksFromText };
