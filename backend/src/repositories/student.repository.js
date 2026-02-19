const BaseRepository = require('./base.repository');
const { supabase } = require('../config/supabase');

class StudentRepository extends BaseRepository {
    constructor() {
        super('students');
    }

    async findByNis(nis) {
        return this.findOne({ nis });
    }

    async findByUserId(userId) {
        return this.findOne({ user_id: userId });
    }

    async findAllWithDetails(options = {}) {
        const { page = 1, limit = 10, classId, search } = options;
        const offset = (page - 1) * limit;

        let query = supabase
            .from(this.tableName)
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

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            data,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        };
    }

    async findByIdWithDetails(id) {
        const { data, error } = await supabase
            .from(this.tableName)
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

        if (error) throw error;
        return data;
    }

    async findByClass(classId) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select(`
                *,
                user:user_id(full_name, email)
            `)
            .eq('class_id', classId)
            .order('user(full_name)');

        if (error) throw error;
        return data;
    }

    async findByParent(parentId) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select(`
                *,
                user:user_id(full_name, email),
                class:class_id(name)
            `)
            .eq('parent_id', parentId);

        if (error) throw error;
        return data;
    }

    async getStudentStatistics(studentId) {
        const { data: grades } = await supabase
            .from('grades')
            .select('score, grade_type')
            .eq('student_id', studentId);

        const { data: attendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', studentId);

        const average = grades?.length > 0
            ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
            : 0;

        const attendanceRate = attendance?.length > 0
            ? (attendance.filter(a => a.status === 'Hadir').length / attendance.length) * 100
            : 0;

        return {
            totalGrades: grades?.length || 0,
            averageGrade: average.toFixed(2),
            totalAttendance: attendance?.length || 0,
            attendanceRate: attendanceRate.toFixed(1),
            gradeDistribution: {
                tugas: grades?.filter(g => g.grade_type === 'Tugas').length || 0,
                uts: grades?.filter(g => g.grade_type === 'UTS').length || 0,
                uas: grades?.filter(g => g.grade_type === 'UAS').length || 0,
                praktikum: grades?.filter(g => g.grade_type === 'Praktikum').length || 0
            }
        };
    }
}

module.exports = new StudentRepository();