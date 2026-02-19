const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');
const path = require('path');
const fs = require('fs');

const getMaterials = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, subjectId, teacherId } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('materials')
            .select(`
                *,
                subject:subject_id(name, code),
                teacher:teacher_id(user:user_id(full_name)),
                created_by:created_by(full_name)
            `, { count: 'exact' });

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data: materials, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: materials,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const getMaterialById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: material, error } = await supabase
            .from('materials')
            .select(`
                *,
                subject:subject_id(*),
                teacher:teacher_id(*),
                created_by:created_by(full_name)
            `)
            .eq('id', id)
            .single();

        if (error || !material) {
            return res.status(404).json({ error: 'Materi tidak ditemukan' });
        }

        // Increment view count
        await supabase
            .from('materials')
            .update({ views: (material.views || 0) + 1 })
            .eq('id', id);

        res.json({
            success: true,
            data: material
        });
    } catch (error) {
        next(error);
    }
};

const createMaterial = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { subjectId, title, description } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'File materi harus diupload' });
        }

        // Get teacher id from user id
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (!teacher) {
            return res.status(400).json({ error: 'Anda tidak terdaftar sebagai guru' });
        }

        // Create file URL
        const fileUrl = `/uploads/materials/${file.filename}`;
        const fileType = path.extname(file.originalname).substring(1);

        const { data: material, error } = await supabase
            .from('materials')
            .insert([{
                subject_id: subjectId,
                teacher_id: teacher.id,
                title,
                description,
                file_url: fileUrl,
                file_type: fileType,
                file_size: file.size,
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        // Get all students in classes that study this subject
        const { data: schedules } = await supabase
            .from('schedules')
            .select('class_id')
            .eq('subject_id', subjectId);

        if (schedules && schedules.length > 0) {
            const classIds = [...new Set(schedules.map(s => s.class_id))];
            
            const { data: students } = await supabase
                .from('students')
                .select('user_id')
                .in('class_id', classIds);

            // Get subject name
            const { data: subject } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', subjectId)
                .single();

            // Notify each student
            for (const student of students) {
                await createNotification({
                    userId: student.user_id,
                    title: 'Materi Baru',
                    message: `Materi baru: ${title} untuk ${subject.name}`,
                    type: 'material_uploaded',
                    referenceId: material.id
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Materi berhasil diupload',
            data: material
        });
    } catch (error) {
        next(error);
    }
};

const updateMaterial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;
        const file = req.file;

        const updateData = {
            title,
            description,
            updated_by: req.userId,
            updated_at: new Date()
        };

        if (file) {
            // Get old material to delete old file
            const { data: oldMaterial } = await supabase
                .from('materials')
                .select('file_url')
                .eq('id', id)
                .single();

            if (oldMaterial && oldMaterial.file_url) {
                const oldFilePath = path.join(__dirname, '../../', oldMaterial.file_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            updateData.file_url = `/uploads/materials/${file.filename}`;
            updateData.file_type = path.extname(file.originalname).substring(1);
            updateData.file_size = file.size;
        }

        const { data: material, error } = await supabase
            .from('materials')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!material) {
            return res.status(404).json({ error: 'Materi tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Materi berhasil diupdate',
            data: material
        });
    } catch (error) {
        next(error);
    }
};

const deleteMaterial = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get material to delete file
        const { data: material } = await supabase
            .from('materials')
            .select('file_url')
            .eq('id', id)
            .single();

        if (material && material.file_url) {
            const filePath = path.join(__dirname, '../../', material.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        const { error } = await supabase
            .from('materials')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Materi berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

const getMaterialsBySubject = async (req, res, next) => {
    try {
        const subjectId = req.params.subjectId;

        const { data: materials, error } = await supabase
            .from('materials')
            .select(`
                *,
                teacher:teacher_id(user:user_id(full_name))
            `)
            .eq('subject_id', subjectId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: materials
        });
    } catch (error) {
        next(error);
    }
};

const downloadMaterial = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: material, error } = await supabase
            .from('materials')
            .select('file_url, title')
            .eq('id', id)
            .single();

        if (error || !material) {
            return res.status(404).json({ error: 'Materi tidak ditemukan' });
        }

        const filePath = path.join(__dirname, '../../', material.file_url);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        // Increment download count
        await supabase
            .from('materials')
            .update({ downloads: (material.downloads || 0) + 1 })
            .eq('id', id);

        res.download(filePath, material.title + path.extname(filePath));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    getMaterialsBySubject,
    downloadMaterial
};