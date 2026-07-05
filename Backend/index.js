// backend/server.js
// Application entry point: sets up Express, middleware, DB connection,
// and mounts the API routes.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./connection');
const simulationRoutes = require('./routes/simulationRoutes');

// Connect to MongoDB before handling any requests.
connectDB();

const app = express();

// --- Global Middleware ---
app.use(cors()); // Allow the React dev server (different port/origin) to call this API.
app.use(express.json()); // Parse JSON request bodies.

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'sorting-visualizer-api' });
});

// --- Routes ---
app.use('/api/simulations', simulationRoutes);

// --- 404 handler for unmatched routes ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// --- Centralized error handler (catches anything passed to next(err)) ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});