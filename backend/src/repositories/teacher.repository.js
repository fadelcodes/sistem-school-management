const BaseRepository = require('./base.repository');
const { supabase } = require('../config/supabase');

class TeacherRepository extends BaseRepository {
    constructor() {
        super('teachers');
    }

    async findByNip(nip) {
        return this.findOne({ nip });
    }

    async findByUserId(userId) {
        return this.findOne({ user_id: userId });
    }

    async findAllWithDetails(options = {}) {
        const { page = 1, limit = 10, search } = options;
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
                )
            `, { count: 'exact' });

        if (search) {
            query = query.or(`nip.ilike.%${search}%,user.full_name.ilike.%${search}%`);
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

        if (error) throw error;
        return data;
    }

    async getTeacherSchedule(teacherId) {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
                *,
                subject:subject_id(name),
                class:class_id(name)
            `)
            .eq('teacher_id', teacherId)
            .order('day_of_week')
            .order('start_time');

        if (error) throw error;
        return data;
    }

    async getTeacherStatistics(teacherId) {
        const { count: totalSchedules } = await supabase
            .from('schedules')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        const { count: totalAssignments } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        const { count: totalGrades } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('teacher_id', teacherId);

        return {
            totalSchedules: totalSchedules || 0,
            totalAssignments: totalAssignments || 0,
            totalGrades: totalGrades || 0
        };
    }

    async findHomeroomTeachers() {
        const { data, error } = await supabase
            .from(this.tableName)
            .select(`
                *,
                user:user_id(full_name),
                homeroom_class:classes!homeroom_teacher_id(name)
            `)
            .not('homeroom_class', 'is', null);

        if (error) throw error;
        return data;
    }
}

module.exports = new TeacherRepository();