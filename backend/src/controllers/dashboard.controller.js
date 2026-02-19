const { supabase } = require('../config/supabase');

const getAdminStats = async (req, res, next) => {
    try {
        // Get total counts
        const [students, teachers, classes, subjects] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('teachers').select('*', { count: 'exact', head: true }),
            supabase.from('classes').select('*', { count: 'exact', head: true }),
            supabase.from('subjects').select('*', { count: 'exact', head: true })
        ]);

        // Get student distribution per class
        const { data: classDistribution } = await supabase
            .from('classes')
            .select(`
                name,
                students:students(count)
            `)
            .order('name');

        // Get attendance trend for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: attendanceTrend } = await supabase
            .from('attendance')
            .select('date, status')
            .gte('date', sevenDaysAgo.toISOString().split('T')[0])
            .order('date');

        // Process attendance trend
        const trendMap = new Map();
        attendanceTrend?.forEach(item => {
            const date = item.date;
            if (!trendMap.has(date)) {
                trendMap.set(date, { date, hadir: 0, sakit: 0, izin: 0, alpha: 0 });
            }
            const day = trendMap.get(date);
            day[item.status.toLowerCase()]++;
        });

        const studentDistribution = {
            labels: classDistribution?.map(c => c.name) || [],
            datasets: [{
                label: 'Jumlah Siswa',
                data: classDistribution?.map(c => c.students?.[0]?.count || 0) || [],
                backgroundColor: 'rgba(59, 130, 246, 0.5)'
            }]
        };

        const attendanceChart = {
            labels: Array.from(trendMap.keys()).sort(),
            datasets: [
                {
                    label: 'Hadir',
                    data: Array.from(trendMap.values()).map(d => d.hadir),
                    borderColor: 'rgb(34, 197, 94)'
                },
                {
                    label: 'Sakit',
                    data: Array.from(trendMap.values()).map(d => d.sakit),
                    borderColor: 'rgb(234, 179, 8)'
                },
                {
                    label: 'Izin',
                    data: Array.from(trendMap.values()).map(d => d.izin),
                    borderColor: 'rgb(59, 130, 246)'
                },
                {
                    label: 'Alpha',
                    data: Array.from(trendMap.values()).map(d => d.alpha),
                    borderColor: 'rgb(239, 68, 68)'
                }
            ]
        };

        res.json({
            success: true,
            data: {
                totalStudents: students.count || 0,
                totalTeachers: teachers.count || 0,
                totalClasses: classes.count || 0,
                totalSubjects: subjects.count || 0,
                studentDistribution,
                attendanceTrend: attendanceChart
            }
        });
    } catch (error) {
        next(error);
    }
};

const getTeacherStats = async (req, res, next) => {
    try {
        // Get teacher id from user id
        const { data: teacher } = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', req.userId)
            .single();

        if (!teacher) {
            return res.status(404).json({ error: 'Data guru tidak ditemukan' });
        }

        // Get today's schedules
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = days[new Date().getDay()];

        const { data: todaySchedules } = await supabase
            .from('schedules')
            .select(`
                id,
                start_time,
                end_time,
                room,
                subject:subject_id(name),
                class:class_id(name)
            `)
            .eq('teacher_id', teacher.id)
            .eq('day_of_week', today)
            .order('start_time');

        // Get pending assignments to grade
        const { data: pendingAssignments } = await supabase
            .from('assignments')
            .select(`
                id,
                title,
                deadline,
                class:class_id(name),
                submissions:assignment_submissions(
                    id,
                    score,
                    student:student_id(user:user_id(full_name))
                )
            `)
            .eq('teacher_id', teacher.id)
            .is('submissions.score', null)
            .not('submissions', 'is', null);

        // Get total students taught
        const { data: classes } = await supabase
            .from('schedules')
            .select('class_id')
            .eq('teacher_id', teacher.id);

        const classIds = classes?.map(c => c.class_id) || [];
        
        const { count: totalStudents } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .in('class_id', classIds);

        res.json({
            success: true,
            data: {
                todaySchedules: todaySchedules?.length || 0,
                pendingAssignments: pendingAssignments?.reduce((acc, curr) => 
                    acc + (curr.submissions?.filter(s => !s.score)?.length || 0), 0) || 0,
                totalStudents: totalStudents || 0,
                todaySchedule: todaySchedules || [],
                assignments: pendingAssignments || []
            }
        });
    } catch (error) {
        next(error);
    }
};

