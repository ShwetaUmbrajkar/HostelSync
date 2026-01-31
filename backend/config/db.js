const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Add retry options for better handling
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30s
      retryWrites: true,
      w: 'majority',
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Don't exit; let server run but warn
    // process.exit(1); // Commented out to keep server alive for debugging
  }
};

module.exports = connectDB;