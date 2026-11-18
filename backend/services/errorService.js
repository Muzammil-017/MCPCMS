// Maps errors to the right HTTP status: bad input from the client is a 400, not a server error.
const statusFor = (err) => {
  if (err?.name === 'ValidationError' || err?.name === 'CastError') return 400;
  if (err?.code === 11000) return 409;
  if (err?.name === 'MulterError') return 400;
  return err?.status || 500;
};

const messageFor = (err) => {
  if (err?.name === 'CastError') return `Invalid ${err.path === '_id' ? 'id' : err.path}`;
  if (err?.name === 'ValidationError') return Object.values(err.errors).map(e => e.message).join(', ');
  if (err?.code === 11000) return `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ') || 'a unique field'}`;
  return err?.message || 'Internal server error';
};

const sendError = (res, err) => {
  const status = statusFor(err);
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message: messageFor(err) });
};

module.exports = { sendError, statusFor, messageFor };
