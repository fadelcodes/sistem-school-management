const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notification');

const getGrades = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, studentId, subjectId, classId } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('grades')
            .select(`
                *,
                student:student_id(
                    nis,
                    user:user_id(full_name),
                    class:class_id(name)
                ),
                subject:subject_id(name, code),
                teacher:teacher_id(user:user_id(full_name)),
                academic_year:academic_year_id(year, semester)
            `, { count: 'exact' });

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        if (classId) {
            query = query.eq('student.class_id', classId);
        }

        const { data: grades, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: grades,
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

const getGradeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: grade, error } = await supabase
            .from('grades')
            .select(`
                *,
                student:student_id(*),
                subject:subject_id(*),
                teacher:teacher_id(*),
                academic_year:academic_year_id(*)
            `)
            .eq('id', id)
            .single();

        if (error || !grade) {
            return res.status(404).json({ error: 'Data nilai tidak ditemukan' });
        }

        res.json({
            success: true,
            data: grade
        });
    } catch (error) {
        next(error);
    }
};

const createGrade = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { studentId, subjectId, teacherId, academicYearId, gradeType, score, description, date } = req.body;

        const { data: grade, error } = await supabase
            .from('grades')
            .insert([{
                student_id: studentId,
                subject_id: subjectId,
                teacher_id: teacherId,
                academic_year_id: academicYearId,
                grade_type: gradeType,
                score,
                description,
                date: date || new Date(),
                created_by: req.userId
            }])
            .select()
            .single();

        if (error) throw error;

        // Get student and parent info
        const { data: student } = await supabase
            .from('students')
            .select('parent_id, user_id, user:user_id(full_name)')
            .eq('id', studentId)
            .single();

        // Get subject info
        const { data: subject } = await supabase
            .from('subjects')
            .select('name')
            .eq('id', subjectId)
            .single();

        // Notify student
        if (student) {
            await createNotification({
                userId: student.user_id,
                title: 'Nilai Baru',
                message: `Nilai ${gradeType} ${subject.name}: ${score}`,
                type: 'grade_input',
                referenceId: grade.id
            });
        }

        // Notify parent
        if (student && student.parent_id) {
            await createNotification({
                userId: student.parent_id,
                title: `Nilai ${student.user.full_name}`,
                message: `Nilai ${gradeType} ${subject.name}: ${score}`,
                type: 'grade_input',
                referenceId: grade.id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Nilai berhasil dicatat',
            data: grade
        });
    } catch (error) {
        next(error);
    }
};

const createBulkGrades = async (req, res, next) => {
    try {
        const { grades } = req.body;

        if (!Array.isArray(grades) || grades.length === 0) {
            return res.status(400).json({ error: 'Data nilai tidak valid' });
        }

        const results = [];

        for (const item of grades) {
            const { studentId, subjectId, teacherId, academicYearId, gradeType, score, description } = item;

            const { data } = await supabase
                .from('grades')
                .insert([{
                    student_id: studentId,
                    subject_id: subjectId,
                    teacher_id: teacherId,
                    academic_year_id: academicYearId,
                    grade_type: gradeType,
                    score,
                    description,
                    created_by: req.userId
                }])
                .select()
                .single();

            results.push(data);
        }

        res.status(201).json({
            success: true,
            message: `Berhasil menambahkan ${results.length} data nilai`,
            data: results
        });
    } catch (error) {
        next(error);
    }
};

const updateGrade = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { score, description } = req.body;

        const { data: grade, error } = await supabase
            .from('grades')
            .update({
                score,
                description,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!grade) {
            return res.status(404).json({ error: 'Data nilai tidak ditemukan' });
        }

        res.json({
            success: true,
            message: 'Nilai berhasil diupdate',
            data: grade
        });
    } catch (error) {
        next(error);
    }
};

const deleteGrade = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('grades')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Data nilai berhasil dihapus'
        });
    } catch (error) {
        next(error);
    }
};

