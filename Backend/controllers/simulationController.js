// backend/controllers/simulationController.js
// Business logic for the /api/simulations endpoints.

const Simulation = require('../models/Simulation');

/**
 * @desc    Save a completed sorting simulation's stats
 * @route   POST /api/simulations
 * @access  Public
 * @body    { algorithm, arraySize, executionTimeMs, comparisons, swaps }
 */
const createSimulation = async (req, res) => {
  try {
    const { algorithm, arraySize, executionTimeMs, comparisons, swaps } = req.body;

    // Explicit presence check gives clearer error messages than relying
    // solely on Mongoose validation errors.
    if (
      algorithm === undefined ||
      arraySize === undefined ||
      executionTimeMs === undefined ||
      comparisons === undefined ||
      swaps === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields. Expected: algorithm, arraySize, executionTimeMs, comparisons, swaps.',
      });
    }

    const simulation = await Simulation.create({
      algorithm,
      arraySize,
      executionTimeMs,
      comparisons,
      swaps,
    });

    return res.status(201).json({ success: true, data: simulation });
  } catch (error) {
    // Mongoose validation errors (bad enum, out-of-range numbers, etc.)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(' ') });
    }

    console.error('Error creating simulation:', error);
    return res.status(500).json({ success: false, message: 'Server error while saving simulation.' });
  }
};

/**
 * @desc    Fetch simulation history, most recent first, with optional pagination
 * @route   GET /api/simulations?limit=50&page=1&algorithm=Quick%20Sort
 * @access  Public
 */
const getSimulations = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    // Optional filter so the frontend history dashboard can narrow by algorithm.
    const filter = {};
    if (req.query.algorithm) {
      filter.algorithm = req.query.algorithm;
    }

    const [simulations, total] = await Promise.all([
      Simulation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Simulation.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: simulations.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: simulations,
    });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching simulations.' });
  }
};

/**
 * @desc    Fetch aggregated analytics — e.g. average execution time, average
 *          comparisons, and average swaps per algorithm, optionally filtered
 *          to a specific array size.
 * @route   GET /api/simulations/analytics?arraySize=100
 * @access  Public
 */
const getAnalytics = async (req, res) => {
  try {
    const matchStage = {};

    // If arraySize is provided, filter to simulations of that exact size so
    // comparisons between algorithms are apples-to-apples.
    if (req.query.arraySize) {
      const arraySize = parseInt(req.query.arraySize, 10);
      if (Number.isNaN(arraySize)) {
        return res.status(400).json({ success: false, message: 'arraySize must be a number.' });
      }
      matchStage.arraySize = arraySize;
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $group: {
          _id: '$algorithm',
          avgExecutionTimeMs: { $avg: '$executionTimeMs' },
          avgComparisons: { $avg: '$comparisons' },
          avgSwaps: { $avg: '$swaps' },
          minExecutionTimeMs: { $min: '$executionTimeMs' },
          maxExecutionTimeMs: { $max: '$executionTimeMs' },
          runCount: { $sum: 1 },
        },
      },
      {
        // Round the averages to 2 decimal places for clean display.
        $project: {
          _id: 0,
          algorithm: '$_id',
          avgExecutionTimeMs: { $round: ['$avgExecutionTimeMs', 2] },
          avgComparisons: { $round: ['$avgComparisons', 2] },
          avgSwaps: { $round: ['$avgSwaps', 2] },
          minExecutionTimeMs: 1,
          maxExecutionTimeMs: 1,
          runCount: 1,
        },
      },
      { $sort: { avgExecutionTimeMs: 1 } }
    );

    const analytics = await Simulation.aggregate(pipeline);

    return res.status(200).json({ success: true, filteredByArraySize: matchStage.arraySize ?? null, data: analytics });
  } catch (error) {
    console.error('Error building analytics:', error);
    return res.status(500).json({ success: false, message: 'Server error while building analytics.' });
  }
};

module.exports = {
  createSimulation,
  getSimulations,
  getAnalytics,
};