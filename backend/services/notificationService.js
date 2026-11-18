const Notification = require('../models/Notification');

// Creates a notification for one employee. A failure here never blocks the action that triggered it.
const notify = async (employeeId, companyId, title, message, type = 'Info') => {
  try {
    await Notification.create({
      employeeId: employeeId?._id || employeeId,
      companyId: companyId?._id || companyId,
      title,
      message,
      type,
    });
  } catch (err) {
    console.error(`Notification not saved: ${err.message}`);
  }
};

module.exports = { notify };
