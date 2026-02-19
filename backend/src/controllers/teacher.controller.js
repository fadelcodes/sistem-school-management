const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { hashPassword } = require('../utils/bcrypt');
const { createNotification } = require('../utils/notification');

const getTeachers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('teachers')
            .select(`
                *,
                user:user_id(
                    id,
                    email,
                    full_name,
                    phone,
                    address,
                    profile_picture
                )
            `, { count: 'exact' });

        if (search) {
            query = query.or(`nip.ilike.%${search}%,user.full_name.ilike.%${search}%`);
        }

        const { data: teachers, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: teachers,
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

const getTeacherById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: teacher, error } = await supabase
            .from('teachers')
            .select(`
                *,
                user:user_id(*),
                schedules:schedules(
                    *,
                    subject:subject_id(name),
                    class:class_id(name)
                ),
                homeroom_class:classes!homeroom_teacher_id(
                    id,
                    name,
                    grade_level
                )
            `)
            .eq('id', id)
            .single();

        if (error || !teacher) {
            return res.status(404).json({ error: 'Guru tidak ditemukan' });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

const getTeacherByNip = async (req, res, next) => {
    try {
        const { nip } = req.params;

        const { data: teacher, error } = await supabase
            .from('teachers')
            .select(`
                *,
                user:user_id(*)
            `)
            .eq('nip', nip)
            .single();

        if (error || !teacher) {
            return res.status(404).json({ error: 'Guru tidak ditemukan' });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (error) {
        next(error);
    }
};

const getHomeroomTeachers = async (req, res, next) => {
    try {
        const { data: teachers, error } = await supabase
            .from('teachers')
            .select(`
                *,
                user:user_id(full_name),
                homeroom_class:classes!homeroom_teacher_id(name)
            `)
            .not('homeroom_class', 'is', null);

        if (error) throw error;

        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        next(error);
    }
};

const createTeacher = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            nip, 
            fullName, 
            email, 
            password, 
            specialization,
            qualification,
            phone,
            address,
            joinDate 
        } = req.body;

        // Check if email already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email sudah digunakan' });
        }

        // Check if NIP already exists
        const { data: existingTeacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('nip', nip)
            .single();

        if (existingTeacher) {
            return res.status(400).json({ error: 'NIP sudah digunakan' });
        }

        // Get teacher role ID
        const { data: role } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'Guru')
            .single();

        if (!role) {
            return res.status(500).json({ error: 'Role Guru tidak ditemukan' });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user account
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([{
                email,
                password: hashedPassword,
                full_name: fullName,
                role_id: role.id,
                phone,
                address,
                is_active: true,
                created_by: req.userId
            }])
            .select()
            .single();

        if (userError) throw userError;

        // Create teacher record
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .insert([{
                user_id: user.id,
                nip,
                specialization,
                qualification,
                join_date: joinDate || new Date()
            }])
            .select()
            .single();

        if (teacherError) throw teacherError;

        // Create notification
        await createNotification({
            userId: user.id,
            title: 'Selamat Datang',
            message: `Selamat datang di sekolah, ${fullName}. Akun guru Anda telah dibuat.`,
            type: 'user_created',
            referenceId: teacher.id
        });

        res.status(201).json({
            success: true,
            message: 'Guru berhasil ditambahkan',
            data: {
                ...teacher,
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateTeacher = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            nip,
            fullName,
            specialization,
            qualification,
            phone,
            address,
            joinDate,
            isActive
        } = req.body;

        // Get teacher
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('user_id')
            .eq('id', id)
            .single();

        if (teacherError || !teacher) {
            return res.status(404).json({ error: 'Guru tidak ditemukan' });
        }

        // Update user
        const { error: userError } = await supabase
            .from('users')
            .update({
                full_name: fullName,
                phone,
                address,
                is_active: isActive,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', teacher.user_id);

        if (userError) throw userError;

        // Update teacher
        const { data: updatedTeacher, error } = await supabase
            .from('teachers')
            .update({
                nip,
                specialization,
                qualification,
                join_date: joinDate,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Data guru berhasil diupdate',
            data: updatedTeacher
        });
    } catch (error) {
        next(error);
    }
};

const deleteTeacher = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get teacher
        const { data: teacher, error: teacherError } = await supabase
            .from('teachers')
            .select('user_id')
            .eq('id', id)
            .single();

        if (teacherError || !teacher) {
            return res.status(404).json({ error: 'Guru tidak ditemukan' });
        }

        // Check if teacher is homeroom teacher
        const { count } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('homeroom_teacher_id', id);

        if (count > 0) {
            return res.status(400).json({ error: 'Tidak dapat menghapus guru yang menjadi wali kelas' });
        }

        // Delete teacher record
        const { error } = await supabase
            .from('teachers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Data guru berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTeachers,
    getTeacherById,
    getTeacherByNip,
    getHomeroomTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher
};