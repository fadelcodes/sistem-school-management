import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../config/axios';
import {
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats based on role
      let statsResponse;
      if (hasRole(['Super Admin', 'Admin'])) {
        statsResponse = await api.get('/dashboard/admin-stats');
      } else if (hasRole('Guru')) {
        statsResponse = await api.get('/dashboard/teacher-stats');
      } else if (hasRole('Siswa')) {
        statsResponse = await api.get('/dashboard/student-stats');
      } else if (hasRole('Orang Tua')) {
        statsResponse = await api.get('/dashboard/parent-stats');
      }

      if (statsResponse) {
        setStats(statsResponse.data);
      }

      // Fetch recent activities
      const activitiesResponse = await api.get('/dashboard/recent-activities');
      setRecentActivities(activitiesResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalStudents || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Guru</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalTeachers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <BookOpenIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Kelas</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalClasses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Mata Pelajaran</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalSubjects || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Distribusi Siswa per Kelas</h3>
          <Bar 
            data={stats?.studentDistribution || { labels: [], datasets: [] }}
            options={{ responsive: true }}
          />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Kehadiran Minggu Ini</h3>
          <Line 
            data={stats?.attendanceTrend || { labels: [], datasets: [] }}
            options={{ responsive: true }}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-center py-2 border-b last:border-0">
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      {/* Teacher specific dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Jadwal Mengajar</h3>
          <p className="text-3xl font-bold text-primary-600">
            {stats?.todaySchedules || 0}
          </p>
          <p className="text-sm text-gray-600">Hari ini</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Tugas Perlu Dinilai</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats?.pendingAssignments || 0}
          </p>
          <p className="text-sm text-gray-600">Menunggu penilaian</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Total Siswa</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.totalStudents || 0}
          </p>
          <p className="text-sm text-gray-600">Yang diajar</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Jadwal Mengajar Hari Ini</h3>
        <div className="space-y-3">
          {stats?.todaySchedule?.map((schedule, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-16 text-sm font-medium text-gray-600">
                {schedule.time}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{schedule.subject}</p>
                <p className="text-sm text-gray-600">Kelas {schedule.class}</p>
              </div>
              <span className="text-sm text-gray-500">{schedule.room}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Student specific dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Rata-rata Nilai</h3>
          <p className="text-3xl font-bold text-primary-600">
            {stats?.averageGrade || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Kehadiran</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.attendance || 0}%
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Tugas Baru</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats?.newAssignments || 0}
          </p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Tugas Selesai</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats?.completedAssignments || 0}
          </p>
        </div>
      </div>

      {/* Recent Grades */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Nilai Terbaru</h3>
        <div className="space-y-3">
          {stats?.recentGrades?.map((grade, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{grade.subject}</p>
                <p className="text-sm text-gray-600">{grade.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary-600">{grade.score}</p>
                <p className="text-xs text-gray-500">{grade.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderParentDashboard = () => (
    <div className="space-y-6">
      {/* Parent specific dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats?.children?.map((child) => (
          <div key={child.id} className="card">
            <h3 className="text-lg font-semibold mb-2">{child.name}</h3>
            <p className="text-sm text-gray-600 mb-3">Kelas {child.class}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rata-rata Nilai:</span>
                <span className="text-sm font-medium text-primary-600">
                  {child.averageGrade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kehadiran:</span>
                <span className="text-sm font-medium text-green-600">
                  {child.attendance}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tugas Tertunda:</span>
                <span className="text-sm font-medium text-yellow-600">
                  {child.pendingAssignments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities from Children */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Aktivitas Anak Terbaru</h3>
        <div className="space-y-3">
          {stats?.recentActivities?.map((activity, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{activity.time}</p>
                <span className={`text-xs ${
                  activity.type === 'grade' ? 'text-primary-600' : 
                  activity.type === 'attendance' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {activity.type === 'grade' ? 'Nilai' : 
                   activity.type === 'attendance' ? 'Absensi' : 'Tugas'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      
      {hasRole(['Super Admin', 'Admin']) && renderAdminDashboard()}
      {hasRole('Guru') && renderTeacherDashboard()}
      {hasRole('Siswa') && renderStudentDashboard()}
      {hasRole('Orang Tua') && renderParentDashboard()}
    </div>
  );
};

export default Dashboard;