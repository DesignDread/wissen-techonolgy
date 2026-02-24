import dotenv from 'dotenv';
import cron from 'node-cron';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initializeAutobookingCron } from './src/utils/cronJobs.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize CRON jobs
    initializeAutobookingCron(cron);

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
