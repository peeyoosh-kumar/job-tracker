const multer = require('multer');
const path = require('path');

// Where uploaded files get saved, and what they get renamed to.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // saves into backend/uploads/
  },
  filename: (req, file, cb) => {
    // Renamed to: <applicationId>-<timestamp><original extension>
    // This avoids filename collisions and keeps the extension for correct file type handling.
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  }
});

// Only allow PDF and Word documents.
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true); // accept the file
  } else {
    cb(new Error('Only PDF and Word documents are allowed'), false); // reject it
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;