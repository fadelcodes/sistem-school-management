const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, logout, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Validation rules
const loginValidation = [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').notEmpty().withMessage('Password harus diisi')
];

router.post('/login', loginValidation, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;