import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, FileText, CreditCard, Scale, LogOut, Car, Menu, X, ChevronRight, User, Map } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/citizen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/citizen/violations', icon: FileText, label: 'My Violations' },
  { to: '/citizen/fines', icon: CreditCard, label: 'Pay Fines' },
  { to: '/citizen/routes', icon: Map, label: 'Route Safety Finder' },
];

export const CitizenLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/citizen/login');
  };

  const pageTitle = NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label || 'My Portal';

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg bg-safe/10 border border-safe/30 flex items-center justify-center">
            <Car className="w-5 h-5 text-safe" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-text-primary">STVMS</p>
            <p className="text-xs text-text-muted">Citizen Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/citizen/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-safe/10 text-safe border border-safe/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-safe' : 'text-text-muted group-hover:text-text-primary'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-safe" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="px-3 py-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-surface-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-safe/10 border border-safe/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-safe" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{currentUser?.name || 'Citizen'}</p>
              <p className="text-xs text-text-muted font-mono truncate">{currentUser?.regNumber || '—'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-all"
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

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-4">
          <button className="lg:hidden text-text-muted hover:text-text-primary" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-display font-bold text-text-primary text-base flex-1">{pageTitle}</h1>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-safe/5 border border-safe/20">
            <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-xs text-safe font-medium">Citizen Account</span>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default CitizenLayout;
