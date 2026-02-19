const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createAdmin } = require('../controllers/bootstrap.controller');

const createAdminValidation = [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('fullName').notEmpty().withMessage('Nama lengkap harus diisi')
];

router.post('/create-admin', createAdminValidation, createAdmin);

module.exports = router;