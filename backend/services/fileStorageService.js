const mongoose = require('mongoose');

// Files are stored inside MongoDB using GridFS, so no external storage is needed.
// Each kind of file has its own bucket, e.g. "bills" for reimbursement bills, "payslips" for issued payslips.
const DEFAULT_BUCKET = 'bills';
const GRIDFS_PREFIX = 'gridfs:';

const getBucket = (bucketName = DEFAULT_BUCKET) =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });

const safeFileName = (fileName = 'file') => fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

const isGridFsRef = (ref = '') => String(ref).startsWith(GRIDFS_PREFIX);

const refToId = (ref) => new mongoose.Types.ObjectId(String(ref).slice(GRIDFS_PREFIX.length));

// Saves the file and returns a reference string to keep in the document (e.g. "gridfs:<id>")
const saveFile = ({ file, metadata = {}, bucket }) => new Promise((resolve, reject) => {
  if (!file?.buffer) return reject(new Error('File is required'));

  const uploadStream = getBucket(bucket).openUploadStream(safeFileName(file.originalname), {
    contentType: file.mimetype,
    metadata: { ...metadata, originalName: file.originalname }
  });

  uploadStream.on('error', reject);
  uploadStream.on('finish', () => resolve(`${GRIDFS_PREFIX}${uploadStream.id}`));
  uploadStream.end(file.buffer);
});

const getFile = async (ref, { bucket } = {}) => {
  const id = refToId(ref);
  const [info] = await getBucket(bucket).find({ _id: id }).toArray();
  if (!info) throw new Error('File not found');

  const chunks = [];
  for await (const chunk of getBucket(bucket).openDownloadStream(id)) chunks.push(chunk);

  return {
    buffer: Buffer.concat(chunks),
    contentType: info.contentType || 'application/octet-stream'
  };
};

const deleteFile = async (ref, { bucket } = {}) => {
  if (!isGridFsRef(ref)) return;
  await getBucket(bucket).delete(refToId(ref)).catch(() => {});
};

module.exports = { saveFile, getFile, deleteFile, isGridFsRef };
