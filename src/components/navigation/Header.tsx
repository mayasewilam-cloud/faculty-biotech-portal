'use client';

import React from 'react';
import { User, Task, ActivityLog } from '@/types';
import { Sun, Moon, LogOut, Smartphone, UserCheck } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface HeaderProps {
  currentUser: User | null;
  isSuperAdmin: boolean;
  isDean: boolean;
  isImpersonating: boolean;
  adminUser: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  leadershipUsers: any[];
  profUsers: any[];
  drUsers: any[];
  laUsers: any[];
  taUsers: any[];
  raN112Users: any[];
  prototypingRaUsers: any[];
  adminCadreUsers: any[];
  onSwitchUser: (userId: number) => void;
  onRevertAdmin: () => void;
  tasks?: Task[];
  logs?: ActivityLog[];
  onSelectTask?: (task: Task) => void;
  isMobilePreview?: boolean;
  onToggleMobilePreview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isSuperAdmin,
  isDean,
  isImpersonating,
  adminUser,
  theme,
  onToggleTheme,
  onLogout,
  leadershipUsers,
  profUsers,
  drUsers,
  laUsers,
  taUsers,
  raN112Users,
  prototypingRaUsers,
  adminCadreUsers,
  onSwitchUser,
  onRevertAdmin,
  tasks = [],
  logs = [],
  onSelectTask,
  isMobilePreview = false,
  onToggleMobilePreview,
}) => {
  return (
    <header
      className="dashboard-header"
      style={{
        position: 'sticky',
        top: isImpersonating ? 45 : 0,
        zIndex: 50,
        padding: '10px 24px',
        backgroundColor: 'var(--header-bg, var(--bg-surface))',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="header-content"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Brand with Official Logos - Clean & Prestigious */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: '8px',
              background: '#ffffff',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
            }}
          >
            <img
              src="/logos/msa-university.jpeg"
              alt="MSA University"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ width: '1px', height: '22px', background: '#cbd5e1' }} />
            <img
              src="/logos/faculty-of-biotechnology.jpeg"
              alt="Faculty of Biotechnology"
              style={{ height: '32px', width: 'auto', objectFit: 'contain', borderRadius: '50%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
              MSA UNIVERSITY
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>•</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-gold, #d97706)' }}>
              Faculty of Biotechnology
            </span>
          </div>
        </div>

        {/* Clean Controls & Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Account Switcher (For Super Admin) - Clean & Minimal */}
          {isSuperAdmin ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-inset)',
                padding: '3px 8px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <UserCheck size={14} style={{ color: 'var(--text-secondary)' }} />
              <select
                className="form-select"
                style={{
                  padding: '3px 6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  maxWidth: '220px',
                  outline: 'none',
                }}
                value={currentUser?.id}
                onChange={(e) => onSwitchUser(Number(e.target.value))}
                title="Switch active user view"
              >
                <option value={currentUser?.id}>
                  {currentUser?.full_name || 'Select Account'}
                </option>
                <optgroup label="Leadership">
                  {leadershipUsers.filter((u) => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.title || u.role})
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`Professors & Assoc. Professors (${profUsers.length})`}>
                  {profUsers.filter((u) => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`Lecturers (${drUsers.length})`}>
                  {drUsers.filter((u) => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`Teaching Staff & RAs (${laUsers.length + taUsers.length + raN112Users.length + prototypingRaUsers.length})`}>
                  {[...laUsers, ...taUsers, ...raN112Users, ...prototypingRaUsers]
                    .filter((u) => u.id !== currentUser?.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} — {u.title || 'Staff'}
                      </option>
                    ))}
                </optgroup>
                <optgroup label={`Academic Administration (${adminCadreUsers.length})`}>
                  {adminCadreUsers.filter((u) => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          ) : isImpersonating ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(37, 99, 235, 0.1)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                {currentUser?.full_name}
              </span>
              <button
                onClick={onRevertAdmin}
                style={{
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Exit
              </button>
            </div>
          ) : null}

          {/* Real-time In-App Notification Center */}
          <NotificationCenter
            currentUser={currentUser}
            tasks={tasks}
            logs={logs}
            onSelectTask={onSelectTask}
          />

          {/* Mobile Preview Toggle (Sleek Icon Button) */}
          {onToggleMobilePreview && (
            <button
              onClick={onToggleMobilePreview}
              className="btn btn-secondary btn-sm"
              title={isMobilePreview ? 'Exit Mobile Preview' : 'Mobile Preview'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 9px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isMobilePreview ? 'rgba(37, 99, 235, 0.15)' : undefined,
                borderColor: isMobilePreview ? 'var(--accent-blue)' : undefined,
                color: isMobilePreview ? 'var(--accent-blue)' : 'var(--text-secondary)',
              }}
            >
              <Smartphone size={16} />
            </button>
          )}

          {/* Light / Dark Mode Toggle (Sleek Icon Button) */}
          <button
            onClick={onToggleTheme}
            className="btn btn-secondary btn-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 9px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} />}
          </button>

          {/* User Profile Avatar & Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '6px',
              borderLeft: '1px solid var(--border)',
            }}
          >
            <div
              title={currentUser?.full_name || 'User Profile'}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.78rem',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
            >
              {currentUser?.full_name
                ? currentUser.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              title="Log Out"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 8px',
                color: '#ef4444',
                borderColor: 'transparent',
                background: 'transparent',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
