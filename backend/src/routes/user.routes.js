const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
    getUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser,
    resetPassword 
} = require('../controllers/user.controller');
const { authorize } = require('../middleware/auth');

// All routes require authentication and specific roles
router.use(authorize('Super Admin', 'Admin'));

const createUserValidation = [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
    body('fullName').notEmpty().withMessage('Nama lengkap harus diisi'),
    body('roleId').isUUID().withMessage('Role ID tidak valid')
];

const updateUserValidation = [
    body('fullName').optional().notEmpty(),
    body('phone').optional(),
    body('address').optional(),
    body('isActive').optional().isBoolean()
];

const resetPasswordValidation = [
    body('newPassword').isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
];

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUserValidation, createUser);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPasswordValidation, resetPassword);

module.exports = router;