const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

class FileService {
    constructor() {
        this.baseUploadPath = path.join(__dirname, '../../uploads');
        this.allowedMimeTypes = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'application/pdf': '.pdf',
            'application/msword': '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
            'application/vnd.ms-excel': '.xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
            'application/vnd.ms-powerpoint': '.ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx'
        };
    }

    async ensureDirectoryExists(dirPath) {
        try {
            await mkdirAsync(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error('Error creating directory:', error);
            throw error;
        }
    }

    getFileExtension(mimeType) {
        return this.allowedMimeTypes[mimeType] || null;
    }

    isValidFileType(mimeType) {
        return !!this.allowedMimeTypes[mimeType];
    }

    generateFileName(originalName, mimeType) {
        const ext = this.getFileExtension(mimeType) || path.extname(originalName);
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        return `file-${timestamp}-${random}${ext}`;
    }

    getUploadPath(type, userId) {
        const paths = {
            profile: `profiles/${userId}`,
            material: 'materials',
            assignment: 'assignments',
            submission: 'submissions',
            temp: 'temp'
        };
        return path.join(this.baseUploadPath, paths[type] || 'others');
    }

    async saveFile(file, type, userId = null) {
        try {
            if (!file) {
                throw new Error('File tidak ditemukan');
            }

            if (!this.isValidFileType(file.mimetype)) {
                throw new Error('Tipe file tidak didukung');
            }

            const uploadPath = this.getUploadPath(type, userId);
            await this.ensureDirectoryExists(uploadPath);

            const fileName = this.generateFileName(file.name, file.mimetype);
            const filePath = path.join(uploadPath, fileName);

            // Move file from temp to destination
            await file.mv(filePath);

            // Return relative path for database storage
            const relativePath = path.relative(this.baseUploadPath, filePath).replace(/\\/g, '/');
            
            return {
                fileName,
                filePath: relativePath,
                fullPath: filePath,
                size: file.size,
                mimeType: file.mimetype,
                url: `/uploads/${relativePath}`
            };
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    }

    async saveMultipleFiles(files, type, userId = null) {
        const savedFiles = [];
        for (const file of files) {
            const saved = await this.saveFile(file, type, userId);
            savedFiles.push(saved);
        }
        return savedFiles;
    }

    async deleteFile(filePath) {
        try {
            const fullPath = path.join(this.baseUploadPath, filePath);
            if (fs.existsSync(fullPath)) {
                await unlinkAsync(fullPath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async deleteMultipleFiles(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            const result = await this.deleteFile(filePath);
            results.push(result);
        }
        return results;
    }

    async getFileInfo(filePath) {
        try {
            const fullPath = path.join(this.baseUploadPath, filePath);
            const stats = await fs.promises.stat(fullPath);
            
            return {
                exists: true,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isFile: stats.isFile(),
                extension: path.extname(fullPath)
            };
        } catch (error) {
            return { exists: false };
        }
    }

    async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        try {
            const tempPath = path.join(this.baseUploadPath, 'temp');
            if (!fs.existsSync(tempPath)) return;

            const files = await fs.promises.readdir(tempPath);
            const now = Date.now();

            for (const file of files) {
                const filePath = path.join(tempPath, file);
                const stats = await fs.promises.stat(filePath);
                const fileAge = now - stats.mtimeMs;

                if (fileAge > maxAge) {
                    await unlinkAsync(filePath);
                    console.log(`Deleted temp file: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning temp files:', error);
        }
    }

    validateFileSize(file, maxSize = 10 * 1024 * 1024) { // 10MB default
        return file.size <= maxSize;
    }

    getFileSizeLimitMessage(limit = 10) {
        return `Ukuran file maksimal ${limit}MB`;
    }

    async createReadStream(filePath) {
        try {
            const fullPath = path.join(this.baseUploadPath, filePath);
            if (!fs.existsSync(fullPath)) {
                throw new Error('File tidak ditemukan');
            }
            return fs.createReadStream(fullPath);
        } catch (error) {
            console.error('Error creating read stream:', error);
            throw error;
        }
    }
}

module.exports = new FileService();