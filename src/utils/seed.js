require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const connectDB = require("../config/db");

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  await Transaction.deleteMany({});
  console.log("Cleared existing data.");

  // Create users for all three roles
  const admin = await User.create({
    name: "Admin User",
    email: "admin@finance.dev",
    password: "admin123",
    role: "admin",
  });

  const analyst = await User.create({
    name: "Analyst User",
    email: "analyst@finance.dev",
    password: "analyst123",
    role: "analyst",
  });

  await User.create({
    name: "Viewer User",
    email: "viewer@finance.dev",
    password: "viewer123",
    role: "viewer",
  });

  console.log("Users created.");

  // Sample transactions
  const categories = ["salary", "freelance", "rent", "food", "utilities", "transport", "entertainment", "investment"];
  const types = ["income", "expense"];

  const transactions = [];
  for (let i = 0; i < 30; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const incomeCategories = ["salary", "freelance", "investment"];
    const expenseCategories = ["rent", "food", "utilities", "transport", "entertainment"];

    const category =
      type === "income"
        ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
        : expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 180)); // last 6 months

    transactions.push({
      amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
      type,
      category,
      date,
      notes: `Sample ${type} - ${category}`,
      createdBy: Math.random() > 0.5 ? admin._id : analyst._id,
    });
  }

  await Transaction.insertMany(transactions);
  console.log("30 sample transactions created.");

  console.log("\n--- Seed complete. Use these credentials to test ---");
  console.log("Admin:    admin@finance.dev / admin123");
  console.log("Analyst:  analyst@finance.dev / analyst123");
  console.log("Viewer:   viewer@finance.dev / viewer123");

  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
