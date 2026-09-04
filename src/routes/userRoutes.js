const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, deactivateUser } = require('../controllers/userController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (require authentication - middleware to be added)
router.get('/me', getMe);

// Admin-only routes
router.get('/', getAllUsers);
router.delete('/:id', deactivateUser);

module.exports = router;
