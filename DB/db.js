const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4, // Forces IPv4
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
    console.log(`\n✅  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📅  Database Name: ${conn.connection.name}\n`);
  } catch (error) {
    console.error('\n❌  MongoDB Connection Error:');
    console.error(`📝  Message: ${error.message}`);
    console.error('💡  Tip: Ensure your current IP address is whitelisted in MongoDB Atlas.');
    console.error('🔗  Whitelist settings: https://www.mongodb.com/docs/atlas/security-whitelist/\n');
    process.exit(1);
  }
};

module.exports = connectDB;
