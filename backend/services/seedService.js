const User = require('../models/User');

// Creates the SuperAdmin from SEED_SUPER_ADMIN_* on first start.
// An existing SuperAdmin is left alone (so password changes made in the app are kept),
// unless SEED_SUPER_ADMIN_RESET=true, which resets its email/password back to the .env values (account recovery).
const seedSuperAdmin = async () => {
  const { SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD } = process.env;
  if (!SEED_SUPER_ADMIN_EMAIL || !SEED_SUPER_ADMIN_PASSWORD) return;

  const seedEmail = SEED_SUPER_ADMIN_EMAIL.toLowerCase();
  const superAdmin = await User.findOne({ role: 'SuperAdmin' }).select('+password');

  if (superAdmin) {
    if (process.env.SEED_SUPER_ADMIN_RESET !== 'true') return;
    superAdmin.name = process.env.SEED_SUPER_ADMIN_NAME || superAdmin.name || 'Super Admin';
    superAdmin.email = seedEmail;
    if (!(await superAdmin.matchPassword(SEED_SUPER_ADMIN_PASSWORD))) superAdmin.password = SEED_SUPER_ADMIN_PASSWORD;
    superAdmin.isActive = true;
    await superAdmin.save();
    console.log(`Reset SuperAdmin user from .env: ${seedEmail} (set SEED_SUPER_ADMIN_RESET back to false)`);
    return;
  }

  if (await User.exists({ email: seedEmail })) {
    console.warn(`Cannot seed SuperAdmin: ${seedEmail} is already used by another account`);
    return;
  }

  await User.create({
    name: process.env.SEED_SUPER_ADMIN_NAME || 'Super Admin',
    email: seedEmail,
    password: SEED_SUPER_ADMIN_PASSWORD,
    role: 'SuperAdmin'
  });

  console.log(`Seeded SuperAdmin user: ${seedEmail}`);
};

module.exports = { seedSuperAdmin };
