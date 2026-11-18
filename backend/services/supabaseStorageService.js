const { createClient } = require('@supabase/supabase-js');

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_REIMBURSEMENT_BUCKET'];

const getClient = () => {
  const missing = requiredEnv.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Supabase storage environment variables: ${missing.join(', ')}`);
  }

  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
};

const safeFileName = (fileName = 'bill') => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const uploadReimbursementBill = async ({ file, companyId, employeeId }) => {
  if (!file?.buffer) throw new Error('Bill file is required');

  const supabase = getClient();
  const bucket = process.env.SUPABASE_REIMBURSEMENT_BUCKET;
  const objectPath = [
    String(companyId),
    String(employeeId),
    `${Date.now()}-${safeFileName(file.originalname)}`
  ].join('/');

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return objectPath;
};

const downloadReimbursementBill = async (objectPath) => {
  const supabase = getClient();
  const bucket = process.env.SUPABASE_REIMBURSEMENT_BUCKET;

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(objectPath);

  if (error) throw new Error(`Supabase download failed: ${error.message}`);

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || 'application/octet-stream'
  };
};

module.exports = {
  uploadReimbursementBill,
  downloadReimbursementBill
};