const getStudentStats = async (req, res, next) => {
    try {
        // Get student id from user id
        const { data: student } = await supabase
            .from('students')
            .select(`
                id,
                class_id,
                user:user_id(full_name)
            `)
            .eq('user_id', req.userId)
            .single();

        if (!student) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        // Get average grade
        const { data: grades } = await supabase
            .from('grades')
            .select('score')
            .eq('student_id', student.id);

        const averageGrade = grades?.length > 0 
            ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
            : 0;

        // Get attendance percentage
        const { data: attendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', student.id);

        const totalAttendance = attendance?.length || 0;
        const hadirCount = attendance?.filter(a => a.status === 'Hadir')?.length || 0;
        const attendancePercentage = totalAttendance > 0 
            ? ((hadirCount / totalAttendance) * 100).toFixed(1)
            : 0;

        // Get assignments
        const { data: assignments } = await supabase
            .from('assignments')
            .select(`
                id,
                title,
                deadline,
                subject:subject_id(name),
                submission:assignment_submissions!left(
                    id,
                    score,
                    submitted_at
                )
            `)
            .eq('class_id', student.class_id)
            .order('deadline');

        const newAssignments = assignments?.filter(a => !a.submission)?.length || 0;
        const completedAssignments = assignments?.filter(a => a.submission)?.length || 0;

        // Get recent grades
        const { data: recentGrades } = await supabase
            .from('grades')
            .select(`
                *,
                subject:subject_id(name)
            `)
            .eq('student_id', student.id)
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            success: true,
            data: {
                averageGrade,
                attendance: attendancePercentage,
                newAssignments,
                completedAssignments,
                recentGrades: recentGrades || []
            }
        });
    } catch (error) {
        next(error);
    }
};

const getParentStats = async (req, res, next) => {
    try {
        // Get all children of this parent
        const { data: children } = await supabase
            .from('students')
            .select(`
                id,
                nis,
                user:user_id(id, full_name),
                class:class_id(name)
            `)
            .eq('parent_id', req.userId);

        const childrenStats = await Promise.all(children.map(async (child) => {
            // Get average grade
            const { data: grades } = await supabase
                .from('grades')
                .select('score')
                .eq('student_id', child.id);

            const averageGrade = grades?.length > 0 
                ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
                : 0;

            // Get attendance percentage
            const { data: attendance } = await supabase
                .from('attendance')
                .select('status')
                .eq('student_id', child.id);

            const totalAttendance = attendance?.length || 0;
            const hadirCount = attendance?.filter(a => a.status === 'Hadir')?.length || 0;
            const attendancePercentage = totalAttendance > 0 
                ? ((hadirCount / totalAttendance) * 100).toFixed(1)
                : 0;

            // Get pending assignments
            const { data: assignments } = await supabase
                .from('assignments')
                .select(`
                    id,
                    submission:assignment_submissions!left(id)
                `)
                .eq('class_id', child.class_id);

            const pendingAssignments = assignments?.filter(a => !a.submission)?.length || 0;

            return {
                id: child.id,
                name: child.user.full_name,
                class: child.class?.name,
                averageGrade,
                attendance: attendancePercentage,
                pendingAssignments
            };
        }));

        // Get recent activities for all children
        const { data: recentGrades } = await supabase
            .from('grades')
            .select(`
                *,
                student:student_id(user:user_id(full_name)),
                subject:subject_id(name)
            `)
            .in('student_id', children.map(c => c.id))
            .order('created_at', { ascending: false })
            .limit(10);

        const recentActivities = recentGrades?.map(g => ({
            title: 'Nilai Baru',
            description: `${g.student.user.full_name} mendapat nilai ${g.subject.name}: ${g.score}`,
            time: new Date(g.created_at).toLocaleDateString('id-ID'),
            type: 'grade'
        })) || [];

        res.json({
            success: true,
            data: {
                children: childrenStats,
                recentActivities
            }
        });
    } catch (error) {
        next(error);
    }
};

const getRecentActivities = async (req, res, next) => {
    try {
        const activities = [];

        // Get recent grades
        const { data: recentGrades } = await supabase
            .from('grades')
            .select(`
                *,
                student:student_id(user:user_id(full_name)),
                subject:subject_id(name),
                teacher:teacher_id(user:user_id(full_name))
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        recentGrades?.forEach(g => {
            activities.push({
                description: `Nilai ${g.subject.name} untuk ${g.student.user.full_name}: ${g.score}`,
                time: new Date(g.created_at).toLocaleString('id-ID'),
                user: g.teacher?.user?.full_name || 'Sistem'
            });
        });

        // Get recent assignments
        const { data: recentAssignments } = await supabase
            .from('assignments')
            .select(`
                *,
                teacher:teacher_id(user:user_id(full_name)),
                class:class_id(name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        recentAssignments?.forEach(a => {
            activities.push({
                description: `Tugas baru: ${a.title} untuk kelas ${a.class.name}`,
                time: new Date(a.created_at).toLocaleString('id-ID'),
                user: a.teacher?.user?.full_name || 'Sistem'
            });
        });

        // Sort by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            success: true,
            data: activities.slice(0, 10)
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAdminStats,
    getTeacherStats,
    getStudentStats,
    getParentStats,
    getRecentActivities
};