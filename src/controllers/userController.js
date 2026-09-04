const userService = require('../services/userService');

/**
 * POST /api/users/register
 * Create a new user account.
 */
const register = async (req, res, next) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json({ success: true, message: 'Account created successfully.', data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/login
 * Authenticate and receive a JWT token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const result = await userService.loginUser(email, password);
    res.json({ success: true, message: 'Login successful.', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/me
 * Get the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users
 * List all users (admin only).
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Deactivate a user account (admin only).
 */
const deactivateUser = async (req, res, next) => {
  try {
    const user = await userService.deactivateUser(req.params.id);
    res.json({ success: true, message: 'User account deactivated.', data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, getAllUsers, deactivateUser };
