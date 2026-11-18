const mongoose = require('mongoose');

// Atomic sequence numbers (e.g. employee codes), so numbers are never reused after deletions
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
