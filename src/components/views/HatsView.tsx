'use client';

import React, { useState } from 'react';
import { Hat, Task, User } from '@/types';
import { Plus, Search, Trash2, Send, Eye, Users, Shield, Briefcase } from 'lucide-react';

interface HatsViewProps {
  hats: Hat[];
  tasks: Task[];
  currentUser: User | null;
  hatSearchQuery: string;
  setHatSearchQuery: (val: string) => void;
  onOpenCreateHat: () => void;
  onOpenEditHat: (hat: Hat) => void;
  onDeleteHat: (hatId: number, hatName: string) => void;
  onQuickDispatchToHat: (hat: Hat) => void;
  onOpenAddMember: (hat: Hat) => void;
  onRemoveMemberFromHat: (hatId: number, userId: number, userName: string, hatName: string) => void;
  onViewHatTasks: (hatId: number) => void;
}

function getHatCategory(name: string): 'operational' | 'specialized' {
  const lower = name.toLowerCase();
  if (lower.includes('ra ') || lower.includes('prototyping') || lower.includes('lab') || lower.includes('advising') || lower.includes('assistant')) {
    return 'operational';
  }
  return 'specialized';
}

export const HatsView: React.FC<HatsViewProps> = ({
  hats,
  tasks,
  currentUser,
  hatSearchQuery,
  setHatSearchQuery,
  onOpenCreateHat,
  onOpenEditHat,
  onDeleteHat,
  onQuickDispatchToHat,
  onOpenAddMember,
  onRemoveMemberFromHat,
  onViewHatTasks,
}) => {
  const [hatTypeFilter, setHatTypeFilter] = useState<'all' | 'operational' | 'specialized'>('all');

  const operationalCount = hats.filter(h => getHatCategory(h.name) === 'operational').length;
  const specializedCount = hats.filter(h => getHatCategory(h.name) === 'specialized').length;
  return (
    <div>
      {/* Header / Intro Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '120px', opacity: 0.05, pointerEvents: 'none', userSelect: 'none' }}>
          🎩
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>🎩</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Task Operational Hats (قبعات المهام التنفيذية)</h3>
              <span style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: 'var(--status-revision)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '999px'
              }}>
                {hats.length} Active Task Hats
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Operational functional roles attached directly to tasks (e.g. RA N112, Prototyping RA, Course Coordinator, Lab Practical Lead). Faculty and staff wear these operational hats to organize task distribution, filter individual workloads, and track deliverables in real time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={onOpenCreateHat}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderColor: '#7c3aed',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
                padding: '10px 18px'
              }}
            >
              <Plus size={18} />
              <span>Create New Task Hat</span>
            </button>
          </div>
        </div>

        {/* Search Bar for Hats */}
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.85rem' }}
              placeholder="Search task hats, operational roles, or member names..."
              value={hatSearchQuery}
              onChange={(e) => setHatSearchQuery(e.target.value)}
            />
            {hatSearchQuery && (
              <button
                onClick={() => setHatSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            )}
          </div>
          {hatSearchQuery && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Found {hats.filter(h => 
                h.name.toLowerCase().includes(hatSearchQuery.toLowerCase()) || 
                (h.description || '').toLowerCase().includes(hatSearchQuery.toLowerCase()) ||
                h.members?.some(m => m.user_name.toLowerCase().includes(hatSearchQuery.toLowerCase()))
              ).length} matches
            </span>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${hatTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setHatTypeFilter('all')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            All Task Hats ({hats.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${hatTypeFilter === 'operational' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setHatTypeFilter('operational')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🧪 Operational Cadres ({operationalCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${hatTypeFilter === 'specialized' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setHatTypeFilter('specialized')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            ⚡ Functional Roles ({specializedCount})
          </button>
        </div>
      </div>

      {/* Hats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '22px' }}>
        {(hats || [])
          .filter(h => {
            if (hatTypeFilter !== 'all' && getHatCategory(h.name) !== hatTypeFilter) return false;
            if (!hatSearchQuery.trim()) return true;
            const q = hatSearchQuery.toLowerCase();
            return (
              h.name.toLowerCase().includes(q) ||
              (h.description || '').toLowerCase().includes(q) ||
              h.members?.some(m => m.user_name.toLowerCase().includes(q) || (m.role_in_hat || '').toLowerCase().includes(q))
            );
          })
          .map((hat) => {
            const isUserMember = hat.members?.some(m => m.user_id === currentUser?.id);
            const hatTasks = tasks.filter(t => t.hat_id === hat.id);

            return (
              <div
                key={hat.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: `4px solid ${hat.color || '#8b5cf6'}`,
                  position: 'relative'
                }}
              >
                {/* Top Bar of Hat Card */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: `${hat.color || '#8b5cf6'}22`,
                        border: `1px solid ${hat.color || '#8b5cf6'}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        flexShrink: 0
                      }}>
                        {hat.icon || '🎓'}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '3px' }}>
                          {hat.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: getHatCategory(hat.name) === 'operational' ? 'var(--status-progress-bg)' : 'var(--status-done-bg)',
                            color: getHatCategory(hat.name) === 'operational' ? 'var(--status-progress)' : 'var(--status-done)',
                            border: `1.5px solid ${getHatCategory(hat.name) === 'operational' ? 'var(--status-progress-border)' : 'var(--status-done-border)'}`,
                          }}>
                            {getHatCategory(hat.name) === 'operational' ? '🧪 Operational Cadre' : '⚡ Functional Role'}
                          </span>
                          <span style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: 'var(--bg-inset)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)'
                          }}>
                            👥 {hat.members?.length || 0} Members
                          </span>
                          {hatTasks.length > 0 && (
                            <span className="tag-cat tag-cat-prof" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              📋 {hatTasks.length} Dispatched Tasks
                            </span>
                          )}
                          {isUserMember && (
                            <span className="tag-cat tag-cat-ta" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                              ✓ You are a Member
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hat Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => onOpenEditHat(hat)}
                        style={{
                          background: 'var(--bg-inset)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                        title="Edit Hat Group"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteHat(hat.id, hat.name)}
                        style={{
                          background: 'var(--status-overdue-bg)',
                          border: '1px solid var(--status-overdue-border)',
                          color: 'var(--status-overdue)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                        }}
                        title="Delete Hat Group"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                    marginBottom: '18px',
                    background: 'var(--bg-inset)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    {hat.description || 'Dedicated faculty taskforce committee.'}
                  </p>

                  {/* Action Buttons for Dispatching & Adding Members */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onQuickDispatchToHat(hat)}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        padding: '8px 16px'
                      }}
                    >
                      <Send size={15} />
                      <span>Dispatch Task to this Hat</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onOpenAddMember(hat)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        padding: '8px 14px'
                      }}
                    >
                      <Plus size={15} />
                      <span>Add Member</span>
                    </button>

                    {hatTasks.length > 0 && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewHatTasks(hat.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          padding: '8px 14px',
                          color: 'var(--accent-blue)'
                        }}
                      >
                        <Eye size={15} />
                        <span>View Tasks ({hatTasks.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Members Roster Section */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '8px'
                    }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Committee Members ({hat.members?.length || 0})
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Academic & Admin Rank
                      </span>
                    </div>

                    {(!hat.members || hat.members.length === 0) ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '24px 12px',
                        background: 'var(--bg-inset)',
                        borderRadius: '8px',
                        border: '1px dashed var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem'
                      }}>
                        <Users size={24} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
                        <p style={{ fontWeight: 600 }}>No members assigned to this Hat yet.</p>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenAddMember(hat)}
                          style={{ marginTop: '8px', fontSize: '0.825rem', fontWeight: 700 }}
                        >
                          + Add First Member
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '280px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                      }}>
                        {hat.members.map((member, mIdx) => (
                          <div
                            key={member.id ? `member-${member.id}` : `hat-${hat.id}-user-${member.user_id}-${mIdx}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: 'var(--bg-inset)',
                              borderRadius: '8px',
                              border: '1px solid var(--border)',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <img
                                src={member.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt={member.user_name}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                  color: 'var(--text-main)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {member.user_title ? `${member.user_title} ` : ''}{member.user_name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginTop: '2px' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {member.user_title || member.user_role}
                                  </span>
                                  <span style={{ color: 'var(--border)' }}>•</span>
                                  <span className="tag-cat tag-cat-la" style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                    {member.role_in_hat}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Remove member button */}
                            <button
                              onClick={() => onRemoveMemberFromHat(hat.id, member.user_id, member.user_name, hat.name)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                borderRadius: '4px',
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                              title={`Remove ${member.user_name} from ${hat.name}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.725rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>Created: {new Date(hat.created_at).toLocaleDateString()}</span>
                  <span>{hat.members?.length || 0} Faculty Appointed</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
