// backend/routes/simulationRoutes.js
// Maps HTTP verbs + paths to controller functions.
// NOTE: the '/analytics' route MUST be declared before the parametrized-less
// root route matching is fine here since we have no '/:id' route, but it's
// good practice to keep specific routes above generic ones as this file grows.

const express = require('express');
const router = express.Router();

const {
  createSimulation,
  getSimulations,
  getAnalytics,
} = require('../controllers/simulationController');

// GET /api/simulations/analytics -> aggregated performance analytics
router.get('/analytics', getAnalytics);

// POST /api/simulations -> save a completed run
// GET  /api/simulations -> fetch history (most recent first)
router.route('/').post(createSimulation).get(getSimulations);

module.exports = router;