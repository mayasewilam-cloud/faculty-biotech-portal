'use client';

import React from 'react';
import { User } from '@/types';

interface ImpersonationBannerProps {
  isImpersonating: boolean;
  currentUser: User | null;
  adminUser: User | null;
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
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  isImpersonating,
  currentUser,
  adminUser,
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
}) => {
  if (!isImpersonating) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
      color: '#ffffff',
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.25rem' }}>👑</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            background: '#fbbf24',
            color: '#78350f',
            fontWeight: 800,
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: '6px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            Super Admin Access Mode
          </span>
          <span style={{ fontSize: '0.875rem' }}>
            You are currently viewing the faculty portal as: <strong>{currentUser?.title} {currentUser?.full_name}</strong> ({currentUser?.role?.toUpperCase()} • {currentUser?.department})
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Switch Account:</span>
          <select
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            value={currentUser?.id}
            onChange={(e) => onSwitchUser(Number(e.target.value))}
          >
            <optgroup label="👑 Super Admin & Leadership">
              {leadershipUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role === 'admin' ? '👑 Admin (Super Admin)' : u.role === 'dean' ? '👑 Dean' : '⭐ Vice Dean'}: {u.full_name}
                </option>
              ))}
            </optgroup>
            <optgroup label={`🏛️ Professors & Assoc. Professors (${profUsers.length})`}>
              {profUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  🏛️ {u.full_name} — {u.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={`🩺 Lecturers (Dr.) (${drUsers.length})`}>
              {drUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  🩺 {u.full_name} — {u.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={`🧬 Lecturer Assistants (LA) (${laUsers.length})`}>
              {laUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  🧬 {u.full_name} — {u.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={`📚 Teaching Assistants (TA) (${taUsers.length})`}>
              {taUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  📚 {u.full_name} — {u.title}
                </option>
              ))}
            </optgroup>
            <optgroup label={`🧪 RA N112 (${raN112Users.length})`}>
              {raN112Users.map((u) => (
                <option key={u.id} value={u.id}>
                  🔬 {u.full_name} (RA N112)
                </option>
              ))}
            </optgroup>
            <optgroup label={`🔬 Prototyping RA (${prototypingRaUsers.length})`}>
              {prototypingRaUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  🧪 {u.full_name} (Prototyping RA)
                </option>
              ))}
            </optgroup>
            <optgroup label={`🏢 Academic Administration (${adminCadreUsers.length})`}>
              {adminCadreUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  💼 {u.full_name} — {u.title}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <button
          onClick={onRevertAdmin}
          style={{
            background: '#ffffff',
            color: '#4f46e5',
            border: 'none',
            padding: '5px 14px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>↩</span> Return to Super Admin ({adminUser?.full_name?.split(' ')[0] || 'Admin'})
        </button>
      </div>
    </div>
  );
};
