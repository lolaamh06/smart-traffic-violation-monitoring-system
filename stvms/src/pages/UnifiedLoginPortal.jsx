import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Car, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const UnifiedLoginPortal = () => {
  const { loginAsDemo, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'citizen') {
        navigate('/citizen/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser]);

  const selectPortal = (role) => {
    if (role === 'officer') {
      navigate('/login');
    } else {
      navigate('/citizen/login');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated cyber-mesh grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(10,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.06) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      
      {/* Dynamic colorful blur highlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-safe/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

      <div className="relative z-10 w-full max-w-2xl animate-fade-up">
        <div className="glass-card rounded-3xl p-8 md:p-12 shadow-card">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center shadow-glow-primary transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                <ShieldAlert className="w-7 h-7 text-primary" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-safe/25 to-safe/5 border border-safe/20 flex items-center justify-center shadow-glow-safe transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <Car className="w-7 h-7 text-safe" />
              </div>
            </div>
            <h1 className="font-display font-extrabold text-4xl text-text-primary tracking-tight md:text-5xl bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">STVMS</h1>
            <p className="text-sm text-text-secondary mt-3 max-w-md font-medium">
              Smart Traffic Violation Monitoring & Citizen Safety Enforcement Platform
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Officer Selection */}
            <button
              onClick={() => selectPortal('officer')}
              className="flex flex-col items-center p-6 bg-white/[0.02] border border-border hover:border-primary/50 rounded-2xl text-center group transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-glow-primary cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/25 shadow-sm">
                <ShieldAlert className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display font-extrabold text-lg text-text-primary group-hover:text-primary transition-colors duration-300">
                Officer Portal
              </h2>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Log violations, monitor hotspot analytics, manage vehicles & issue fines.
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-bold text-primary translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                Access Portal <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Citizen Selection */}
            <button
              onClick={() => selectPortal('citizen')}
              className="flex flex-col items-center p-6 bg-white/[0.02] border border-border hover:border-safe/50 rounded-2xl text-center group transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-glow-safe cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-safe/10 border border-safe/20 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-safe/25 shadow-sm">
                <Car className="w-8 h-8 text-safe" />
              </div>
              <h2 className="font-display font-extrabold text-lg text-text-primary group-hover:text-safe transition-colors duration-300">
                Citizen Portal
              </h2>
              <p className="text-xs text-text-muted mt-2 leading-relaxed">
                Check violations, settle outstanding fines, find safe routes & file contests.
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-bold text-safe translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                Access Portal <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          <div className="relative flex items-center gap-3 mb-8">
            <span className="text-xs text-text-muted font-bold tracking-wider uppercase">Quick Demo Bypass</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Quick Demo Bypass Row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => loginAsDemo('officer')}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/15 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-glow-primary active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Officer Dashboard
            </button>
            <button
              onClick={() => loginAsDemo('citizen')}
              className="flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-safe/20 bg-safe/5 text-safe text-xs font-bold hover:bg-safe/15 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-glow-safe active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Citizen Dashboard
            </button>
          </div>

          {/* Firestore Database Seeder Button (Admin Helper) */}
          <div className="p-5 bg-black/20 border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-inner">
            <div className="text-left">
              <p className="text-xs font-extrabold text-text-primary tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                ⚙️ Database Configurator
              </p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-sm font-medium">
                Populate your live Firebase Firestore database automatically with realistic collections (locations, violation types, sample vehicles, violations & fines).
              </p>
            </div>
            <button
              onClick={async () => {
                const { seedFirestore } = await import('../utils/firestoreSeeder');
                const toastId = toast.loading('Seeding collections to live Firebase database...');
                const res = await seedFirestore();
                if (res.success) {
                  toast.success('Successfully populated Firestore collections! Ready to demo.', { id: toastId });
                } else {
                  toast.error(`Configuration Error: ${res.error}. Make sure your .env has VITE_FIREBASE_API_KEY.`, { id: toastId, duration: 6000 });
                }
              }}
              className="px-5 py-2.5 bg-accent/10 border border-accent/20 text-accent rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all duration-300 cursor-pointer shadow-sm shrink-0 active:scale-95"
            >
              Seed Firestore Data
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-text-muted mt-6 font-semibold tracking-wide">
          BMSIT &amp; M DBMS Mini Project · SDG 9 &amp; 11 Compliant
        </p>
      </div>
    </div>
  );
};

export default UnifiedLoginPortal;
