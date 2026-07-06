// config/db.js
// Establishes and monitors the MongoDB connection via Mongoose.
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅  MongoDB connected → ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }
};

// Warn on unexpected disconnection (e.g. Atlas failover)
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️   MongoDB disconnected — reconnecting...")
);

module.exports = connectDB;
