const Transaction = require("../models/Transaction");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/dashboard/summary — Viewer, Analyst, Admin
const getSummary = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = result.find((r) => r._id === "income");
    const expense = result.find((r) => r._id === "expense");

    const totalIncome = income?.total || 0;
    const totalExpenses = expense?.total || 0;

    return sendSuccess(res, 200, "Summary fetched.", {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netBalance: Number((totalIncome - totalExpenses).toFixed(2)),
      transactionCounts: {
        income: income?.count || 0,
        expense: expense?.count || 0,
        total: (income?.count || 0) + (expense?.count || 0),
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch summary.", error.message);
  }
};

// GET /api/dashboard/category-breakdown — Analyst, Admin
const getCategoryBreakdown = async (req, res) => {
  try {
    const { type } = req.query;
    const match = { isDeleted: false };
    if (type) match.type = type;

    const breakdown = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id.category",
          type: "$_id.type",
          total: { $round: ["$total", 2] }, // ✅ DB-level rounding
          count: 1,
        },
      },
      { $sort: { total: -1 } },
    ]);

    return sendSuccess(res, 200, "Category breakdown fetched.", breakdown);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch category breakdown.", error.message);
  }
};

// GET /api/dashboard/monthly-trends — Analyst, Admin
const getMonthlyTrends = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$date" }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          type: "$_id.type",
          total: { $round: ["$total", 2] }, // ✅ DB-level rounding
        },
      },
      { $sort: { month: 1 } },
    ]);

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];

    const formatted = monthNames.map((name, i) => {
      const month = i + 1;

      const incomeEntry = trends.find(
        (t) => t.month === month && t.type === "income"
      );
      const expenseEntry = trends.find(
        (t) => t.month === month && t.type === "expense"
      );

      const incomeVal = incomeEntry?.total || 0;
      const expenseVal = expenseEntry?.total || 0;

      return {
        month: name,
        income: Number(incomeVal.toFixed(2)),
        expense: Number(expenseVal.toFixed(2)),
        net: Number((incomeVal - expenseVal).toFixed(2)),
      };
    });

    return sendSuccess(res, 200, "Monthly trends fetched.", {
      year: Number(year),
      trends: formatted,
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch monthly trends.", error.message);
  }
};

// GET /api/dashboard/recent — Viewer, Analyst, Admin
const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    const recent = await Transaction.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("createdBy", "name email");

    return sendSuccess(res, 200, "Recent activity fetched.", recent);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch recent activity.", error.message);
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
};