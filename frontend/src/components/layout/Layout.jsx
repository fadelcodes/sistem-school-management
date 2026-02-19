import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const { user } = useAuth();

  useEffect(() => {
    // Close sidebar when switching to mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header for all devices */}
      <Header setSidebarOpen={setSidebarOpen} />
      
      {/* Sidebar for desktop */}
      {!isMobile && (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}
      
      {/* Main content */}
      <main className={`
        transition-all duration-300
        ${!isMobile ? 'lg:pl-64' : ''}
        pt-16
        pb-20 md:pb-6
        min-h-screen
      `}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
      
      {/* Bottom navigation for mobile */}
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;