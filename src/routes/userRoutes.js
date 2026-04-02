const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { validateUpdateUser } = require("../middleware/validate");

// All user routes require authentication and admin role
router.use(protect, authorize("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id", validateUpdateUser, updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
