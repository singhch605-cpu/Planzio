const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const reminderRoutes = require('./routes/reminders');
require('./services/reminderScheduler');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = 8080;
app.listen(PORT, () => console.log(`Planzio backend listening on port ${PORT}`));
