// backend/middleware/validators.js
// Security layer: input validation.
// Each export is a list of express-validator rules, ending with a small
// handler that replies 400 with a consistent shape if any rule failed.
// Peeyoosh uses these like: router.post('/register', registerValidation, register)

const { body, validationResult } = require('express-validator');

// Runs last in every array below. If any rule above it failed, stop here
// and send 400. Otherwise let the request continue to the real route.
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  // 6 is the model's minimum (see models/User.js). If this ever becomes
  // stricter, Peeyoosh and Yogesh must be told so the frontend form matches.
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

// Must match models/Application.js exactly
const APPLICATION_STATUSES = [
  'Applied',
  'Interview Scheduled',
  'Interviewed',
  'Offer',
  'Rejected',
];

const applicationValidation = [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  // checkFalsy: true means an empty string ('') counts as "not sent" too,
  // not just a missing field, since forms often submit empty strings.
  body('status')
    .optional({ checkFalsy: true })
    .isIn(APPLICATION_STATUSES)
    .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
  body('appliedDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Applied date must be a valid date (YYYY-MM-DD)'),
  body('deadline')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Deadline must be a valid date (YYYY-MM-DD)'),
  body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be text'),
  handleValidationErrors,
];

module.exports = { registerValidation, loginValidation, applicationValidation };