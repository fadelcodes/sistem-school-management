const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
} = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('Super Admin'));

router.get('/', getRoles);
router.get('/:id', getRoleById);

router.post('/',
    [
        body('name').notEmpty().withMessage('Nama role harus diisi')
    ],
    createRole
);

router.put('/:id',
    [
        body('name').optional().notEmpty()
    ],
    updateRole
);

router.delete('/:id', deleteRole);

module.exports = router;