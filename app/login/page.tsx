'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_FACULTY_STAFF } from '@/lib/public_staff';
import { Shield, Lock, Mail, ArrowRight, Sun, Moon, Key, UserPlus, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'set_password' | 'register'>('signin');
  
  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Set Password State
  const [setPasswordEmail, setSetPasswordEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Register State
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerTitle, setRegisterTitle] = useState('Assistant Lecturer');
  const [registerDept, setRegisterDept] = useState('Faculty of Biotechnology');
  const [registerPassword, setRegisterPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('faculty_theme') as 'dark' | 'light' | null;
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    const active = saved || current || 'dark';
    setTheme(active);
    document.documentElement.setAttribute('data-theme', active);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('faculty_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // 1. Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials or unauthorized account');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Set / Create Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_password',
          email: setPasswordEmail.trim(),
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to configure password');
      }

      setSuccess('Your password has been configured! Redirecting to portal...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: registerEmail.trim(),
          password: registerPassword,
          full_name: registerName.trim(),
          title: registerTitle.trim(),
          department: registerDept.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
    }}>
      {/* Theme Toggle */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            fontWeight: 600,
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={15} color="#fbbf24" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} color="#6366f1" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '12px 22px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
            marginBottom: '16px',
          }}>
            <img
              src="/logos/msa-university.jpeg"
              alt="MSA University"
              style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ width: '1px', height: '40px', background: '#cbd5e1' }}></div>
            <img
              src="/logos/faculty-of-biotechnology.jpeg"
              alt="Faculty of Biotechnology"
              style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}>
            Faculty of Biotechnology
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            MSA University Academic Staff & Governance Portal
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'var(--bg-inset)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '16px',
          border: '1px solid var(--border)',
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'signin' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('set_password'); setError(''); setSuccess(''); }}
            style={{
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'set_password' ? 'var(--accent-blue)' : 'transparent',
              color: mode === 'set_password' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            Create / Set Password
          </button>
        </div>

        {/* Card */}
        <div className="card" style={{
          padding: '28px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--card-bg, #111a31)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '18px',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.85rem',
              marginBottom: '18px',
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>{success}</div>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn}>
              {/* Embedded Faculty Profiles Dropdown (1-Click Selection) */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎓 Select Faculty Member (Embedded)</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-blue)', fontWeight: 600 }}>Auto-fills email</span>
                </label>
                <select
                  className="form-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      setEmail(e.target.value);
                      setSetPasswordEmail(e.target.value);
                    }
                  }}
                  defaultValue=""
                  style={{ width: '100%', fontSize: '0.85rem', height: '40px' }}
                >
                  <option value="">-- Choose your name from directory ({ALL_FACULTY_STAFF.length} staff) --</option>
                  <optgroup label="👑 Executive Leadership & Deanship">
                    <option value="gehan.safwat@msa.edu.eg">👑 Prof. Dr. Gehan Safwat — Dean of Faculty (Super Admin)</option>
                    <option value="amr.ageez@msa.edu.eg">⭐ Prof. Dr. Amr Ageez — Vice Dean for Academic Affairs (Super Admin)</option>
                    <option value="admin@faculty.edu">Admin — Central University Governance</option>
                  </optgroup>
                  <optgroup label="🏛️ Professors & Associate Professors">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'professors').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🩺 Doctors & Ph.D. Lecturers">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'doctors').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🧬 Assistant Lecturers (LA)">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'la').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📚 Teaching Assistants (TA)">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'ta').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🧪 Research Cadres (N112 & Prototyping)">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'ra_n112' || s.category === 'prototyping_ra').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🏢 Academic Administration">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'administration').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Or type your email directly below:
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                  Official University Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="name@msa.edu.eg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('set_password'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-blue)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Forgot / Create password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="Enter your confidential password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* MODE 2: CREATE / SET PASSWORD */}
          {mode === 'set_password' && (
            <form onSubmit={handleSetPassword}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Create Your Password
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Select your profile or enter your official MSA email to set your confidential password.
                </div>
              </div>

              {/* Embedded Faculty Profiles Dropdown */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎓 Select Your Profile (Embedded)</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-blue)', fontWeight: 600 }}>Auto-fills email</span>
                </label>
                <select
                  className="form-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      setSetPasswordEmail(e.target.value);
                      setEmail(e.target.value);
                    }
                  }}
                  defaultValue=""
                  style={{ width: '100%', fontSize: '0.85rem', height: '40px' }}
                >
                  <option value="">-- Choose your name from directory ({ALL_FACULTY_STAFF.length} staff) --</option>
                  <optgroup label="👑 Executive Leadership & Deanship">
                    <option value="gehan.safwat@msa.edu.eg">👑 Prof. Dr. Gehan Safwat — Dean of Faculty (Super Admin)</option>
                    <option value="amr.ageez@msa.edu.eg">⭐ Prof. Dr. Amr Ageez — Vice Dean for Academic Affairs (Super Admin)</option>
                    <option value="admin@faculty.edu">Admin — Central University Governance</option>
                  </optgroup>
                  <optgroup label="🏛️ Professors & Associate Professors">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'professors').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🩺 Doctors & Ph.D. Lecturers">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'doctors').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🧬 Assistant Lecturers (LA)">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'la').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📚 Teaching Assistants (TA)">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'ta').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🧪 Research Cadres (N112 & Prototyping)">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'ra_n112' || s.category === 'prototyping_ra').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🏢 Academic Administration">
                    {ALL_FACULTY_STAFF.filter(s => s.category === 'administration').map(s => (
                      <option key={s.id} value={s.email}>
                        {s.full_name} — {s.rank || s.title} ({s.email})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Official University Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="e.g. hala.khorshid@msa.edu.eg"
                    value={setPasswordEmail}
                    onChange={(e) => setSetPasswordEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Choose New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="Re-type your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Saving Password...' : 'Save Password & Sign In'}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* MODE 3: REGISTER NEW FACULTY */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="e.g. Dr. Sarah Hassan"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Official University Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="sarah.hassan@msa.edu.eg"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Academic Title / Role
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Lecturer, Assistant Professor, Teaching Assistant"
                  value={registerTitle}
                  onChange={(e) => setRegisterTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>
                  Create Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '42px', width: '100%' }}
                    placeholder="Minimum 6 characters"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register & Enter Portal'}
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Bottom Switch Link */}
          <div style={{ marginTop: '18px', textAlign: 'center', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
            {mode !== 'register' ? (
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <UserPlus size={14} color="var(--accent-blue)" />
                New faculty member? <span style={{ color: 'var(--accent-blue)' }}>Register your account</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-blue)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        {/* Confidential Security Notice */}
        <div style={{
          textAlign: 'center',
          marginTop: '18px',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}>
          <Shield size={14} />
          Confidential Faculty System • Encrypted Password Authentication
        </div>
      </div>
    </div>
  );
}
