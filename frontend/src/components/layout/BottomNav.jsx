import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BellIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BellIcon as BellIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import { useNotifications } from '../../context/NotificationContext';

const BottomNav = () => {
  const { unreadCount } = useNotifications();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, activeIcon: HomeIconSolid },
    { name: 'Data', href: '/data/students', icon: ClipboardDocumentListIcon, activeIcon: ClipboardDocumentListIconSolid },
    { name: 'Laporan', href: '/reports/grades', icon: ChartBarIcon, activeIcon: ChartBarIconSolid },
    { 
      name: 'Notif', 
      href: '/notifications', 
      icon: BellIcon, 
      activeIcon: BellIconSolid,
      badge: unreadCount > 0 ? unreadCount : null
    },
    { name: 'Profil', href: '/settings/profile', icon: UserIcon, activeIcon: UserIconSolid },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
      <div className="flex justify-around items-center h-16">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full relative ${
                isActive ? 'text-primary-600' : 'text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <item.activeIcon className="h-6 w-6" />
                ) : (
                  <item.icon className="h-6 w-6" />
                )}
                <span className="text-xs mt-1">{item.name}</span>
                {item.badge && (
                  <span className="absolute top-1 right-1/4 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;