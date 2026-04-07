/**
 * Multer upload middleware for verification documents.
 *
 * Accepts: image/* and application/pdf
 * Max size: 5 MB
 * Storage: disk, saved to uploads/documents/
 *
 * Validates: Requirements 2.3
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = /^(image\/(jpeg|png|gif|webp|bmp)|application\/pdf)$/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image or PDF files are allowed.', 400));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
