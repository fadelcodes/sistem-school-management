const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = util.promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const { supabase } = require('../config/supabase');

class BackupService {
    constructor() {
        this.backupPath = path.join(__dirname, '../../backups');
        this.tempPath = path.join(__dirname, '../../temp');
    }

    async ensureDirectories() {
        await mkdirAsync(this.backupPath, { recursive: true });
        await mkdirAsync(this.tempPath, { recursive: true });
    }

    async createBackup() {
        try {
            await this.ensureDirectories();

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-${timestamp}.sql`;
            const filepath = path.join(this.backupPath, filename);

            // Get database connection details from environment
            const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

            // Use pg_dump to create backup
            const command = `PGPASSWORD="${DB_PASSWORD}" pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} --clean --if-exists > "${filepath}"`;
            
            const { stdout, stderr } = await execAsync(command);

            if (stderr) {
                console.error('pg_dump stderr:', stderr);
            }

            // Get file stats
            const stats = await fs.promises.stat(filepath);

            // Log backup to database
            await supabase.from('backup_logs').insert([{
                filename,
                path: filepath,
                size: stats.size,
                created_at: new Date()
            }]);

            return {
                success: true,
                filename,
                path: filepath,
                size: stats.size,
                message: 'Backup created successfully'
            };
        } catch (error) {
            console.error('Error creating backup:', error);
            throw new Error(`Gagal membuat backup: ${error.message}`);
        }
    }

    async restoreBackup(filepath) {
        try {
            if (!fs.existsSync(filepath)) {
                throw new Error('File backup tidak ditemukan');
            }

            // Get database connection details
            const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;

            // Use psql to restore backup
            const command = `PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${filepath}"`;
            
            const { stdout, stderr } = await execAsync(command);

            if (stderr) {
                console.error('psql stderr:', stderr);
            }

            // Log restore to database
            await supabase.from('restore_logs').insert([{
                filename: path.basename(filepath),
                restored_at: new Date()
            }]);

            return {
                success: true,
                message: 'Database restored successfully'
            };
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw new Error(`Gagal merestore backup: ${error.message}`);
        }
    }

    async listBackups() {
        try {
            await this.ensureDirectories();

            const files = await fs.promises.readdir(this.backupPath);
            const backups = [];

            for (const file of files) {
                if (file.endsWith('.sql')) {
                    const filepath = path.join(this.backupPath, file);
                    const stats = await fs.promises.stat(filepath);
                    
                    backups.push({
                        filename: file,
                        size: stats.size,
                        created: stats.birthtime,
                        path: filepath
                    });
                }
            }

            // Sort by creation date descending
            backups.sort((a, b) => b.created - a.created);

            return backups;
        } catch (error) {
            console.error('Error listing backups:', error);
            throw error;
        }
    }

    async deleteBackup(filename) {
        try {
            const filepath = path.join(this.backupPath, filename);
            
            if (!fs.existsSync(filepath)) {
                throw new Error('File backup tidak ditemukan');
            }

            await unlinkAsync(filepath);

            return {
                success: true,
                message: 'Backup deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw error;
        }
    }

    async cleanupOldBackups(maxBackups = 10) {
        try {
            const backups = await this.listBackups();
            
            if (backups.length <= maxBackups) {
                return { deleted: 0 };
            }

            // Keep only the newest backups
            const toDelete = backups.slice(maxBackups);
            
            for (const backup of toDelete) {
                await this.deleteBackup(backup.filename);
            }

            return {
                deleted: toDelete.length,
                kept: maxBackups
            };
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
            throw error;
        }
    }

    async scheduleBackup(frequency, time) {
        // This would integrate with a job scheduler like node-cron
        // For now, we'll just log the schedule
        console.log(`Backup scheduled: ${frequency} at ${time}`);
        
        // Save schedule to database
        await supabase.from('backup_schedules').upsert([{
            frequency,
            time,
            updated_at: new Date()
        }]);

        return {
            success: true,
            message: 'Backup scheduled successfully'
        };
    }

    async exportData(tables = []) {
        try {
            const exportData = {};

            // If no tables specified, export all tables
            if (tables.length === 0) {
                tables = [
                    'roles', 'users', 'students', 'teachers', 'classes',
                    'subjects', 'jurusan', 'academic_years', 'schedules',
                    'attendance', 'grades', 'materials', 'assignments',
                    'assignment_submissions', 'notifications'
                ];
            }

            for (const table of tables) {
                const { data, error } = await supabase
                    .from(table)
                    .select('*');

                if (error) {
                    console.error(`Error exporting table ${table}:`, error);
                    continue;
                }

                exportData[table] = data;
            }

            const filename = `export-${Date.now()}.json`;
            const filepath = path.join(this.tempPath, filename);
            
            await writeFileAsync(filepath, JSON.stringify(exportData, null, 2));

            return {
                filename,
                path: filepath,
                data: exportData
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    async importData(filepath) {
        try {
            const data = JSON.parse(await readFileAsync(filepath, 'utf8'));

            for (const [table, rows] of Object.entries(data)) {
                if (rows.length > 0) {
                    const { error } = await supabase
                        .from(table)
                        .upsert(rows);

                    if (error) {
                        console.error(`Error importing table ${table}:`, error);
                    }
                }
            }

            return {
                success: true,
                message: 'Data imported successfully',
                tables: Object.keys(data)
            };
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    async getBackupInfo() {
        try {
            const backups = await this.listBackups();
            
            // Get latest backup
            const latestBackup = backups.length > 0 ? backups[0] : null;
            
            // Get total size
            const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
            
            // Get backup logs from database
            const { data: logs } = await supabase
                .from('backup_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            return {
                totalBackups: backups.length,
                totalSize,
                latestBackup,
                last7Days: backups.filter(b => {
                    const days = (Date.now() - b.created) / (1000 * 60 * 60 * 24);
                    return days <= 7;
                }).length,
                logs: logs || []
            };
        } catch (error) {
            console.error('Error getting backup info:', error);
            throw error;
        }
    }
}

module.exports = new BackupService();