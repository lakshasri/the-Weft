const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const apiRoutes = require('./src/routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found.' });
  }
  return next();
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`SCM server running at http://localhost:${PORT}`);
});
