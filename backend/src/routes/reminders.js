const express = require('express');
const router = express.Router();
const { sendMessage } = require('../services/whatsappService');

// POST /api/reminders/test — send a test WhatsApp message
router.post('/test', async (req, res) => {
  try {
    const { phone, message } = req.body;
    await sendMessage(phone, message);
    res.json({ success: true, message: 'WhatsApp sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
