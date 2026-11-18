const mongoose = require('mongoose');

// Reuses one connection per process (important on serverless platforms such as Vercel).
let connection = null;

const connectDB = async () => {
  if (connection) return connection;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  connection = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    .then(conn => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch(error => {
      connection = null;
      console.error(`❌ MongoDB Error: ${error.message}`);
      throw error;
    });
  return connection;
};

module.exports = connectDB;
