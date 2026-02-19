const { supabase } = require('../config/supabase');

const checkParentAccess = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;
            const resourceId = req.params.id;

            // If user is Super Admin or Admin, allow access
            if (['Super Admin', 'Admin'].includes(req.userRole)) {
                return next();
            }

            // For parent role, check if they have access to the student's data
            if (req.userRole === 'Orang Tua') {
                let studentId;

                if (resourceType === 'student') {
                    studentId = resourceId;
                } else if (resourceType === 'grade') {
                    const { data: grade } = await supabase
                        .from('grades')
                        .select('student_id')
                        .eq('id', resourceId)
                        .single();
                    studentId = grade?.student_id;
                } else if (resourceType === 'attendance') {
                    const { data: attendance } = await supabase
                        .from('attendance')
                        .select('student_id')
                        .eq('id', resourceId)
                        .single();
                    studentId = attendance?.student_id;
                }

                if (studentId) {
                    const { data: student } = await supabase
                        .from('students')
                        .select('parent_id')
                        .eq('id', studentId)
                        .single();

                    if (student?.parent_id === userId) {
                        return next();
                    }
                }

                return res.status(403).json({ error: 'Akses ditolak' });
            }

            // For other roles, implement specific logic
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = { checkParentAccess };