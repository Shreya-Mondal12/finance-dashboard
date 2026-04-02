const Transaction = require("../models/Transaction");
const { sendSuccess, sendError } = require("../utils/response");

// Build filter object from query params
const buildFilter = ({ type, category, startDate, endDate }) => {
  const filter = { isDeleted: false };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  return filter;
};

// GET /api/transactions — Viewer, Analyst, Admin
const getAllTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search, // ✅ NEW
      page = 1,
      limit = 10,
      sort = "-date",
    } = req.query;

    const filter = buildFilter({ type, category, startDate, endDate });

    // 🔥 ADD SEARCH HERE (KEY CHANGE)
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "Transactions fetched.", {
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch transactions.", error.message);
  }
};

// GET /api/transactions/:id — Viewer, Analyst, Admin
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("createdBy", "name email");

    if (!transaction) return sendError(res, 404, "Transaction not found.");
    return sendSuccess(res, 200, "Transaction fetched.", transaction);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch transaction.", error.message);
  }
};

// POST /api/transactions — Admin only
const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, "Transaction created.", transaction);
  } catch (error) {
    return sendError(res, 500, "Failed to create transaction.", error.message);
  }
};

// PUT /api/transactions/:id — Admin only
const updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );

    if (!transaction) return sendError(res, 404, "Transaction not found.");
    return sendSuccess(res, 200, "Transaction updated.", transaction);
  } catch (error) {
    return sendError(res, 500, "Failed to update transaction.", error.message);
  }
};

// DELETE /api/transactions/:id — Admin only (soft delete)
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!transaction) return sendError(res, 404, "Transaction not found.");
    return sendSuccess(res, 200, "Transaction deleted.");
  } catch (error) {
    return sendError(res, 500, "Failed to delete transaction.", error.message);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
