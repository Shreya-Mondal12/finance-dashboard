const express = require("express");
const router = express.Router();
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// All roles can see summary and recent activity
router.get("/summary", authorize("viewer", "analyst", "admin"), getSummary);
router.get("/recent", authorize("viewer", "analyst", "admin"), getRecentActivity);

// Analyst and admin only — deeper analytics
router.get("/category-breakdown", authorize("analyst", "admin"), getCategoryBreakdown);
router.get("/monthly-trends", authorize("analyst", "admin"), getMonthlyTrends);

module.exports = router;
