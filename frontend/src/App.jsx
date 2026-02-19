import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/layout/Layout'

// Public Pages
import Login from './pages/Login'

// Dashboard Pages
import Dashboard from './pages/Dashboard'

// Data Management Pages
import Users from './pages/data/Users'
import Students from './pages/data/Students'
import Teachers from './pages/data/Teachers'
import Classes from './pages/data/Classes'
import Subjects from './pages/data/Subjects'
import AcademicYears from './pages/data/AcademicYears'
import Jurusan from './pages/data/Jurusan'

// Academic Pages
import Schedules from './pages/academic/Schedules'
import Grades from './pages/academic/Grades'
import Attendance from './pages/academic/Attendance'
import Materials from './pages/academic/Materials'
import Assignments from './pages/academic/Assignments'

// Reports Pages
import GradeReports from './pages/reports/GradeReports'
import AttendanceReports from './pages/reports/AttendanceReports'

// Settings Pages
import Settings from './pages/settings/Settings'
import Profile from './pages/settings/Profile'

// Not Found
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Data Management Routes */}
                <Route path="/data/users" element={<Users />} />
                <Route path="/data/students" element={<Students />} />
                <Route path="/data/teachers" element={<Teachers />} />
                <Route path="/data/classes" element={<Classes />} />
                <Route path="/data/subjects" element={<Subjects />} />
                <Route path="/data/academic-years" element={<AcademicYears />} />
                <Route path="/data/jurusan" element={<Jurusan />} />
                
                {/* Academic Routes */}
                <Route path="/academic/schedules" element={<Schedules />} />
                <Route path="/academic/grades" element={<Grades />} />
                <Route path="/academic/attendance" element={<Attendance />} />
                <Route path="/academic/materials" element={<Materials />} />
                <Route path="/academic/assignments" element={<Assignments />} />
                
                {/* Reports Routes */}
                <Route path="/reports/grades" element={<GradeReports />} />
                <Route path="/reports/attendance" element={<AttendanceReports />} />
                
                {/* Settings Routes */}
                <Route path="/settings/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App