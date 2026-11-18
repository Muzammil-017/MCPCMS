// Shared demo accounts (created by `npm run seed:demo`) are used by many visitors at once,
// so actions that would lock others out (password/email changes, deactivation, deletion) are blocked for them.
const DEMO_MESSAGE = 'This is a shared demo account, so this action is disabled.';

const rejectDemo = (res) => res.status(403).json({ success: false, message: DEMO_MESSAGE });

module.exports = { DEMO_MESSAGE, rejectDemo };
