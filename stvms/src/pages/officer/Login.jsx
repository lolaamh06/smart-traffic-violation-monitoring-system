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
      {/* Animated cyber-mesh grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(10,132,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,132,255,0.06) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
      
      {/* Dynamic colorful blur highlights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Back Link */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Portal Selection
        </button>

        {/* Card */}
        <div className="glass-card rounded-3xl shadow-card p-8 md:p-10 border border-border">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4 shadow-glow-primary">
              <ShieldAlert className="w-9 h-9 text-primary" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-text-primary tracking-tight">STVMS</h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">Smart Traffic Violation Monitoring System</p>
            <span className="mt-3 px-3 py-1 rounded-full text-[10px] font-extrabold bg-primary/10 border border-primary/25 text-primary uppercase tracking-wider shadow-sm">
              Officer Portal
            </span>
          </div>

          {/* Sandbox Banner */}
          {sandboxMode && (
            <div className="mb-4 p-3 rounded-xl bg-warn/10 border border-warn/25 text-xs text-warn font-semibold text-center">
              Running in Sandbox Mode — credentials are pre-filled below
            </div>
          )}

          {/* Demo Quick Login Button */}
          <button
            onClick={handleAutoLogin}
            disabled={autoTyping || loading}
            className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-safe/25 bg-safe/5 text-safe text-sm font-bold hover:bg-safe/15 hover:shadow-glow-safe transition-all duration-300 disabled:opacity-50 group cursor-pointer active:scale-95 shadow-sm"
          >
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {autoTyping ? 'Auto-typing credentials...' : '⚡ Quick Demo Login'}
          </button>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-text-muted font-extrabold uppercase tracking-wider">or enter manually</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="text-[10px] font-extrabold text-text-secondary font-display uppercase tracking-widest block mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@stvms.gov"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-extrabold text-text-secondary font-display uppercase tracking-widest block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-2 border border-border rounded-xl pl-11 pr-11 py-3.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-xs text-primary bg-primary/10 border border-primary/25 rounded-xl p-3.5 shadow-sm">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-primary" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 text-sm font-bold mt-2 shadow-glow-primary active:scale-95 transition-transform"
              loading={loading}
            >
              Sign In to Officer Portal
            </Button>
          </form>

          {/* Hint */}
          <p className="text-center text-[10px] text-text-muted mt-6 font-semibold leading-relaxed">
            Officers are registered by the system administrator.<br />
            Contact admin for access credentials.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-text-muted mt-5 font-semibold">
          BMSIT &amp; M — DBMS Mini Project 4th Sem · SDG 9
        </p>
      </div>
    </div>
  );
};
export default Login;
