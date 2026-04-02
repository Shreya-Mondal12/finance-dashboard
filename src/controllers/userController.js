const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/users — Admin only
const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, "Users fetched.", {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return sendError(res, 500, "Failed to fetch users.", error.message);
  }
};

// GET /api/users/:id — Admin only
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, "User not found.");
    return sendSuccess(res, 200, "User fetched.", user);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch user.", error.message);
  }
};

// PATCH /api/users/:id — Admin only (update role or status)
const updateUser = async (req, res) => {
  try {
    const { name, role, status } = req.body;

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString() && status === "inactive") {
      return sendError(res, 400, "You cannot deactivate your own account.");
    }

    const updates = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (status) updates.status = status;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return sendError(res, 404, "User not found.");
    return sendSuccess(res, 200, "User updated.", user);
  } catch (error) {
    return sendError(res, 500, "Failed to update user.", error.message);
  }
};

// DELETE /api/users/:id — Admin only (hard delete)
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 400, "You cannot delete your own account.");
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 404, "User not found.");

    return sendSuccess(res, 200, "User deleted.");
  } catch (error) {
    return sendError(res, 500, "Failed to delete user.", error.message);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
