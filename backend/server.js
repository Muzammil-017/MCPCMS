// Local / traditional server entry point: connects to MongoDB, seeds the SuperAdmin and listens on PORT.
const app = require('./app');
const connectDB = require('./config/db');
const { seedSuperAdmin } = require('./services/seedService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedSuperAdmin();
    app.listen(PORT, () => console.log(` MCPCMS Server running on port ${PORT}`));
  } catch (error) {
    console.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

startServer();
