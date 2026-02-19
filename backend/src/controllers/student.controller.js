const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { hashPassword } = require('../utils/bcrypt');
const { createNotification } = require('../utils/notification');

const getStudents = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, classId, search } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('students')
            .select(`
                *,
                user:user_id(
                    id,
                    email,
                    full_name,
                    phone,
                    address,
                    profile_picture
                ),
                class:class_id(
                    id,
                    name,
                    grade_level,
                    jurusan:jurusan_id(name)
                ),
                parent:parent_id(
                    id,
                    full_name,
                    email,
                    phone
                )
            `, { count: 'exact' });

        if (classId) {
            query = query.eq('class_id', classId);
        }

        if (search) {
            query = query.or(`nis.ilike.%${search}%,user.full_name.ilike.%${search}%`);
        }

        const { data: students, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: students,
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

const getStudentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: student, error } = await supabase
            .from('students')
            .select(`
                *,
                user:user_id(*),
                class:class_id(*),
                parent:parent_id(*),
                grades:grades(
                    *,
                    subject:subject_id(name),
                    teacher:teacher_id(user:user_id(full_name))
                ),
                attendance:attendance(
                    *,
                    schedule:schedule_id(
                        subject:subject_id(name)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error || !student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

const getStudentByNis = async (req, res, next) => {
    try {
        const { nis } = req.params;

        const { data: student, error } = await supabase
            .from('students')
            .select(`
                *,
                user:user_id(*),
                class:class_id(*)
            `)
            .eq('nis', nis)
            .single();

        if (error || !student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

const getStudentsByClass = async (req, res, next) => {
    try {
        const { classId } = req.params;

        const { data: students, error } = await supabase
            .from('students')
            .select(`
                *,
                user:user_id(full_name, email)
            `)
            .eq('class_id', classId)
            .order('user(full_name)');

        if (error) throw error;

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

const createStudent = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { 
            nis, 
            nisn, 
            fullName, 
            email, 
            password, 
            classId, 
            parentId,
            birthDate,
            birthPlace,
            gender,
            religion,
            phone,
            address 
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

        // Check if NIS already exists
        const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('nis', nis)
            .single();

        if (existingStudent) {
            return res.status(400).json({ error: 'NIS sudah digunakan' });
        }

        // Get student role ID
        const { data: role } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'Siswa')
            .single();

        if (!role) {
            return res.status(500).json({ error: 'Role Siswa tidak ditemukan' });
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

        // Create student record
        const { data: student, error: studentError } = await supabase
            .from('students')
            .insert([{
                user_id: user.id,
                nis,
                nisn,
                class_id: classId || null,
                parent_id: parentId || null,
                birth_date: birthDate,
                birth_place: birthPlace,
                gender,
                religion,
                enrollment_date: new Date()
            }])
            .select()
            .single();

        if (studentError) throw studentError;

        // Create notification
        await createNotification({
            userId: user.id,
            title: 'Selamat Datang',
            message: `Selamat datang di sekolah, ${fullName}. Akun siswa Anda telah dibuat.`,
            type: 'user_created',
            referenceId: student.id
        });

        res.status(201).json({
            success: true,
            message: 'Siswa berhasil ditambahkan',
            data: {
                ...student,
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
            nis,
            nisn,
            fullName,
            classId,
            parentId,
            birthDate,
            birthPlace,
            gender,
            religion,
            phone,
            address,
            isActive
        } = req.body;

        // Get student
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('user_id')
            .eq('id', id)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
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
            .eq('id', student.user_id);

        if (userError) throw userError;

        // Update student
        const { data: updatedStudent, error } = await supabase
            .from('students')
            .update({
                nis,
                nisn,
                class_id: classId,
                parent_id: parentId,
                birth_date: birthDate,
                birth_place: birthPlace,
                gender,
                religion,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Data siswa berhasil diupdate',
            data: updatedStudent
        });
    } catch (error) {
        next(error);
    }
};

const deleteStudent = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get student
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('user_id')
            .eq('id', id)
            .single();

        if (studentError || !student) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        // Delete student record (will cascade to user due to foreign key)
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Data siswa berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStudents,
    getStudentById,
    getStudentByNis,
    getStudentsByClass,
    createStudent,
    updateStudent,
    deleteStudent
};