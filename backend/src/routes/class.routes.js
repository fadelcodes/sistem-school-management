const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route   GET /api/classes
 * @desc    Get all classes
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        console.log('📥 Fetching classes...');
        
        const { limit = 100, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        // First, check if tables exist
        const { error: checkError } = await supabase
            .from('classes')
            .select('id')
            .limit(1);

        if (checkError) {
            console.error('❌ Database error:', checkError);
            
            if (checkError.code === '42P01') {
                return res.status(500).json({
                    success: false,
                    error: 'Tabel classes tidak ditemukan. Jalankan SQL setup terlebih dahulu.',
                    details: checkError.message
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Gagal mengakses database',
                details: checkError.message
            });
        }

        // Simple query without joins first
        const { data: classes, error, count } = await supabase
            .from('classes')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('name');

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(500).json({
                success: false,
                error: 'Gagal mengambil data kelas',
                details: error.message
            });
        }

        console.log(`✅ Found ${classes?.length || 0} classes`);

        res.json({
            success: true,
            data: classes || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: error.message
        });
    }
});

/**
 * @route   GET /api/classes/:id
 * @desc    Get class by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📥 Fetching class by ID:', id);

        const { data: classData, error } = await supabase
            .from('classes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('❌ Supabase error:', error);
            if (error.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    error: 'Kelas tidak ditemukan'
                });
            }
            return res.status(500).json({
                success: false,
                error: 'Gagal mengambil data kelas',
                details: error.message
            });
        }

        res.json({
            success: true,
            data: classData
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: error.message
        });
    }
});

/**
 * @route   POST /api/classes
 * @desc    Create a new class
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const { name, grade_level, capacity, room_number } = req.body;

        console.log('📥 Creating new class:', { name, grade_level });

        if (!name || !grade_level) {
            return res.status(400).json({
                success: false,
                error: 'Nama dan tingkat kelas harus diisi'
            });
        }

        const { data, error } = await supabase
            .from('classes')
            .insert([{
                name,
                grade_level,
                capacity,
                room_number,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: req.userId
            }])
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        console.log('✅ Class created:', data[0].id);

        res.status(201).json({
            success: true,
            message: 'Kelas berhasil dibuat',
            data: data[0]
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: error.message
        });
    }
});

/**
 * @route   PUT /api/classes/:id
 * @desc    Update a class
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        console.log('📥 Updating class:', id, updates);

        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.created_at;
        delete updates.created_by;

        updates.updated_at = new Date();
        updates.updated_by = req.userId;

        const { data, error } = await supabase
            .from('classes')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Kelas tidak ditemukan'
            });
        }

        console.log('✅ Class updated:', id);

        res.json({
            success: true,
            message: 'Kelas berhasil diupdate',
            data: data[0]
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: error.message
        });
    }
});

/**
 * @route   DELETE /api/classes/:id
 * @desc    Delete a class
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📥 Deleting class:', id);

        // Check if class has students
        const { count, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', id);

        if (countError) {
            console.error('❌ Error checking students:', countError);
            return res.status(500).json({
                success: false,
                error: 'Gagal memeriksa siswa dalam kelas'
            });
        }

        if (count > 0) {
            return res.status(400).json({
                success: false,
                error: 'Tidak dapat menghapus kelas yang masih memiliki siswa'
            });
        }

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase error:', error);
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        console.log('✅ Class deleted:', id);

        res.json({
            success: true,
            message: 'Kelas berhasil dihapus'
        });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan pada server',
            details: error.message
        });
    }
});

module.exports = router;