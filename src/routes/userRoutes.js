const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, deactivateUser } = require('../controllers/userController');
// TODO: import authenticate middleware once it exists
// const authenticate = require('../middleware/authenticate');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes - authenticate middleware not yet applied (forgot to create the file!)
router.get('/me', getMe);

// Admin-only routes
router.get('/', getAllUsers);
router.delete('/:id', deactivateUser);

module.exports = router;
