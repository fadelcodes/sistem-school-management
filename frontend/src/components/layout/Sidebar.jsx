import React, { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ open, setOpen }) => {
  const { hasRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['*'] },
    
    // Data Management
    { 
      name: 'Data Master', 
      children: [
        { name: 'Users', href: '/data/users', icon: UsersIcon, roles: ['Super Admin', 'Admin'] },
        { name: 'Siswa', href: '/data/students', icon: UserGroupIcon, roles: ['Super Admin', 'Admin', 'Admin TU'] },
        { name: 'Guru', href: '/data/teachers', icon: AcademicCapIcon, roles: ['Super Admin', 'Admin', 'Admin TU'] },
        { name: 'Kelas', href: '/data/classes', icon: BookOpenIcon, roles: ['Super Admin', 'Admin', 'Admin TU'] },
        { name: 'Mata Pelajaran', href: '/data/subjects', icon: DocumentTextIcon, roles: ['Super Admin', 'Admin', 'Admin TU'] },
        { name: 'Tahun Ajaran', href: '/data/academic-years', icon: CalendarIcon, roles: ['Super Admin', 'Admin'] },
        { name: 'Jurusan', href: '/data/jurusan', icon: AcademicCapIcon, roles: ['Super Admin', 'Admin'] },
      ],
      roles: ['Super Admin', 'Admin', 'Admin TU']
    },
    
    // Academic
    {
      name: 'Akademik',
      children: [
        { name: 'Jadwal', href: '/academic/schedules', icon: CalendarIcon, roles: ['*'] },
        { name: 'Nilai', href: '/academic/grades', icon: ChartBarIcon, roles: ['*'] },
        { name: 'Absensi', href: '/academic/attendance', icon: ClipboardDocumentListIcon, roles: ['*'] },
        { name: 'Materi', href: '/academic/materials', icon: DocumentTextIcon, roles: ['Guru', 'Siswa'] },
        { name: 'Tugas', href: '/academic/assignments', icon: BookOpenIcon, roles: ['Guru', 'Siswa'] },
      ],
      roles: ['*']
    },
    
    // Reports
    {
      name: 'Laporan',
      children: [
        { name: 'Rekap Nilai', href: '/reports/grades', icon: ChartBarIcon, roles: ['*'] },
        { name: 'Rekap Absensi', href: '/reports/attendance', icon: DocumentTextIcon, roles: ['*'] },
      ],
      roles: ['*']
    },
    
    // Settings
    {
      name: 'Pengaturan',
      children: [
        { name: 'Profil', href: '/settings/profile', icon: UsersIcon, roles: ['*'] },
        { name: 'Pengaturan Sistem', href: '/settings', icon: Cog6ToothIcon, roles: ['Super Admin', 'Admin'] },
      ],
      roles: ['Super Admin', 'Admin', 'Guru', 'Siswa', 'Orang Tua']
    },
  ];

  const filterNavigation = (items) => {
    return items.filter(item => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => 
          child.roles.includes('*') || hasRole(child.roles)
        );
        return filteredChildren.length > 0 && (item.roles.includes('*') || hasRole(item.roles));
      }
      return item.roles.includes('*') || hasRole(item.roles);
    });
  };

  const filteredNavigation = filterNavigation(navigation);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <span className="text-xl font-bold text-primary-600">SekolahApp</span>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {filteredNavigation.map((item) => (
          <div key={item.name} className="mb-4">
            {item.children ? (
              <>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {item.name}
                </h3>
                <div className="space-y-1">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={child.href}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`
                      }
                    >
                      <child.icon className="h-5 w-5 mr-3" />
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              </>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;