'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, Sun, Moon, Sparkles, Search } from 'lucide-react';
import { ALL_FACULTY_STAFF } from '@/lib/public_staff';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [staffSearch, setStaffSearch] = useState('');

  // Initialize theme from localStorage or document attribute
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

  const filteredStaff = ALL_FACULTY_STAFF.filter(s => {
    if (!staffSearch.trim()) return true;
    const q = staffSearch.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.rank && s.rank.toLowerCase().includes(q)) ||
      (s.ar_name && s.ar_name.includes(staffSearch.trim())) ||
      (s.rank_ar && s.rank_ar.includes(staffSearch.trim())) ||
      s.title.toLowerCase().includes(q)
    );
  });

  const leadershipStaff = filteredStaff.filter(s => s.category === 'leadership');
  const professorStaff = filteredStaff.filter(s => s.category === 'professors');
  const doctorStaff = filteredStaff.filter(s => s.category === 'doctors');
  const laStaff = filteredStaff.filter(s => s.category === 'la');
  const taStaff = filteredStaff.filter(s => s.category === 'ta');
  const raN112Staff = filteredStaff.filter(s => s.category === 'ra_n112');
  const prototypingRaStaff = filteredStaff.filter(s => s.category === 'prototyping_ra');
  const adminStaff = filteredStaff.filter(s => s.category === 'administration');

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
      {/* Top Bar with Theme Toggle */}
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

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand Header with Official Logos */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '12px 22px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22), 0 0 20px rgba(245, 158, 11, 0.15)',
            marginBottom: '18px',
          }}>
            <img
              src="/logos/msa-university.jpeg"
              alt="MSA University"
              style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ width: '1px', height: '44px', background: '#cbd5e1' }}></div>
            <img
              src="/logos/faculty-of-biotechnology.jpeg"
              alt="Faculty of Biotechnology"
              style={{ height: '56px', width: 'auto', objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
            MSA UNIVERSITY
          </h1>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '6px', letterSpacing: '0.02em' }}>
            FACULTY OF BIOTECHNOLOGY
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            Executive Governance & Academic Task Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card" style={{ padding: '32px 28px' }}>
          {error && (
            <div style={{
              background: 'var(--status-overdue-bg)',
              border: '1px solid var(--status-overdue-border)',
              color: 'var(--status-overdue)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                University Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '12px' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '42px', width: '100%' }}
                  placeholder="e.g. gehan.safwat@msa.edu.eg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>
                  Account Password
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Verified via Secure Backend Hash
                </span>
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
              {loading ? 'Authenticating with Database...' : 'Sign In to Academic Portal'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Email Pre-Fill (Helper for faculty, leaves password to user input) */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                fontWeight: 700,
              }}>
                Pre-Fill Account Email:
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} /> {ALL_FACULTY_STAFF.length} Faculty Accounts
              </span>
            </div>

            {/* Search Filter for Quick Pre-fill */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search all 92 staff by name, academic rank, or email..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  padding: '6px 10px 6px 28px',
                  height: '34px',
                  borderRadius: '8px'
                }}
              />
              <Search size={14} style={{ position: 'absolute', left: '9px', top: '10px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '100%', fontSize: '0.825rem', padding: '8px 12px', cursor: 'pointer' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            >
              <option value="">-- Choose from all {filteredStaff.length} Faculty Staff Accounts --</option>
              {leadershipStaff.length > 0 && (
                <optgroup label={`👑 Super Administrative Leadership (${leadershipStaff.length})`}>
                  {leadershipStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.id === 99 ? '👑 Admin — Higher Super Admin' : s.id === 6496 ? '👑 Prof. Dr. Gehan Safwat — Dean of Faculty (Super Admin)' : '⭐ Prof. Dr. Amr Ageez — Vice Dean for Academic Affairs (Super Admin)'} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {professorStaff.length > 0 && (
                <optgroup label={`🎓 Professors & Associate Professors (${professorStaff.length})`}>
                  {professorStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {doctorStaff.length > 0 && (
                <optgroup label={`🔬 Lecturers & Ph.D. Doctors (${doctorStaff.length})`}>
                  {doctorStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {laStaff.length > 0 && (
                <optgroup label={`🧬 Lecturer Assistants (LA) (${laStaff.length})`}>
                  {laStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {taStaff.length > 0 && (
                <optgroup label={`📚 Teaching Assistants (TA) (${taStaff.length})`}>
                  {taStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {raN112Staff.length > 0 && (
                <optgroup label={`🧪 RA N112 (${raN112Staff.length})`}>
                  {raN112Staff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {prototypingRaStaff.length > 0 && (
                <optgroup label={`🔬 Prototyping RA (${prototypingRaStaff.length})`}>
                  {prototypingRaStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {adminStaff.length > 0 && (
                <optgroup label={`📋 Academic Administration (${adminStaff.length})`}>
                  {adminStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.full_name} — {s.rank} — {s.email}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.5,
            }}>
              Credentials are authenticated against the encrypted Cloudflare D1 SQL database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
