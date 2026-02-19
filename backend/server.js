const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import database configuration
const { supabase } = require('./src/config/supabase');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const roleRoutes = require('./src/routes/role.routes');
const studentRoutes = require('./src/routes/student.routes');
const teacherRoutes = require('./src/routes/teacher.routes');
const classRoutes = require('./src/routes/class.routes');
const subjectRoutes = require('./src/routes/subject.routes');
const scheduleRoutes = require('./src/routes/schedule.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const gradeRoutes = require('./src/routes/grade.routes');
const materialRoutes = require('./src/routes/material.routes');
const assignmentRoutes = require('./src/routes/assignment.routes');
const academicYearRoutes = require('./src/routes/academicYear.routes');
const jurusanRoutes = require('./src/routes/jurusan.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const reportRoutes = require('./src/routes/report.routes');
const bootstrapRoutes = require('./src/routes/bootstrap.routes');
const settingRoutes = require('./src/routes/setting.routes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { authenticate } = require('./src/middleware/auth');

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use(morgan('dev'));

// Request logging untuk debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, 'uploads');
const uploadSubDirs = ['profiles', 'materials', 'assignments', 'submissions', 'temp'];

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

uploadSubDirs.forEach(dir => {
    const dirPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Static files untuk uploads
app.use('/uploads', express.static('uploads'));

// ==================== TEST ROUTES ====================

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Sekolah API Server',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Simple test endpoint
app.get('/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running properly',
        timestamp: new Date().toISOString()
    });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        name: 'Sekolah API',
        version: '1.0.0',
        description: 'Backend API untuk Sistem Informasi Sekolah',
        endpoints: [
            { path: '/api/auth', methods: ['POST', 'GET'], description: 'Authentication endpoints' },
            { path: '/api/classes', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Class management' },
            { path: '/api/students', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Student management' },
            { path: '/api/teachers', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Teacher management' },
            { path: '/api/subjects', methods: ['GET', 'POST', 'PUT', 'DELETE'], description: 'Subject management' }
        ]
    });
});

// ==================== API ROUTES ====================

// Public routes (no authentication required)
app.use('/api/bootstrap', bootstrapRoutes);
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/users', authenticate, userRoutes);
app.use('/api/roles', authenticate, roleRoutes);
app.use('/api/students', authenticate, studentRoutes);
app.use('/api/teachers', authenticate, teacherRoutes);
app.use('/api/classes', authenticate, classRoutes);
app.use('/api/subjects', authenticate, subjectRoutes);
app.use('/api/schedules', authenticate, scheduleRoutes);
app.use('/api/attendance', authenticate, attendanceRoutes);
app.use('/api/grades', authenticate, gradeRoutes);
app.use('/api/materials', authenticate, materialRoutes);
app.use('/api/assignments', authenticate, assignmentRoutes);
app.use('/api/academic-years', authenticate, academicYearRoutes);
app.use('/api/jurusan', authenticate, jurusanRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/settings', authenticate, settingRoutes);

// ==================== 404 HANDLER ====================

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint tidak ditemukan',
        path: req.originalUrl,
        method: req.method
    });
});

// ==================== GLOBAL ERROR HANDLER ====================

app.use(errorHandler);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SEKOLAH BACKEND SERVER');
    console.log('='.repeat(50));
    console.log(`✅ Port: ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test: http://localhost:${PORT}/test`);
    console.log('='.repeat(50) + '\n');
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

module.exports = app;