const { supabase } = require('../config/supabase');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const getSchoolSettings = async (req, res, next) => {
    try {
        // Get from settings table (assuming you have one)
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'school_settings')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: settings ? settings.value : {}
        });
    } catch (error) {
        next(error);
    }
};

const updateSchoolSettings = async (req, res, next) => {
    try {
        const settings = req.body;

        const { data, error } = await supabase
            .from('settings')
            .upsert({
                key: 'school_settings',
                value: settings,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Pengaturan sekolah berhasil disimpan',
            data: data.value
        });
    } catch (error) {
        next(error);
    }
};

const getAcademicSettings = async (req, res, next) => {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'academic_settings')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: settings ? settings.value : {}
        });
    } catch (error) {
        next(error);
    }
};

const updateAcademicSettings = async (req, res, next) => {
    try {
        const settings = req.body;

        const { data, error } = await supabase
            .from('settings')
            .upsert({
                key: 'academic_settings',
                value: settings,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Pengaturan akademik berhasil disimpan',
            data: data.value
        });
    } catch (error) {
        next(error);
    }
};

const getNotificationSettings = async (req, res, next) => {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'notification_settings')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: settings ? settings.value : {}
        });
    } catch (error) {
        next(error);
    }
};

const updateNotificationSettings = async (req, res, next) => {
    try {
        const settings = req.body;

        const { data, error } = await supabase
            .from('settings')
            .upsert({
                key: 'notification_settings',
                value: settings,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Pengaturan notifikasi berhasil disimpan',
            data: data.value
        });
    } catch (error) {
        next(error);
    }
};

const getSecuritySettings = async (req, res, next) => {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .eq('key', 'security_settings')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({
            success: true,
            data: settings ? settings.value : {}
        });
    } catch (error) {
        next(error);
    }
};

const updateSecuritySettings = async (req, res, next) => {
    try {
        const settings = req.body;

        const { data, error } = await supabase
            .from('settings')
            .upsert({
                key: 'security_settings',
                value: settings,
                updated_by: req.userId,
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Pengaturan keamanan berhasil disimpan',
            data: data.value
        });
    } catch (error) {
        next(error);
    }
};

const createBackup = async (req, res, next) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, '../../backups', `backup-${timestamp}.sql`);
        
        // Ensure backups directory exists
        if (!fs.existsSync(path.dirname(backupPath))) {
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        }

        // Execute pg_dump
        const { stdout, stderr } = await execPromise(
            `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} > ${backupPath}`
        );

        if (stderr) {
            console.error('Backup stderr:', stderr);
        }

        // Log backup activity
        await supabase.from('backup_logs').insert([{
            filename: `backup-${timestamp}.sql`,
            path: backupPath,
            size: fs.statSync(backupPath).size,
            created_by: req.userId
        }]);

        // Send file
        res.download(backupPath, `backup-${timestamp}.sql`, (err) => {
            if (err) {
                console.error('Error sending backup file:', err);
            }
            // Optionally delete file after sending
            // fs.unlinkSync(backupPath);
        });
    } catch (error) {
        next(error);
    }
};

const restoreBackup = async (req, res, next) => {
    try {
        if (!req.files || !req.files.backup) {
            return res.status(400).json({ error: 'File backup tidak ditemukan' });
        }

        const backupFile = req.files.backup;
        const tempPath = path.join(__dirname, '../../temp', backupFile.name);

        // Ensure temp directory exists
        if (!fs.existsSync(path.dirname(tempPath))) {
            fs.mkdirSync(path.dirname(tempPath), { recursive: true });
        }

        // Save uploaded file
        await backupFile.mv(tempPath);

        // Restore database
        const { stdout, stderr } = await execPromise(
            `PGPASSWORD=${process.env.DB_PASSWORD} psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} < ${tempPath}`
        );

        if (stderr) {
            console.error('Restore stderr:', stderr);
        }

        // Clean up temp file
        fs.unlinkSync(tempPath);

        // Log restore activity
        await supabase.from('restore_logs').insert([{
            filename: backupFile.name,
            restored_by: req.userId,
            restored_at: new Date()
        }]);

        res.json({
            success: true,
            message: 'Database berhasil direstore'
        });
    } catch (error) {
        next(error);
    }
};

const resetSystem = async (req, res, next) => {
    try {
        // Delete all academic data but keep master data
        await supabase.from('grades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('assignment_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Log reset activity
        await supabase.from('system_logs').insert([{
            action: 'system_reset',
            performed_by: req.userId,
            performed_at: new Date()
        }]);

        res.json({
            success: true,
            message: 'Sistem berhasil direset'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSchoolSettings,
    updateSchoolSettings,
    getAcademicSettings,
    updateAcademicSettings,
    getNotificationSettings,
    updateNotificationSettings,
    getSecuritySettings,
    updateSecuritySettings,
    createBackup,
    restoreBackup,
    resetSystem
};