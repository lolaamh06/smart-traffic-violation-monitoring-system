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
    <div className="min-h-screen bg-bg flex p-2 md:p-4">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 m-4 h-[calc(100vh-2rem)] glass-card rounded-2xl flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-safe/20 to-safe/5 border border-safe/30 flex items-center justify-center shadow-glow-safe">
            <Car className="w-5 h-5 text-safe" />
          </div>
          <div>
            <p className="font-display font-extrabold text-sm text-text-primary tracking-wide">STVMS</p>
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Citizen Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/citizen/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-safe/15 to-safe/5 text-safe border border-safe/25 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)] active-nav-glow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5 hover:border-white/5 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-safe' : 'text-text-muted group-hover:text-text-primary'}`} />
                  <span className="flex-1 tracking-wide">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-safe animate-pulse" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-border bg-black/10 rounded-b-2xl">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-2 border border-border mb-2">
            <div className="w-9 h-9 rounded-lg bg-safe/10 border border-safe/20 flex items-center justify-center shrink-0">
              <User className="w-4.5 h-4.5 text-safe" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-text-primary truncate">{currentUser?.name || 'Citizen'}</p>
              <p className="text-[10px] text-text-muted font-mono truncate">{currentUser?.regNumber || '—'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary hover:bg-primary/10 hover:border-primary/20 border border-transparent transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
        {/* Top Bar */}
        <header className="sticky top-4 z-20 bg-surface/65 backdrop-blur-md border border-border px-6 py-4 flex items-center gap-4 rounded-2xl shadow-card my-2">
          <button className="lg:hidden text-text-muted hover:text-text-primary cursor-pointer p-1" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="font-display font-extrabold text-text-primary text-lg tracking-wide flex-1">{pageTitle}</h1>
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-safe/5 border border-safe/25 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-safe animate-pulse shadow-glow-safe" />
            <span className="text-xs text-safe font-bold tracking-wide">Citizen Account</span>
          </div>
        </header>
        <main className="flex-1 px-2 py-6 md:px-4 max-w-5xl w-full mx-auto animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default CitizenLayout;
