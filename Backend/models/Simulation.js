// backend/models/Simulation.js
// Defines the schema for a single sorting "simulation" run, i.e. one
// completed visualization that the frontend reports back to the API.

const mongoose = require('mongoose');

const ALLOWED_ALGORITHMS = [
  'Bubble Sort',
  'Selection Sort',
  'Insertion Sort',
  'Merge Sort',
  'Quick Sort',
  'Heap Sort',
];

const simulationSchema = new mongoose.Schema(
  {
    algorithm: {
      type: String,
      required: [true, 'Algorithm name is required'],
      enum: {
        values: ALLOWED_ALGORITHMS,
        message: '{VALUE} is not a supported algorithm',
      },
    },
    arraySize: {
      type: Number,
      required: [true, 'Array size is required'],
      min: [2, 'Array size must be at least 2'],
      max: [2000, 'Array size cannot exceed 2000'],
    },
    executionTimeMs: {
      type: Number,
      required: [true, 'Execution time (ms) is required'],
      min: [0, 'Execution time cannot be negative'],
    },
    comparisons: {
      type: Number,
      required: [true, 'Comparison count is required'],
      min: [0, 'Comparisons cannot be negative'],
    },
    swaps: {
      type: Number,
      required: [true, 'Swap count is required'],
      min: [0, 'Swaps cannot be negative'],
    },
  },
  {
    // createdAt / updatedAt timestamps are useful for the "most recent" sort
    // in the history endpoint, and for future time-series analytics.
    timestamps: true,
  }
);

// Index to make "most recent history" queries fast at scale.
simulationSchema.index({ createdAt: -1 });

// Compound index to speed up the analytics aggregation, which groups by
// algorithm and frequently filters by arraySize.
simulationSchema.index({ algorithm: 1, arraySize: 1 });

module.exports = mongoose.model('Simulation', simulationSchema);
module.exports.ALLOWED_ALGORITHMS = ALLOWED_ALGORITHMS;