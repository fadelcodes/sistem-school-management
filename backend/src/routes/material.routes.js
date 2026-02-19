const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialsBySubject,
    downloadMaterial
} = require('../controllers/material.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

router.get('/', getMaterials);
router.get('/subject/:subjectId', getMaterialsBySubject);
router.get('/:id', getMaterialById);
router.get('/:id/download', downloadMaterial);

router.post('/',
    authorize('Guru', 'Admin'),
    upload.single('file'),
    [
        body('subjectId').isUUID().withMessage('Mata pelajaran tidak valid'),
        body('title').notEmpty().withMessage('Judul harus diisi')
    ],
    createMaterial
);

router.put('/:id',
    authorize('Guru', 'Admin'),
    upload.single('file'),
    updateMaterial
);

router.delete('/:id',
    authorize('Guru', 'Admin'),
    deleteMaterial
);

module.exports = router;