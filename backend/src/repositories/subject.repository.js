const BaseRepository = require('./base.repository');

class SubjectRepository extends BaseRepository {
    constructor() {
        super('subjects');
    }

    async findByCode(code) {
        return this.findOne({ code });
    }

    async findWithSchedules(id) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select(`
                *,
                schedules:schedules(
                    id,
                    class:class_id(name),
                    teacher:teacher_id(user:user_id(full_name)),
                    day_of_week,
                    start_time,
                    end_time
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
}

module.exports = new SubjectRepository();