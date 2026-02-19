const { supabase } = require('../config/supabase');

class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.client = supabase;
    }

    async findAll(options = {}) {
        const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', filters = {} } = options;
        const offset = (page - 1) * limit;

        let query = this.client
            .from(this.tableName)
            .select('*', { count: 'exact' });

        // Apply filters
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                query = query.eq(key, filters[key]);
            }
        });

        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order(orderBy, { ascending: order === 'asc' });

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

    async findById(id, select = '*') {
        const { data, error } = await this.client
            .from(this.tableName)
            .select(select)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async findOne(conditions) {
        let query = this.client.from(this.tableName).select('*');

        Object.keys(conditions).forEach(key => {
            query = query.eq(key, conditions[key]);
        });

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async create(data) {
        const { data: result, error } = await this.client
            .from(this.tableName)
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async update(id, data) {
        const { data: result, error } = await this.client
            .from(this.tableName)
            .update({ ...data, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    async delete(id) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    async count(filters = {}) {
        let query = this.client.from(this.tableName).select('*', { count: 'exact', head: true });

        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });

        const { count, error } = await query;

        if (error) throw error;
        return count;
    }

    async bulkCreate(items) {
        const { data, error } = await this.client
            .from(this.tableName)
            .insert(items)
            .select();

        if (error) throw error;
        return data;
    }

    async bulkUpdate(updates) {
        const results = [];
        for (const { id, ...data } of updates) {
            const result = await this.update(id, data);
            results.push(result);
        }
        return results;
    }

    async bulkDelete(ids) {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .in('id', ids);

        if (error) throw error;
        return true;
    }
}

module.exports = BaseRepository;