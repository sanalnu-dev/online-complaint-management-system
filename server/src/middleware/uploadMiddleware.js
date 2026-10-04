const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Absolute path to uploads folder
const uploadDir = path.resolve(__dirname, '../../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    cb(null, `${Date.now()}-${randomHex}-${safeBase}${ext}`);
  }
});

// Allowed mimetypes and extensions
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are allowed.'), false);
  }
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5;

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024 // 5MB limit
  }
});

// Wrapper to provide clean JSON errors for upload failures
function handleOptionalUpload(fieldName = 'attachment') {
  const uploadSingle = upload.single(fieldName);

  return (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `Attachment file size exceeds the ${maxFileSizeMB}MB limit`
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
}

module.exports = {
  upload,
  handleOptionalUpload,
  uploadDir
};
