const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getJurusan,
    getJurusanById,
    createJurusan,
    updateJurusan,
    deleteJurusan,
    getJurusanByCode
} = require('../controllers/jurusan.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getJurusan);
router.get('/code/:code', getJurusanByCode);
router.get('/:id', getJurusanById);

router.post('/',
    authorize('Super Admin', 'Admin'),
    [
        body('code').notEmpty().withMessage('Kode jurusan harus diisi'),
        body('name').notEmpty().withMessage('Nama jurusan harus diisi')
    ],
    createJurusan
);

router.put('/:id',
    authorize('Super Admin', 'Admin'),
    updateJurusan
);

router.delete('/:id',
    authorize('Super Admin', 'Admin'),
    deleteJurusan
);

module.exports = router;