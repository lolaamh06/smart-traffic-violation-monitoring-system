import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Eye, EyeOff, Zap, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const DEMO_EMAIL = 'ravi@stvms.gov';
const DEMO_PASSWORD = 'admin123';

export const Login = () => {
  const { login, loginAsDemo, currentUser, sandboxMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoTyping, setAutoTyping] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    if (currentUser) navigate(from, { replace: true });
  }, [currentUser]);

  const typeText = async (setter, text, delay = 50) => {
    setter('');
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, delay));
      setter(text.slice(0, i));
    }
  };

  const handleAutoLogin = async () => {
    if (autoTyping) return;
    setAutoTyping(true);
    setError('');
    // Auto-type credentials with animation
    await typeText(setEmail, DEMO_EMAIL, 40);
    await new Promise(r => setTimeout(r, 200));
    await typeText(setPassword, DEMO_PASSWORD, 80);
    await new Promise(r => setTimeout(r, 400));
    // Then auto-submit
    setLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      toast.success('Demo login successful! Welcome, Officer Ravi.');
      navigate(from, { replace: true });
    } catch (err) {
      // Fallback to demo bypass
      loginAsDemo();
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
      setAutoTyping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
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

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-surface border border-border rounded-xl shadow-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
              <ShieldAlert className="w-9 h-9 text-primary" />
            </div>
            <h1 className="font-display font-bold text-2xl text-text-primary tracking-tight">STVMS</h1>
            <p className="text-sm text-text-secondary mt-1">Smart Traffic Violation Monitoring System</p>
            <span className="mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-accent/10 border border-accent/30 text-accent">
              Officer Portal
            </span>
          </div>

          {/* Sandbox Banner */}
          {sandboxMode && (
            <div className="mb-4 p-3 rounded-md bg-warn/10 border border-warn/30 text-xs text-warn font-medium text-center">
              Running in Sandbox Mode — credentials are pre-filled below
            </div>
          )}

          {/* Demo Quick Login Button */}
          <button
            onClick={handleAutoLogin}
            disabled={autoTyping || loading}
            className="w-full mb-6 flex items-center justify-center gap-2 p-3 rounded-lg border border-safe/40 bg-safe/10 text-safe text-sm font-semibold hover:bg-safe/20 transition-all disabled:opacity-50 group"
          >
            <Zap className="w-4 h-4 group-hover:animate-pulse" />
            {autoTyping ? 'Auto-typing credentials...' : '⚡ Quick Demo Login (Auto-fill & Sign In)'}
          </button>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">or enter manually</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@stvms.gov"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-primary bg-primary/10 border border-primary/30 rounded-md p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 text-base mt-2"
              loading={loading}
            >
              Sign In to Officer Portal
            </Button>
          </form>

          {/* Hint */}
          <p className="text-center text-xs text-text-muted mt-6">
            Officers are registered by the system administrator.<br />
            Contact admin for access credentials.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-4">
          BMSIT &amp; M — DBMS Mini Project 4th Sem · SDG 9
        </p>
      </div>
    </div>
  );
};
export default Login;
