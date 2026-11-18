// Vercel serverless entry point: every request is routed here (see vercel.json).
const app = require('../app');
const connectDB = require('../config/db');
const { seedSuperAdmin } = require('../services/seedService');

let ready = null;
const init = () => {
  if (!ready) ready = connectDB().then(seedSuperAdmin).catch(error => { ready = null; throw error; });
  return ready;
};

module.exports = async (req, res) => {
  try {
    await init();
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Database unavailable, please try again shortly' });
  }
  return app(req, res);
};