const getStudentGradeReport = async (req, res, next) => {
    try {
        const studentId = req.params.studentId;

        const { data: grades, error } = await supabase
            .from('grades')
            .select(`
                *,
                subject:subject_id(name),
                teacher:teacher_id(user:user_id(full_name)),
                academic_year:academic_year_id(year, semester)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate average per subject
        const subjectAverages = grades.reduce((acc, curr) => {
            const subjectId = curr.subject_id;
            if (!acc[subjectId]) {
                acc[subjectId] = {
                    subject: curr.subject.name,
                    total: 0,
                    count: 0,
                    grades: []
                };
            }
            acc[subjectId].total += curr.score;
            acc[subjectId].count++;
            acc[subjectId].grades.push({
                type: curr.grade_type,
                score: curr.score,
                date: curr.date
            });
            return acc;
        }, {});

        Object.keys(subjectAverages).forEach(key => {
            subjectAverages[key].average = (subjectAverages[key].total / subjectAverages[key].count).toFixed(2);
        });

        // Overall average
        const overallAverage = grades.length > 0 
            ? (grades.reduce((sum, curr) => sum + curr.score, 0) / grades.length).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                grades,
                subjectAverages: Object.values(subjectAverages),
                overallAverage,
                totalGrades: grades.length
            }
        });
    } catch (error) {
        next(error);
    }
};

const getClassGradeReport = async (req, res, next) => {
    try {
        const classId = req.params.classId;
        const { subjectId, academicYearId } = req.query;

        let query = supabase
            .from('grades')
            .select(`
                *,
                student:student_id(
                    id,
                    nis,
                    user:user_id(full_name)
                ),
                subject:subject_id(name)
            `)
            .eq('student.class_id', classId);

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        const { data: grades, error } = await query;

        if (error) throw error;

        // Group by student
        const report = grades.reduce((acc, curr) => {
            const studentId = curr.student.id;
            if (!acc[studentId]) {
                acc[studentId] = {
                    student: curr.student,
                    subjects: {},
                    total: 0,
                    count: 0
                };
            }

            if (!acc[studentId].subjects[curr.subject_id]) {
                acc[studentId].subjects[curr.subject_id] = {
                    subject: curr.subject.name,
                    total: 0,
                    count: 0
                };
            }

            acc[studentId].subjects[curr.subject_id].total += curr.score;
            acc[studentId].subjects[curr.subject_id].count++;
            acc[studentId].total += curr.score;
            acc[studentId].count++;

            return acc;
        }, {});

        // Calculate averages
        Object.values(report).forEach(student => {
            student.average = (student.total / student.count).toFixed(2);
            Object.values(student.subjects).forEach(subject => {
                subject.average = (subject.total / subject.count).toFixed(2);
            });
        });

        res.json({
            success: true,
            data: Object.values(report)
        });
    } catch (error) {
        next(error);
    }
};

const getSubjectGradeReport = async (req, res, next) => {
    try {
        const subjectId = req.params.subjectId;
        const { classId, academicYearId } = req.query;

        let query = supabase
            .from('grades')
            .select(`
                *,
                student:student_id(
                    id,
                    nis,
                    user:user_id(full_name),
                    class:class_id(name)
                )
            `)
            .eq('subject_id', subjectId);

        if (classId) {
            query = query.eq('student.class_id', classId);
        }

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        const { data: grades, error } = await query;

        if (error) throw error;

        const statistics = {
            total: grades.length,
            average: grades.length > 0 
                ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
                : 0,
            highest: grades.length > 0 ? Math.max(...grades.map(g => g.score)) : 0,
            lowest: grades.length > 0 ? Math.min(...grades.map(g => g.score)) : 0,
            byClass: {}
        };

        // Group by class
        grades.forEach(grade => {
            const className = grade.student.class?.name || 'Unknown';
            if (!statistics.byClass[className]) {
                statistics.byClass[className] = {
                    total: 0,
                    sum: 0,
                    students: []
                };
            }
            statistics.byClass[className].total++;
            statistics.byClass[className].sum += grade.score;
            statistics.byClass[className].students.push({
                student: grade.student.user.full_name,
                nis: grade.student.nis,
                score: grade.score
            });
        });

        // Calculate averages per class
        Object.keys(statistics.byClass).forEach(key => {
            statistics.byClass[key].average = (statistics.byClass[key].sum / statistics.byClass[key].total).toFixed(2);
        });

        res.json({
            success: true,
            data: {
                statistics,
                grades
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGrades,
    getGradeById,
    createGrade,
    createBulkGrades,
    updateGrade,
    deleteGrade,
    getStudentGradeReport,
    getClassGradeReport,
    getSubjectGradeReport
};