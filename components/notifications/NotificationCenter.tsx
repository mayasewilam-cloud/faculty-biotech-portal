'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Task, ActivityLog } from '@/types';
import {
  Bell,
  BellRing,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Mail,
  Smartphone,
} from 'lucide-react';
import { playNotificationChime } from '@/lib/audioChime';
import { isUserAssignedToTask } from '@/lib/taskFilters';

interface NotificationItem {
  id: string;
  type: 'alarm' | 'deadline' | 'sign_off' | 'assignment' | 'log';
  title: string;
  description: string;
  timestamp: string;
  task?: Task;
  severity: 'urgent' | 'warning' | 'info' | 'success';
}

interface NotificationCenterProps {
  currentUser: User | null;
  tasks: Task[];
  logs: ActivityLog[];
  onSelectTask?: (task: Task) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  tasks,
  logs,
  onSelectTask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'alarms' | 'sign_off' | 'tasks'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isSendingPush, setIsSendingPush] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSendTestMobilePush = async () => {
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
            try {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                  reg.showNotification('Faculty Portal Direct Alert', {
                    body: `Hello ${currentUser?.full_name || 'Faculty Member'}, your device is connected for instant academic push alerts!`,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'faculty-portal-test',
                    vibrate: [200, 100, 200],
                  } as NotificationOptions);
                } else {
                  new Notification('Faculty Portal Direct Alert', {
                    body: `Hello ${currentUser?.full_name || 'Faculty Member'}, mobile push active!`,
                    icon: '/favicon.ico',
                  });
                }
              } else {
                new Notification('Faculty Portal Direct Alert', {
                  body: `Hello ${currentUser?.full_name || 'Faculty Member'}, mobile push active!`,
                  icon: '/favicon.ico',
                });
              }
            } catch (swErr) {
              console.warn('Native notification fallback:', swErr);
            }
          }
        }
      }

      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: currentUser?.id || 'all',
          title: 'Direct Phone Alert',
          body: `Academic notification dispatched to ${currentUser?.full_name || 'your device'}.`,
        }),
      });

      alert('📱 Push Notification sent directly to your phone/browser!');
    } catch (err: any) {
      console.error('Error dispatching mobile push:', err);
      alert('Mobile push dispatched! Please ensure browser notification permissions are allowed.');
    } finally {
      setIsSendingPush(false);
    }
  };

  const isDean = currentUser?.role === 'dean' || currentUser?.role === 'admin' || currentUser?.id === 99 || currentUser?.id === 6496;

  // Load read notification IDs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      try {
        const stored = localStorage.getItem(`msa_notifications_read_${currentUser.id}`);
        if (stored) {
          setReadIds(new Set(JSON.parse(stored)));
        }
        const storedSound = localStorage.getItem('msa_notifications_sound');
        if (storedSound !== null) {
          setSoundEnabled(storedSound === 'true');
        }
      } catch {
        // Fallback
      }
    }
  }, [currentUser?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Derive notifications feed from tasks and activity logs
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];
    const now = new Date();
    const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 1. Process tasks relevant to current user (supports multi-assignee tasks)
    const relevantTasks = isDean
      ? tasks
      : tasks.filter((t) => isUserAssignedToTask(t, currentUser));

    relevantTasks.forEach((t) => {
      const deadlineDate = t.deadline ? new Date(t.deadline) : null;

      // Overdue alarm
      if (t.status !== 'done' && deadlineDate && deadlineDate < now) {
        list.push({
          id: `task-overdue-${t.id}`,
          type: 'alarm',
          title: `Deadline Overdue: ${t.title}`,
          description: `Due on ${deadlineDate.toLocaleDateString('en-GB')}. Assigned to ${t.assignee_name || 'Faculty Member'}.`,
          timestamp: t.deadline,
          task: t,
          severity: 'urgent',
        });
      }
      // Upcoming deadline alarm (< 48 hours)
      else if (t.status !== 'done' && deadlineDate && deadlineDate <= fortyEightHoursFromNow && deadlineDate >= now) {
        list.push({
          id: `task-deadline-${t.id}`,
          type: 'deadline',
          title: `Upcoming Deadline (48h): ${t.title}`,
          description: `Due on ${deadlineDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}. Priority: ${(t.priority || 'medium').toUpperCase()}.`,
          timestamp: t.deadline,
          task: t,
          severity: 'warning',
        });
      }

      // Dean official sign-off certificate
      if (t.dean_acknowledged) {
        list.push({
          id: `task-signoff-${t.id}`,
          type: 'sign_off',
          title: `Dean Verified & Signed-Off: ${t.title}`,
          description: `Official accreditation sign-off issued by Prof. Dr. Gehan Safwat.`,
          timestamp: t.completed_at || t.updated_at || t.created_at,
          task: t,
          severity: 'success',
        });
      }

      // Active task assignment for user
      if (t.status !== 'done') {
        list.push({
          id: `task-assigned-${t.id}`,
          type: 'assignment',
          title: `Task Mandate: ${t.title}`,
          description: `Priority ${(t.priority || 'medium').toUpperCase()} • Due: ${deadlineDate ? deadlineDate.toLocaleDateString('en-GB') : 'Open'}`,
          timestamp: t.created_at || t.updated_at || new Date().toISOString(),
          task: t,
          severity: t.priority === 'urgent' ? 'urgent' : 'info',
        });
      }
    });

    // 2. Add recent activity logs (including direct TASK_ASSIGNED alerts)
    logs.slice(0, 30).forEach((l) => {
      const isAssigned = (l.action_type || '').toLowerCase() === 'task_assigned';
      if (isAssigned && (l.user_id === currentUser?.id || isDean)) {
        list.push({
          id: `log-task-assigned-${l.id}`,
          type: 'assignment',
          title: l.title,
          description: l.details || 'New task directive assigned.',
          timestamp: l.created_at || new Date().toISOString(),
          severity: 'urgent',
        });
      } else if ((l.action_type || '').toLowerCase() === 'email_dispatched') {
        list.push({
          id: `log-email-${l.id}`,
          type: 'log',
          title: l.title,
          description: l.details || 'Formal academic directive dispatched.',
          timestamp: l.created_at || new Date().toISOString(),
          severity: 'info',
        });
      }
    });

    // Sort by timestamp descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tasks, logs, currentUser?.id, isDean]);

  // Unread items
  const unreadItems = notifications.filter((n) => !readIds.has(n.id));
  const unreadCount = unreadItems.length;

  const markAsRead = (id: string) => {
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    if (currentUser?.id) {
      localStorage.setItem(`msa_notifications_read_${currentUser.id}`, JSON.stringify(Array.from(updated)));
    }
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    if (currentUser?.id) {
      localStorage.setItem(`msa_notifications_read_${currentUser.id}`, JSON.stringify(Array.from(allIds)));
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('msa_notifications_sound', String(next));
    if (next) {
      playNotificationChime();
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'alarms') return n.type === 'alarm' || n.type === 'deadline';
    if (activeFilter === 'sign_off') return n.type === 'sign_off';
    if (activeFilter === 'tasks') return n.type === 'assignment';
    return true;
  });

  const getSeverityBadge = (severity: NotificationItem['severity']) => {
    switch (severity) {
      case 'urgent':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'success':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button with Unread Badge */}
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          if (!isOpen && soundEnabled && unreadCount > 0) {
            playNotificationChime();
          }
          setIsOpen(!isOpen);
        }}
        title="Notifications"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 9px',
          borderRadius: '8px',
          background: unreadCount > 0 ? 'rgba(239, 68, 68, 0.12)' : undefined,
          borderColor: unreadCount > 0 ? 'rgba(239, 68, 68, 0.35)' : undefined,
          color: unreadCount > 0 ? '#ef4444' : 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        {unreadCount > 0 ? <BellRing size={16} color="#ef4444" /> : <Bell size={16} />}

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '999px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)',
              minWidth: '16px',
              textAlign: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div
          className="glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '380px',
            maxWidth: '92vw',
            maxHeight: '520px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
            zIndex: 1300,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Academic Alerts
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Mute Alert Chime' : 'Enable Alert Chime'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: soundEnabled ? '#60a5fa' : '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filter Tabs & Mark All as Read */}
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['all', 'alarms', 'sign_off', 'tasks'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setActiveFilter(filterKey)}
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeFilter === filterKey ? '#2563eb' : 'transparent',
                    color: activeFilter === filterKey ? '#ffffff' : 'var(--text-secondary)',
                    textTransform: 'capitalize',
                  }}
                >
                  {filterKey === 'sign_off' ? 'Sign-Offs' : filterKey}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Quick Direct Mobile Push Trigger */}
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={13} color="#60a5fa" />
              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600 }}>
                Mobile Direct Alert
              </span>
            </div>
            <button
              type="button"
              onClick={handleSendTestMobilePush}
              disabled={isSendingPush}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 9px',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: isSendingPush ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.3)',
              }}
            >
              {isSendingPush ? 'Sending...' : '📱 Push to Phone'}
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', opacity: 0.3, color: '#10b981' }} />
                <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>All Caught Up!</p>
                <p style={{ fontSize: '0.75rem', margin: '4px 0 0' }}>No pending academic alerts or overdue tasks.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredNotifications.map((n) => {
                  const isRead = readIds.has(n.id);
                  const badgeStyle = getSeverityBadge(n.severity);

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.task && onSelectTask) {
                          onSelectTask(n.task);
                          setIsOpen(false);
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(59, 130, 246, 0.08)',
                        border: isRead ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(59, 130, 246, 0.25)',
                        cursor: n.task ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                      className="notification-item-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {n.type === 'alarm' ? (
                            <AlertTriangle size={14} color="#f87171" />
                          ) : n.type === 'deadline' ? (
                            <Clock size={14} color="#fbbf24" />
                          ) : n.type === 'sign_off' ? (
                            <ShieldCheck size={14} color="#34d399" />
                          ) : n.type === 'log' ? (
                            <Mail size={14} color="#60a5fa" />
                          ) : (
                            <Sparkles size={14} color="#a78bfa" />
                          )}
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: isRead ? 600 : 800,
                              color: isRead ? 'var(--text-main)' : '#f8fafc',
                              lineHeight: 1.3,
                            }}
                          >
                            {n.title}
                          </span>
                        </div>

                        {!isRead && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: '#3b82f6',
                              flexShrink: 0,
                              marginTop: '4px',
                            }}
                          ></span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: '0.725rem',
                          color: 'var(--text-muted)',
                          margin: '4px 0 0 20px',
                          lineHeight: 1.35,
                        }}
                      >
                        {n.description}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '6px',
                          marginLeft: '20px',
                        }}
                      >
                        <span style={{ fontSize: '0.675rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                          {new Date(n.timestamp).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {n.task && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              color: '#60a5fa',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                          >
                            <span>Inspect</span>
                            <ChevronRight size={11} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Live Audit & Push Sync Active</span>
            <button
              type="button"
              onClick={playNotificationChime}
              style={{
                background: 'none',
                border: 'none',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              Test Chime 🔔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
