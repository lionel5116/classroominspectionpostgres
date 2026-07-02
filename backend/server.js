require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db/config');
const usersRouter = require('./routes/users');
const schoolsRouter = require('./routes/schools');
const inspectionsRouter = require('./routes/inspections');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/users', usersRouter);
app.use('/api/schools', schoolsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  // Unexpected errors (e.g. a dropped DB connection) shouldn't leak raw
  // driver messages to the client — log the detail above, send a generic one.
  const message = err.status ? err.message : 'Internal Server Error';
  res.status(status).json({ error: message });
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});
