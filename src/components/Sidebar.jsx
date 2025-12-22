// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings,
  Tag, 
  Rocket,
  Menu,
  X,
  Eye
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/categories', label: 'Categories', icon: Tag }, 
    { path: '/products', label: 'Products', icon: Package },
    { path: '/orders', label: 'Orders', icon: ClipboardList },
    { path: '/shiprocket', label: 'ShipRocket', icon: Rocket },
   
    { path: '/customers', label: 'Customers', icon: Users },
    //  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openWebsite = () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
    window.open(frontendUrl, '_blank');
    closeMobileMenu();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 z-40">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Admin Panel
            </h2>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-800"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white/95 backdrop-blur-xl text-slate-800 w-64 h-screen p-6 border-r border-slate-200/80
        lg:flex lg:flex-col
      `}>
        {/* Header */}
        <div className="mb-8 pt-4 pl-2 flex-shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Admin Panel
          </h2>
          <p className="text-slate-500 text-sm mt-2">Welcome back!</p>
          
          {/* View Website Button */}
          <button
            onClick={openWebsite}
            className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <Eye size={18} />
            View Website
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-out ${
                      isActive
                        ? 'bg-white text-slate-800 shadow-md border border-slate-200/60'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <span className={`mr-3 text-lg transition-transform duration-200 ${
                      isActive ? 'scale-105' : 'group-hover:scale-105'
                    }`}>
                      <Icon size={20} />
                    </span>
                    
                    <span className="font-medium tracking-wide transition-all duration-200">
                      {item.label}
                    </span>
                    
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-slate-800 rounded-full" />
                    )}
                    
                    {!isActive && (
                      <div className="ml-auto w-1 h-5 bg-slate-300 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 space-y-4 mt-auto">
          {/* Admin Profile */}
          <div className="p-3 bg-white/80 rounded-xl backdrop-blur-sm border border-slate-200/60">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-slate-700 to-slate-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <p className="text-slate-800 font-medium text-sm">Admin User</p>
                <p className="text-slate-500 text-xs">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Spacer */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default Sidebar;