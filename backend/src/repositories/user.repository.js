const BaseRepository = require('./base.repository');
const { supabase } = require('../config/supabase');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findByEmail(email) {
        return this.findOne({ email });
    }

    async findWithRole(id) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select(`
                *,
                role:roles(name, description)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async findAllWithRole(options = {}) {
        const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', filters = {} } = options;
        const offset = (page - 1) * limit;

        let query = supabase
            .from(this.tableName)
            .select(`
                *,
                role:roles(name, description)
            `, { count: 'exact' });

        // Apply filters
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                query = query.eq(key, filters[key]);
            }
        });

        if (filters.search) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order(orderBy, { ascending: order === 'asc' });

        if (error) throw error;

        // Remove passwords
        data.forEach(user => delete user.password);

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

    async updateLastLogin(id) {
        return this.update(id, { last_login: new Date() });
    }

    async countByRole(roleId) {
        return this.count({ role_id: roleId });
    }

    async findActiveUsers() {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('is_active', true);

        if (error) throw error;
        return data;
    }

    async search(query) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;
        return data;
    }
}

module.exports = new UserRepository();