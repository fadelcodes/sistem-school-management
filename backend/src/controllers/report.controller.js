const { supabase } = require('../config/supabase');

const getGradeReport = async (req, res, next) => {
    try {
        const { classId, subjectId, academicYearId, semester, studentId } = req.query;

        let query = supabase
            .from('grades')
            .select(`
                *,
                student:student_id(
                    id,
                    nis,
                    user:user_id(full_name),
                    class:class_id(name)
                ),
                subject:subject_id(id, name, code),
                teacher:teacher_id(user:user_id(full_name)),
                academic_year:academic_year_id(year, semester)
            `);

        if (classId) {
            query = query.eq('student.class_id', classId);
        }

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        if (semester) {
            query = query.eq('academic_year.semester', semester);
        }

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        const { data: grades, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Process data for report
        const report = {
            summary: {
                totalGrades: grades.length,
                averageScore: grades.length > 0 
                    ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
                    : 0,
                highestScore: grades.length > 0 
                    ? Math.max(...grades.map(g => g.score))
                    : 0,
                lowestScore: grades.length > 0 
                    ? Math.min(...grades.map(g => g.score))
                    : 0
            },
            bySubject: {},
            byStudent: {},
            byGradeType: {
                Tugas: { count: 0, total: 0, average: 0 },
                UTS: { count: 0, total: 0, average: 0 },
                UAS: { count: 0, total: 0, average: 0 },
                Praktikum: { count: 0, total: 0, average: 0 }
            },
            details: grades
        };

        // Group by subject
        grades.forEach(grade => {
            const subjectId = grade.subject_id;
            if (!report.bySubject[subjectId]) {
                report.bySubject[subjectId] = {
                    subject: grade.subject.name,
                    count: 0,
                    total: 0,
                    grades: []
                };
            }
            report.bySubject[subjectId].count++;
            report.bySubject[subjectId].total += grade.score;
            report.bySubject[subjectId].grades.push(grade);
        });

        // Calculate subject averages
        Object.keys(report.bySubject).forEach(key => {
            report.bySubject[key].average = 
                (report.bySubject[key].total / report.bySubject[key].count).toFixed(2);
        });

        // Group by student
        grades.forEach(grade => {
            const studentId = grade.student_id;
            if (!report.byStudent[studentId]) {
                report.byStudent[studentId] = {
                    student: grade.student.user.full_name,
                    nis: grade.student.nis,
                    class: grade.student.class?.name,
                    count: 0,
                    total: 0,
                    bySubject: {}
                };
            }
            report.byStudent[studentId].count++;
            report.byStudent[studentId].total += grade.score;

            // Group by subject per student
            const subjId = grade.subject_id;
            if (!report.byStudent[studentId].bySubject[subjId]) {
                report.byStudent[studentId].bySubject[subjId] = {
                    subject: grade.subject.name,
                    count: 0,
                    total: 0
                };
            }
            report.byStudent[studentId].bySubject[subjId].count++;
            report.byStudent[studentId].bySubject[subjId].total += grade.score;
        });

        // Calculate student averages
        Object.keys(report.byStudent).forEach(key => {
            report.byStudent[key].average = 
                (report.byStudent[key].total / report.byStudent[key].count).toFixed(2);
            
            // Calculate subject averages per student
            Object.keys(report.byStudent[key].bySubject).forEach(subjKey => {
                report.byStudent[key].bySubject[subjKey].average = 
                    (report.byStudent[key].bySubject[subjKey].total / 
                     report.byStudent[key].bySubject[subjKey].count).toFixed(2);
            });
        });

        // Calculate grade type averages
        grades.forEach(grade => {
            report.byGradeType[grade.grade_type].count++;
            report.byGradeType[grade.grade_type].total += grade.score;
        });

        Object.keys(report.byGradeType).forEach(key => {
            if (report.byGradeType[key].count > 0) {
                report.byGradeType[key].average = 
                    (report.byGradeType[key].total / report.byGradeType[key].count).toFixed(2);
            }
        });

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const getAttendanceReport = async (req, res, next) => {
    try {
        const { classId, startDate, endDate, studentId, month } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = { gte: startDate, lte: endDate };
        } else if (month) {
            const year = new Date().getFullYear();
            const start = `${year}-${month}-01`;
            const end = new Date(year, month, 0).toISOString().split('T')[0];
            dateFilter = { gte: start, lte: end };
        }

        let query = supabase
            .from('attendance')
            .select(`
                *,
                student:student_id(
                    id,
                    nis,
                    user:user_id(full_name),
                    class:class_id(name)
                ),
                schedule:schedule_id(
                    subject:subject_id(name),
                    day_of_week,
                    start_time
                )
            `);

        if (classId) {
            query = query.eq('student.class_id', classId);
        }

        if (studentId) {
            query = query.eq('student_id', studentId);
        }

        if (startDate && endDate) {
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: attendance, error } = await query.order('date');

        if (error) throw error;

        // Process report
        const report = {
            summary: {
                totalRecords: attendance.length,
                totalStudents: new Set(attendance.map(a => a.student_id)).size,
                dateRange: { start: startDate, end: endDate }
            },
            byStatus: {
                Hadir: { count: 0, students: new Set() },
                Sakit: { count: 0, students: new Set() },
                Izin: { count: 0, students: new Set() },
                Alpha: { count: 0, students: new Set() },
                Terlambat: { count: 0, students: new Set() }
            },
            byStudent: {},
            byDate: {},
            details: attendance
        };

        attendance.forEach(record => {
            // Count by status
            report.byStatus[record.status].count++;
            report.byStatus[record.status].students.add(record.student_id);

            // Group by student
            const studentId = record.student_id;
            if (!report.byStudent[studentId]) {
                report.byStudent[studentId] = {
                    student: record.student.user.full_name,
                    nis: record.student.nis,
                    class: record.student.class?.name,
                    total: 0,
                    Hadir: 0,
                    Sakit: 0,
                    Izin: 0,
                    Alpha: 0,
                    Terlambat: 0,
                    details: []
                };
            }
            report.byStudent[studentId].total++;
            report.byStudent[studentId][record.status]++;
            report.byStudent[studentId].details.push({
                date: record.date,
                status: record.status,
                subject: record.schedule?.subject?.name,
                notes: record.notes
            });

            // Group by date
            const date = record.date;
            if (!report.byDate[date]) {
                report.byDate[date] = {
                    date,
                    total: 0,
                    Hadir: 0,
                    Sakit: 0,
                    Izin: 0,
                    Alpha: 0,
                    Terlambat: 0
                };
            }
            report.byDate[date].total++;
            report.byDate[date][record.status]++;
        });

        // Convert Sets to counts
        Object.keys(report.byStatus).forEach(key => {
            report.byStatus[key].studentCount = report.byStatus[key].students.size;
            delete report.byStatus[key].students;
        });

        // Calculate percentages for students
        Object.keys(report.byStudent).forEach(key => {
            const student = report.byStudent[key];
            student.attendancePercentage = ((student.Hadir / student.total) * 100).toFixed(1);
            student.absentPercentage = (((student.Sakit + student.Izin + student.Alpha) / student.total) * 100).toFixed(1);
        });

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const getTeacherPerformanceReport = async (req, res, next) => {
    try {
        const { academicYearId, semester } = req.query;

        let query = supabase
            .from('teachers')
            .select(`
                id,
                nip,
                user:user_id(full_name, email),
                specialization,
                schedules:schedules(
                    id,
                    subject:subject_id(name),
                    class:class_id(name),
                    attendance:attendance(count)
                ),
                assignments:assignments(
                    id,
                    title,
                    submissions:assignment_submissions(count)
                )
            `);

        const { data: teachers, error } = await query;

        if (error) throw error;

        const report = teachers.map(teacher => {
            const totalSchedules = teacher.schedules?.length || 0;
            const totalClasses = new Set(teacher.schedules?.map(s => s.class?.name)).size;
            const totalSubjects = new Set(teacher.schedules?.map(s => s.subject?.name)).size;
            const totalAssignments = teacher.assignments?.length || 0;
            const totalSubmissions = teacher.assignments?.reduce(
                (sum, a) => sum + (a.submissions?.[0]?.count || 0), 0
            ) || 0;

            return {
                id: teacher.id,
                name: teacher.user.full_name,
                nip: teacher.nip,
                email: teacher.user.email,
                specialization: teacher.specialization,
                metrics: {
                    totalSchedules,
                    totalClasses,
                    totalSubjects,
                    totalAssignments,
                    totalSubmissions,
                    averageSubmissionsPerAssignment: totalAssignments > 0 
                        ? (totalSubmissions / totalAssignments).toFixed(1)
                        : 0
                }
            };
        });

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const getClassPerformanceReport = async (req, res, next) => {
    try {
        const { academicYearId, semester } = req.query;

        let query = supabase
            .from('classes')
            .select(`
                id,
                name,
                grade_level,
                jurusan:jurusan_id(name),
                homeroom_teacher:homeroom_teacher_id(user:user_id(full_name)),
                students:students(
                    id,
                    nis,
                    user:user_id(full_name),
                    grades:grades(score),
                    attendance:attendance(status)
                ),
                schedules:schedules(
                    id,
                    subject:subject_id(name)
                )
            `);

        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId);
        }

        const { data: classes, error } = await query;

        if (error) throw error;

        const report = classes.map(cls => {
            const totalStudents = cls.students?.length || 0;
            
            // Calculate average grade per class
            let totalGradeSum = 0;
            let totalGradeCount = 0;
            cls.students?.forEach(student => {
                student.grades?.forEach(grade => {
                    totalGradeSum += grade.score;
                    totalGradeCount++;
                });
            });
            const averageGrade = totalGradeCount > 0 
                ? (totalGradeSum / totalGradeCount).toFixed(2)
                : 0;

            // Calculate attendance rate
            let totalAttendance = 0;
            let totalPresent = 0;
            cls.students?.forEach(student => {
                student.attendance?.forEach(att => {
                    totalAttendance++;
                    if (att.status === 'Hadir') totalPresent++;
                });
            });
            const attendanceRate = totalAttendance > 0 
                ? ((totalPresent / totalAttendance) * 100).toFixed(1)
                : 0;

            // Get subject list
            const subjects = [...new Set(cls.schedules?.map(s => s.subject?.name))];

            return {
                id: cls.id,
                name: cls.name,
                gradeLevel: cls.grade_level,
                jurusan: cls.jurusan?.name,
                homeroomTeacher: cls.homeroom_teacher?.user?.full_name,
                metrics: {
                    totalStudents,
                    averageGrade,
                    attendanceRate,
                    totalSubjects: subjects.length,
                    subjects
                }
            };
        });

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

const exportReport = async (req, res, next) => {
    try {
        const { type, format, ...params } = req.query;

        let data;
        switch (type) {
            case 'grades':
                data = await getGradeReportData(params);
                break;
            case 'attendance':
                data = await getAttendanceReportData(params);
                break;
            case 'teacher':
                data = await getTeacherPerformanceData(params);
                break;
            case 'class':
                data = await getClassPerformanceData(params);
                break;
            default:
                return res.status(400).json({ error: 'Tipe laporan tidak valid' });
        }

        if (format === 'csv') {
            // Convert to CSV
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.csv`);
            return res.send(csv);
        } else if (format === 'excel') {
            // For Excel, we'll return JSON and let frontend handle
            res.json({
                success: true,
                data,
                format: 'excel'
            });
        } else {
            res.json({
                success: true,
                data
            });
        }
    } catch (error) {
        next(error);
    }
};

// Helper functions
async function getGradeReportData(params) {
    const { classId, subjectId, academicYearId, studentId } = params;
    
    let query = supabase
        .from('grades')
        .select(`
            student:student_id(nis, user:user_id(full_name)),
            subject:subject_id(name),
            teacher:teacher_id(user:user_id(full_name)),
            grade_type,
            score,
            date,
            description
        `);

    if (classId) query = query.eq('student.class_id', classId);
    if (subjectId) query = query.eq('subject_id', subjectId);
    if (academicYearId) query = query.eq('academic_year_id', academicYearId);
    if (studentId) query = query.eq('student_id', studentId);

    const { data } = await query.order('date');
    return data;
}

async function getAttendanceReportData(params) {
    const { classId, startDate, endDate, studentId } = params;
    
    let query = supabase
        .from('attendance')
        .select(`
            student:student_id(nis, user:user_id(full_name)),
            date,
            status,
            notes,
            schedule:schedule_id(subject:subject_id(name))
        `);

    if (classId) query = query.eq('student.class_id', classId);
    if (studentId) query = query.eq('student_id', studentId);
    if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data } = await query.order('date');
    return data;
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header]?.toString() || '';
            return `"${value.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

module.exports = {
    getGradeReport,
    getAttendanceReport,
    getTeacherPerformanceReport,
    getClassPerformanceReport,
    exportReport
};