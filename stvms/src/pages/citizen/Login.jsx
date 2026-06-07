import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Zap, Lock, Mail, User, Car, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

const DEMO_EMAIL = 'citizen@stvms.in';
const DEMO_PASSWORD = 'citizen123';

export const CitizenLogin = () => {
  const { loginCitizen, loginAsDemo, currentUser, sandboxMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/citizen/dashboard';

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoTyping, setAutoTyping] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'citizen') navigate(from, { replace: true });
  }, [currentUser]);

  const typeText = async (setter, text, delay = 40) => {
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
    setTab('login');
    await typeText(setEmail, DEMO_EMAIL, 35);
    await new Promise(r => setTimeout(r, 200));
    await typeText(setPassword, DEMO_PASSWORD, 70);
    await new Promise(r => setTimeout(r, 400));
    setLoading(true);
    try {
      await loginCitizen(DEMO_EMAIL, DEMO_PASSWORD);
      toast.success('Welcome, Citizen! Viewing your violation history.');
      navigate(from, { replace: true });
    } catch {
      loginAsDemo('citizen');
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
      setAutoTyping(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginCitizen(email, password);
      toast.success('Logged in!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !regNumber) {
      setError('All fields are required.'); return;
    }
    setError('');
    setLoading(true);
    try {
      await loginCitizen(email, password, { name, regNumber, role: 'citizen' }, true);
      toast.success('Account created!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(30,58,95,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.15) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-surface border border-border rounded-xl shadow-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-safe/10 border border-safe/30 flex items-center justify-center mb-4">
              <Car className="w-9 h-9 text-safe" />
            </div>
            <h1 className="font-display font-bold text-2xl text-text-primary">STVMS Citizen</h1>
            <p className="text-sm text-text-secondary mt-1">Check violations, pay fines, contest tickets</p>
            <span className="mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-safe/10 border border-safe/30 text-safe">
              Citizen Portal
            </span>
          </div>

          {/* Demo Login */}
          <button
            onClick={handleAutoLogin}
            disabled={autoTyping || loading}
            className="w-full mb-6 flex items-center justify-center gap-2 p-3 rounded-lg border border-safe/40 bg-safe/10 text-safe text-sm font-semibold hover:bg-safe/20 transition-all disabled:opacity-50 group"
          >
            <Zap className="w-4 h-4 group-hover:animate-pulse" />
            {autoTyping ? 'Auto-typing credentials...' : '⚡ Quick Demo — Citizen Login'}
          </button>

          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg bg-surface-2 p-1 mb-6 gap-1">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all capitalize ${tab === t ? 'bg-surface text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <div className="flex items-start gap-2 text-sm text-primary bg-primary/10 border border-primary/30 rounded-md p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
              <Button type="submit" variant="primary" className="w-full py-3" loading={loading}>Sign In</Button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                />
              </div>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value.toUpperCase())}
                  placeholder="Vehicle Reg. Number (KA-01-AB-1234)"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-sm font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all uppercase tracking-widest"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-10 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <div className="flex items-start gap-2 text-sm text-primary bg-primary/10 border border-primary/30 rounded-md p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
              <Button type="submit" variant="primary" className="w-full py-3" loading={loading}>Create Account</Button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-text-muted mt-4">BMSIT &amp; M — STVMS Citizen Portal · SDG 11</p>
      </div>
    </div>
  );
};
export default CitizenLogin;
