require("dotenv").config();
const express = require("express");
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Finance Dashboard API is running." });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");

// Apply general limiter
app.use("/api", apiLimiter);

// Apply strict limiter to auth
app.use("/api/auth", authLimiter);

module.exports = app;
