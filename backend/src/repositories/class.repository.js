const BaseRepository = require('./base.repository');
const { supabase } = require('../config/supabase');

class ClassRepository extends BaseRepository {
    constructor() {
        super('classes');
    }

    async findAllWithDetails(options = {}) {
        const { page = 1, limit = 10, academicYearId } = options;
        const offset = (page - 1) * limit;

        let query = supabase
            .from(this.tableName)
            .select(`
                *,
                jurusan:jurusan_id(name, code),
                academic_year:academic_year_id(year, semester),
                homeroom_teacher:homeroom_teacher_id(
                    user:user_id(full_name)
                ),
                students:students(count)
            `, { count: 'exact' });

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('grade_level')
            .order('name');

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
                jurusan:jurusan_id(*),
                academic_year:academic_year_id(*),
                homeroom_teacher:homeroom_teacher_id(
                    *,
                    user:user_id(*)
                ),
                students:students(
                    *,
                    user:user_id(full_name, email)
                ),
                schedules:schedules(
                    *,
                    subject:subject_id(name),
                    teacher:teacher_id(user:user_id(full_name))
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async findByAcademicYear(academicYearId) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('academic_year_id', academicYearId)
            .order('name');

        if (error) throw error;
        return data;
    }

    async findByHomeroomTeacher(teacherId) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('homeroom_teacher_id', teacherId);

        if (error) throw error;
        return data;
    }

    async getClassStatistics(classId) {
        const { count: totalStudents } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId);

        const { count: totalSchedules } = await supabase
            .from('schedules')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId);

        // Get average grades per subject
        const { data: grades } = await supabase
            .from('grades')
            .select(`
                score,
                subject:subject_id(name)
            `)
            .eq('student.class_id', classId);

        const subjectAverages = {};
        grades?.forEach(grade => {
            if (!subjectAverages[grade.subject.name]) {
                subjectAverages[grade.subject.name] = { total: 0, count: 0 };
            }
            subjectAverages[grade.subject.name].total += grade.score;
            subjectAverages[grade.subject.name].count++;
        });

        Object.keys(subjectAverages).forEach(subject => {
            subjectAverages[subject] = (subjectAverages[subject].total / subjectAverages[subject].count).toFixed(2);
        });

        return {
            totalStudents: totalStudents || 0,
            totalSchedules: totalSchedules || 0,
            subjectAverages
        };
    }

    async getAvailableClasses(academicYearId) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select(`
                id,
                name,
                grade_level,
                capacity,
                students:students(count)
            `)
            .eq('academic_year_id', academicYearId)
            .lt('students.count', supabase.raw('capacity'));

        if (error) throw error;
        return data;
    }
}

module.exports = new ClassRepository();