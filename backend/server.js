const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import database configuration
const supabase = require('./src/config/supabase');

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

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.' }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
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
app.use('/api/bootstrap', bootstrapRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server berjalan di port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

module.exports = app;