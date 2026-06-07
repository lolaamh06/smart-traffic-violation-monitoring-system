import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FilePlus, FileText, CreditCard, Car,
  Map, LogOut, ShieldAlert, Menu, X, ChevronRight, Bell, User
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/violations/new', icon: FilePlus, label: 'Log Violation' },
  { to: '/violations', icon: FileText, label: 'Violations' },
  { to: '/fines', icon: CreditCard, label: 'Fines' },
  { to: '/vehicles', icon: Car, label: 'Vehicles' },
  { to: '/analytics', icon: Map, label: 'Analytics & Map' },
];

export const OfficerLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const pageTitle = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label || 'STVMS';

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-text-primary">STVMS</p>
            <p className="text-xs text-text-muted">Officer Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Officer Profile */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{currentUser?.name || 'Officer'}</p>
              <p className="text-xs text-text-muted truncate">Badge: {currentUser?.badgeNumber || '—'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-bg/70 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-4">
          <button
            className="lg:hidden text-text-muted hover:text-text-primary transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-display font-bold text-text-primary text-base flex-1">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <button className="relative text-text-muted hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border">
              <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
              <span className="text-xs text-text-secondary font-medium">{currentUser?.zone || 'Central'} Zone</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default OfficerLayout;
