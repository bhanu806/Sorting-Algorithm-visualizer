// backend/config/db.js
// Handles the MongoDB connection using Mongoose.

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI supplied via environment variables.
 * Exits the process if the connection fails, since the API is unusable
 * without a database connection.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sorting_visualizer';

    const conn = await mongoose.connect(mongoUri, {
      // Modern Mongoose (6+/7+/8+) no longer needs useNewUrlParser / useUnifiedTopology,
      // but they are harmless to omit. Keeping options object for future flags.
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Fail fast — an API server with no DB is not useful in this app.
    process.exit(1);
  }
};

module.exports = connectDB;