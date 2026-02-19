const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');
const path = require('path');
const fs = require('fs');

const getAssignments = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, classId, subjectId, teacherId } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('assignments')
            .select(`
                *,
                subject:subject_id(name, code),
                teacher:teacher_id(user:user_id(full_name)),
                class:class_id(name),
                submissions:assignment_submissions(count)
            `, { count: 'exact' });

        if (classId) {
            query = query.eq('class_id', classId);
        }

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data: assignments, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('deadline');

        if (error) throw error;

        res.json({
            success: true,
            data: assignments,
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

const getAssignmentById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: assignment, error } = await supabase
            .from('assignments')
            .select(`
                *,
                subject:subject_id(*),
                teacher:teacher_id(*),
                class:class_id(*),
                submissions:assignment_submissions(
                    *,
                    student:student_id(
                        nis,
                        user:user_id(full_name)
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error || !assignment) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan' });
        }

        res.json({
            success: true,
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

const createAssignment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { subjectId, classId, title, description, deadline, maxScore } = req.body;
        const file = req.file;

        // Get teacher id from user id
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (!teacher) {
            return res.status(400).json({ error: 'Anda tidak terdaftar sebagai guru' });
        }

        const assignmentData = {
            subject_id: subjectId,
            teacher_id: teacher.id,
            class_id: classId,
            title,
            description,
            deadline,
            max_score: maxScore || 100,
            created_by: req.userId
        };

        if (file) {
            assignmentData.file_url = `/uploads/assignments/${file.filename}`;
            assignmentData.file_type = path.extname(file.originalname).substring(1);
            assignmentData.file_size = file.size;
        }

        const { data: assignment, error } = await supabase
            .from('assignments')
            .insert([assignmentData])
            .select()
            .single();

        if (error) throw error;

        // Notify all students in the class
        const { data: students } = await supabase
            .from('students')
            .select('user_id, parent_id')
            .eq('class_id', classId);

        const notifications = [];
        for (const student of students) {
            notifications.push({
                user_id: student.user_id,
                title: 'Tugas Baru',
                message: `Tugas baru: ${title} - Deadline: ${new Date(deadline).toLocaleDateString('id-ID')}`,
                type: 'assignment_created',
                reference_id: assignment.id
            });

            // Notify parent
            if (student.parent_id) {
                notifications.push({
                    user_id: student.parent_id,
                    title: `Tugas Baru untuk Anak`,
                    message: `Tugas baru: ${title} - Deadline: ${new Date(deadline).toLocaleDateString('id-ID')}`,
                    type: 'assignment_created',
                    reference_id: assignment.id
                });
            }
        }

        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }

        res.status(201).json({
            success: true,
            message: 'Tugas berhasil dibuat',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

const updateAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, deadline, maxScore } = req.body;
        const file = req.file;

        const updateData = {
            title,
            description,
            deadline,
            max_score: maxScore,
            updated_by: req.userId,
            updated_at: new Date()
        };

        if (file) {
            // Get old assignment to delete old file
            const { data: oldAssignment } = await supabase
                .from('assignments')
                .select('file_url')
                .eq('id', id)
                .single();

            if (oldAssignment && oldAssignment.file_url) {
                const oldFilePath = path.join(__dirname, '../../', oldAssignment.file_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            updateData.file_url = `/uploads/assignments/${file.filename}`;
            updateData.file_type = path.extname(file.originalname).substring(1);
            updateData.file_size = file.size;
        }

        const { data: assignment, error } = await supabase
            .from('assignments')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!assignment) {
            return res.status(404).json({ error: 'Tugas tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Tugas berhasil diupdate',
            data: assignment
        });
    } catch (error) {
        next(error);
    }
};

const deleteAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get assignment to delete file
        const { data: assignment } = await supabase
            .from('assignments')
            .select('file_url')
            .eq('id', id)
            .single();

        if (assignment && assignment.file_url) {
            const filePath = path.join(__dirname, '../../', assignment.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete all submissions and their files
        const { data: submissions } = await supabase
            .from('assignment_submissions')
            .select('file_url')
            .eq('assignment_id', id);

        for (const submission of submissions) {
            if (submission.file_url) {
                const filePath = path.join(__dirname, '../../', submission.file_url);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tugas berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

const submitAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { submissionText } = req.body;
        const file = req.file;

        // Get student id from user id
        const { data: student } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (!student) {
            return res.status(400).json({ error: 'Anda tidak terdaftar sebagai siswa' });
        }

        // Check if already submitted
        const { data: existing } = await supabase
            .from('assignment_submissions')
            .select('id, file_url')
            .eq('assignment_id', id)
            .eq('student_id', student.id)
            .single();

        let submission;

        if (existing) {
            // Delete old file if exists
            if (existing.file_url && file) {
                const oldFilePath = path.join(__dirname, '../../', existing.file_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Update existing submission
            const updateData = {
                submission_text: submissionText,
                submitted_at: new Date()
            };

            if (file) {
                updateData.file_url = `/uploads/submissions/${file.filename}`;
            }

            const { data, error } = await supabase
                .from('assignment_submissions')
                .update(updateData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            submission = data;
        } else {
            // Create new submission
            const submissionData = {
                assignment_id: id,
                student_id: student.id,
                submission_text: submissionText
            };

            if (file) {
                submissionData.file_url = `/uploads/submissions/${file.filename}`;
            }

            const { data, error } = await supabase
                .from('assignment_submissions')
                .insert([submissionData])
                .select()
                .single();

            if (error) throw error;
            submission = data;
        }

        // Get assignment and teacher info for notification
        const { data: assignment } = await supabase
            .from('assignments')
            .select('title, teacher_id')
            .eq('id', id)
            .single();

        const { data: teacher } = await supabase
            .from('teachers')
            .select('user_id')
            .eq('id', assignment.teacher_id)
            .single();

        // Get student info
        const { data: studentInfo } = await supabase
            .from('students')
            .select('user:user_id(full_name)')
            .eq('id', student.id)
            .single();

        // Notify teacher
        await createNotification({
            userId: teacher.user_id,
            title: 'Pengumpulan Tugas',
            message: `${studentInfo.user.full_name} mengumpulkan tugas: ${assignment.title}`,
            type: 'assignment_submitted',
            referenceId: submission.id
        });

        res.status(201).json({
            success: true,
            message: 'Tugas berhasil dikumpulkan',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

const gradeSubmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { score, feedback } = req.body;

        const { data: submission, error } = await supabase
            .from('assignment_submissions')
            .update({
                score,
                feedback,
                updated_at: new Date()
            })
            .eq('id', id)
            .select(`
                *,
                assignment:assignment_id(title),
                student:student_id(user_id)
            `)
            .single();

        if (error) throw error;

        // Notify student
        await createNotification({
            userId: submission.student.user_id,
            title: 'Nilai Tugas',
            message: `Tugas ${submission.assignment.title} telah dinilai: ${score}`,
            type: 'assignment_graded',
            referenceId: submission.id
        });

        res.json({
            success: true,
            message: 'Nilai tugas berhasil disimpan',
            data: submission
        });
    } catch (error) {
        next(error);
    }
};

const getStudentAssignments = async (req, res, next) => {
    try {
        // Get student id from user id
        const { data: student } = await supabase
            .from('students')
            .select('id, class_id')
            .eq('user_id', req.userId)
            .single();

        if (!student) {
            return res.status(400).json({ error: 'Data siswa tidak ditemukan' });
        }

        const { data: assignments, error } = await supabase
            .from('assignments')
            .select(`
                *,
                subject:subject_id(name),
                teacher:teacher_id(user:user_id(full_name)),
                submission:assignment_submissions!left(
                    id,
                    file_url,
                    score,
                    feedback,
                    submitted_at
                )
            `)
            .eq('class_id', student.class_id)
            .order('deadline');

        if (error) throw error;

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        next(error);
    }
};

const getTeacherAssignments = async (req, res, next) => {
    try {
        // Get teacher id from user id
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (!teacher) {
            return res.status(400).json({ error: 'Data guru tidak ditemukan' });
        }

        const { data: assignments, error } = await supabase
            .from('assignments')
            .select(`
                *,
                subject:subject_id(name),
                class:class_id(name),
                submissions:assignment_submissions(count)
            `)
            .eq('teacher_id', teacher.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        next(error);
    }
};

const downloadAssignmentFile = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: assignment, error } = await supabase
            .from('assignments')
            .select('file_url, title')
            .eq('id', id)
            .single();

        if (error || !assignment || !assignment.file_url) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        const filePath = path.join(__dirname, '../../', assignment.file_url);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        res.download(filePath, assignment.title + path.extname(filePath));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    gradeSubmission,
    getStudentAssignments,
    getTeacherAssignments,
    downloadAssignmentFile
};