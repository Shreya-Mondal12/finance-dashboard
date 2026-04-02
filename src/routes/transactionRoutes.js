const express = require("express");
const router = express.Router();
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/auth");
const { validateTransaction, validateTransactionFilters } = require("../middleware/validate");

// All routes require authentication
router.use(protect);

// Read access: all roles
router.get("/", authorize("viewer", "analyst", "admin"), validateTransactionFilters, getAllTransactions);
router.get("/:id", authorize("viewer", "analyst", "admin"), getTransactionById);

// Write access: admin only
router.post("/", authorize("admin"), validateTransaction, createTransaction);
router.put("/:id", authorize("admin"), validateTransaction, updateTransaction);
router.delete("/:id", authorize("admin"), deleteTransaction);

module.exports = router;
