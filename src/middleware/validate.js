const { body, query, param, validationResult } = require("express-validator");
const { sendError } = require("../utils/response");

// Collect and return validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 422, "Validation failed.", errors.array());
  }
  next();
};

// Auth validations
const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin"),
  handleValidationErrors,
];

const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Transaction validations
const validateTransaction = [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),
  body("category")
    .isIn([
      "salary","freelance","investment","rent","food","utilities",
      "transport","healthcare","entertainment","shopping","education","other",
    ])
    .withMessage("Invalid category"),
  body("date").optional().isISO8601().withMessage("Date must be a valid ISO date"),
  body("notes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),
  handleValidationErrors,
];

// Query filter validations
const validateTransactionFilters = [
  query("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  query("category")
    .optional()
    .isIn(["salary","freelance","investment","rent","food","utilities","transport","healthcare","entertainment","shopping","education","other"])
    .withMessage("Invalid category"),
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid ISO date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid ISO date"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

// User update validation
const validateUpdateUser = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("role")
    .optional()
    .isIn(["viewer", "analyst", "admin"])
    .withMessage("Role must be viewer, analyst, or admin"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be active or inactive"),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTransaction,
  validateTransactionFilters,
  validateUpdateUser,
};
