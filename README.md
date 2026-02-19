# Sistem Informasi Sekolah Fullstack

Aplikasi manajemen sekolah lengkap dengan fitur akademik, administrasi, dan reporting.

## Fitur Utama

- ✅ Manajemen User dengan RBAC (Super Admin, Admin, Guru, Siswa, Orang Tua)
- ✅ Manajemen Data Master (Siswa, Guru, Kelas, Mapel, Jurusan)
- ✅ Manajemen Akademik (Jadwal, Nilai, Absensi, Tugas, Materi)
- ✅ Sistem Notifikasi Real-time
- ✅ Dashboard berbeda per role
- ✅ Laporan dan Rekap (Nilai, Absensi)
- ✅ Fully Responsive (Desktop, Tablet, Mobile)
- ✅ Keamanan JWT + RBAC
- ✅ Backup & Restore Database

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router DOM
- React Hook Form
- Axios + Interceptor
- Supabase Realtime
- Heroicons

### Backend
- Node.js + Express
- Supabase PostgreSQL
- JWT Authentication
- RBAC Implementation
- Modular Architecture

## Struktur Database

14 Tabel utama:
- roles, users
- students, teachers
- classes, subjects
- schedules, attendance
- grades, assignments
- materials, notifications
- academic_years, jurusan

## Instalasi

### Prerequisites
- Node.js 18+
- npm atau yarn
- Akun Supabase

### Langkah Instalasi

1. Clone repository
```bash
git clone https://github.com/username/sekolah-app.git
cd sekolah-app