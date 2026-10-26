'use client';

import React, { useState } from 'react';
import { User, Task, ActivityLog } from '@/types';
import { Sun, Moon, LogOut, Smartphone, UserCheck, Key, BellRing } from 'lucide-react';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { playNotificationChime } from '@/lib/audioChime';

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
  onSwitchUser?: (userId: number) => void;
  onRevertAdmin?: () => void;
  tasks?: Task[];
  logs?: ActivityLog[];
  onSelectTask?: (task: Task) => void;
  isMobilePreview?: boolean;
  onToggleMobilePreview?: () => void;
  onChangePassword?: () => void;
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
  onChangePassword,
}) => {
  const [isSendingPush, setIsSendingPush] = useState(false);

  const handleSendPushToPhone = async () => {
    try {
      setIsSendingPush(true);
      if (typeof window !== 'undefined') {
        playNotificationChime();
        if ('Notification' in window) {
          let perm = Notification.permission;
          if (perm !== 'granted') {
            perm = await Notification.requestPermission();
          }
          if (perm === 'granted') {
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                reg.showNotification('Faculty of Biotechnology Portal', {
                  body: `Hello ${currentUser?.full_name || 'Prof. Dr. Gehan'}! Your phone is now actively receiving real-time task directives and Dean announcements.`,
                  icon: '/icon-192.png',
                  badge: '/icon-192.png',
                  vibrate: [200, 100, 200],
                  tag: 'faculty-phone-alert',
                } as any);
              } else {
                new Notification('Faculty of Biotechnology Portal', {
                  body: `Hello ${currentUser?.full_name || 'Prof. Dr. Gehan'}! Your phone alert system is connected.`,
                  icon: '/icon-192.png',
                });
              }
            } else {
              new Notification('Faculty of Biotechnology Portal', {
                body: `Hello ${currentUser?.full_name || 'Prof. Dr. Gehan'}! Direct alert dispatched successfully.`,
              });
            }
          } else {
            alert('Please allow Notifications in your mobile browser settings to receive alerts directly on your device.');
            return;
          }
        }
      }

      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Direct Faculty Mobile Alert',
          body: `Live mobile push sent directly to ${currentUser?.full_name || 'your device'}.`,
          userId: currentUser?.id,
        }),
      });

      alert('🔔 Live notification sent directly to your phone screen!');
    } catch (e: any) {
      alert('Notification notice: ' + e.message);
    } finally {
      setIsSendingPush(false);
    }
  };

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
          {/* Active Logged-in User Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-inset)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentUser?.full_name || 'Faculty Member'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({currentUser?.title || currentUser?.role || 'Staff'})
            </span>
          </div>

          {/* Direct Mobile Phone Notification Button */}
          <button
            type="button"
            onClick={handleSendPushToPhone}
            disabled={isSendingPush}
            className="btn btn-secondary btn-sm"
            title="Push Notification Directly to My Phone Screen"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '6px 11px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              borderColor: 'rgba(16, 185, 129, 0.35)',
              color: '#10b981',
              cursor: 'pointer',
            }}
          >
            <BellRing size={15} color="#10b981" />
            <span>{isSendingPush ? 'Sending...' : 'Push to Phone'}</span>
          </button>

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

            {onChangePassword && (
              <button
                onClick={onChangePassword}
                className="btn btn-secondary btn-sm"
                title="Change Password"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 8px',
                  color: 'var(--accent-blue)',
                  borderColor: 'transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Key size={16} />
              </button>
            )}

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
