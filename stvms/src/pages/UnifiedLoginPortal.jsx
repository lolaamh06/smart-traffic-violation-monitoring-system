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
      {/* Animated grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(30,58,95,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.15) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-surface border border-border rounded-xl shadow-card p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="flex gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-full bg-safe/10 border border-safe/30 flex items-center justify-center">
                <Car className="w-6 h-6 text-safe" />
              </div>
            </div>
            <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight md:text-4xl">STVMS</h1>
            <p className="text-sm text-text-secondary mt-2 max-w-md">
              Smart Traffic Violation Monitoring System & Citizen Safety Enforcement Platform
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Officer Selection */}
            <button
              onClick={() => selectPortal('officer')}
              className="flex flex-col items-center p-6 bg-surface-2 border border-border hover:border-primary/50 rounded-xl text-center group transition-all duration-300 hover:shadow-card hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <ShieldAlert className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                Officer Portal
              </h2>
              <p className="text-xs text-text-muted mt-2">
                Log violations, monitor hotspot analytics, manage vehicles & issue fines.
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Access Portal <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            {/* Citizen Selection */}
            <button
              onClick={() => selectPortal('citizen')}
              className="flex flex-col items-center p-6 bg-surface-2 border border-border hover:border-safe/50 rounded-xl text-center group transition-all duration-300 hover:shadow-card hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-safe/10 border border-safe/20 flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                <Car className="w-7 h-7 text-safe" />
              </div>
              <h2 className="font-display font-bold text-lg text-text-primary group-hover:text-safe transition-colors">
                Citizen Portal
              </h2>
              <p className="text-xs text-text-muted mt-2">
                Check violations, settle outstanding fines, find safe routes & file contests.
              </p>
              <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-safe opacity-0 group-hover:opacity-100 transition-opacity">
                Access Portal <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          </div>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">BMSIT &amp; M DBMS Mini Project</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Quick Demo Bypass Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => loginAsDemo('officer')}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Quick Demo: Officer Dashboard
            </button>
            <button
              onClick={() => loginAsDemo('citizen')}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border border-safe/30 bg-safe/5 text-safe text-xs font-semibold hover:bg-safe/10 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Quick Demo: Citizen Dashboard
            </button>
          </div>

          {/* Firestore Database Seeder Button (Admin Helper) */}
          <div className="p-4 bg-surface-2/60 border border-border rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-bold text-text-primary">⚙️ Firebase Database Configurator</p>
              <p className="text-[10px] text-text-muted mt-0.5">
                Automatically seed the connected Firestore database with initial collections (Locations, Fines, Users)
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
              className="px-4 py-2 bg-accent/10 border border-accent/30 text-accent rounded-lg text-xs font-semibold hover:bg-accent hover:text-white transition-all cursor-pointer shrink-0"
            >
              Seed Connected Firebase
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-text-muted mt-6">
          SDG 9: Industry, Innovation &amp; Infrastructure · SDG 11: Sustainable Cities
        </p>
      </div>
    </div>
  );
};

export default UnifiedLoginPortal;
