'use client';

import React, { useState, useMemo } from 'react';
import { Task, Meeting, Hat, User } from '@/types';
import { isUserAssignedToTask } from '@/lib/taskFilters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MapPin,
  Layers,
  Search,
  Filter,
  Eye,
  Award,
  Star,
  UserCheck
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  meetings: Meeting[];
  hats?: Hat[];
  currentUser?: User | null;
  onSelectTask: (task: Task) => void;
  onSelectMeeting: (meeting: Meeting) => void;
  isDean: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  meetings,
  hats = [],
  currentUser = null,
  onSelectTask,
  onSelectMeeting,
  isDean,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tasks' | 'meetings'>('all');
  const [scopeFilter, setScopeFilter] = useState<'my_tasks' | 'all'>(isDean ? 'all' : 'my_tasks');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: d.toISOString().split('T')[0],
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Count user-specific deadlines
  const myTasksCount = useMemo(() => {
    if (!currentUser) return 0;
    return tasks.filter(t => isUserAssignedToTask(t, currentUser)).length;
  }, [tasks, currentUser]);

  // Filter tasks and meetings
  const filteredEvents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const taskEvents = (typeFilter === 'all' || typeFilter === 'tasks')
      ? tasks.filter((t) => {
          if (scopeFilter === 'my_tasks' && currentUser) {
            const isMine = isUserAssignedToTask(t, currentUser);
            if (!isMine) return false;
          }
          if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
          if (query) {
            const matchTitle = (t.title || '').toLowerCase().includes(query);
            const matchAssignee = (t.assignee_name || '').toLowerCase().includes(query);
            const matchDept = (t.department || '').toLowerCase().includes(query);
            if (!matchTitle && !matchAssignee && !matchDept) return false;
          }
          return !!t.deadline;
        }).map((t) => {
          const isMine = currentUser ? isUserAssignedToTask(t, currentUser) : false;
          return {
            id: `task-${t.id}`,
            originalId: t.id,
            type: 'task' as const,
            title: t.title,
            dateStr: t.deadline ? t.deadline.split('T')[0] : '',
            rawDate: new Date(t.deadline),
            priority: t.priority,
            status: t.status,
            assignee: t.assignee_name,
            department: t.department,
            hat_name: t.hat_name,
            due_time: t.due_time,
            isMine,
            item: t,
          };
        })
      : [];

    const meetingEvents = (typeFilter === 'all' || typeFilter === 'meetings')
      ? meetings.filter((m) => {
          if (scopeFilter === 'my_tasks' && currentUser) {
            const isAttending = m.attendees?.some(a => a.user_id === currentUser.id) || (m.chair && m.chair.includes(currentUser.full_name));
            if (!isAttending) return false;
          }
          if (query) {
            const matchTitle = (m.title || '').toLowerCase().includes(query);
            const matchLocation = (m.location || '').toLowerCase().includes(query);
            const matchHat = (m.hat_name || '').toLowerCase().includes(query);
            if (!matchTitle && !matchLocation && !matchHat) return false;
          }
          return !!m.date;
        }).map((m) => {
          const isMine = currentUser ? m.attendees?.some(a => a.user_id === currentUser.id) || (m.chair && m.chair.includes(currentUser.full_name)) : false;
          return {
            id: `meeting-${m.id}`,
            originalId: m.id,
            type: 'meeting' as const,
            title: m.title,
            dateStr: m.date ? m.date.split('T')[0] : '',
            rawDate: new Date(m.date),
            priority: 'high' as const,
            status: m.status,
            location: m.location,
            hat_name: m.hat_name,
            chair: m.chair,
            isMine,
            item: m,
          };
        })
      : [];

    return [...taskEvents, ...meetingEvents];
  }, [tasks, meetings, typeFilter, priorityFilter, searchQuery, scopeFilter, currentUser]);

  // Group events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof filteredEvents> = {};
    for (const ev of filteredEvents) {
      if (!map[ev.dateStr]) map[ev.dateStr] = [];
      map[ev.dateStr].push(ev);
    }
    return map;
  }, [filteredEvents]);

  // Chronological list for Agenda view
  const chronologicalAgenda = useMemo(() => {
    return [...filteredEvents].sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
  }, [filteredEvents]);

  const todayStr = new Date().toISOString().split('T')[0];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#fca5a5' };
      case 'high':
        return { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', text: '#fcd34d' };
      case 'medium':
        return { bg: 'rgba(59, 130, 246, 0.2)', border: '#3b82f6', text: '#93c5fd' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#6ee7b7' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── HEADER TOOLBAR & MONTH SELECTOR ── */}
      <div
        className="glass-card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {monthName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePrevMonth}
                style={{ padding: '3px 8px' }}
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleToday}
                style={{ fontSize: '0.75rem', padding: '3px 10px' }}
              >
                Today
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleNextMonth}
                style={{ padding: '3px 8px' }}
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', minHeight: '40px', height: '40px', fontSize: '0.92rem' }}
            />
          </div>

          {/* Personal vs Faculty Scope Switcher */}
          {currentUser && (
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <button
                type="button"
                onClick={() => setScopeFilter('my_tasks')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: scopeFilter === 'my_tasks' ? '#10b981' : 'transparent',
                  color: scopeFilter === 'my_tasks' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>⭐ My Due Dates ({myTasksCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: scopeFilter === 'all' ? '#2563eb' : 'transparent',
                  color: scopeFilter === 'all' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>🌐 All Faculty Schedule</span>
              </button>
            </div>
          )}

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            style={{ minHeight: '40px', height: '40px', padding: '6px 14px', fontSize: '0.92rem', width: 'auto', lineHeight: '1.4' }}
          >
            <option value="all">All Events</option>
            <option value="tasks">📋 Tasks Only</option>
            <option value="meetings">🏛️ Meetings Only</option>
          </select>

          {/* Priority Filter */}
          <select
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ minHeight: '40px', height: '40px', padding: '6px 14px', fontSize: '0.92rem', width: 'auto', lineHeight: '1.4' }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🚨 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* View Mode Switcher */}
          <div
            className="cal-view-switcher"
            style={{
              display: 'flex',
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('month')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'month' ? '#2563eb' : 'transparent',
                color: viewMode === 'month' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Month Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: viewMode === 'agenda' ? '#2563eb' : 'transparent',
                color: viewMode === 'agenda' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Agenda Timeline
            </button>
          </div>
        </div>
      </div>

      {/* ── VIEW MODE 1: MONTH GRID ── */}
      {viewMode === 'month' ? (
        <div className="glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
          {/* Weekday headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '6px',
              marginBottom: '6px',
              textAlign: 'center',
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                style={{
                  padding: '8px 0',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.5px',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
              gap: '6px',
            }}
          >
            {calendarDays.map((dayItem, idx) => {
              const dayEvents = eventsByDate[dayItem.dateStr] || [];
              const isToday = dayItem.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`cal-day-cell ${dayItem.isCurrentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''}`}
                >
                  {/* Day Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="cal-day-number">
                      {dayItem.date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--border)',
                          color: 'var(--text-secondary)',
                          padding: '1px 6px',
                          borderRadius: '999px',
                        }}
                      >
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', overflowY: 'auto', maxHeight: '110px' }}>
                    {dayEvents.map((ev) => {
                      if (ev.type === 'meeting') {
                        return (
                          <div
                            key={ev.id}
                            onClick={() => onSelectMeeting(ev.item as Meeting)}
                            className="cal-pill-meeting"
                            style={{
                              padding: '3px 6px',
                              borderRadius: '5px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                            title={`Meeting: ${ev.title}`}
                          >
                            <span>🏛️</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                          </div>
                        );
                      }

                      const isMyTask = (ev as any).isMine;
                      const taskItem = ev.item as Task;
                      const pillClass = isMyTask
                        ? 'cal-pill-my-task'
                        : ev.status === 'done'
                        ? 'cal-pill-task-done'
                        : ev.priority === 'urgent'
                        ? 'cal-pill-task-urgent'
                        : ev.priority === 'high'
                        ? 'cal-pill-task-high'
                        : 'cal-pill-task-medium';

                      return (
                        <div
                          key={ev.id}
                          onClick={() => onSelectTask(taskItem)}
                          className={pillClass}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '5px',
                            fontSize: '0.72rem',
                            fontWeight: isMyTask ? 800 : 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '4px',
                            overflow: 'hidden',
                          }}
                          title={`Task: ${ev.title} (Due: ${taskItem.due_time || 'End of day'})`}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {isMyTask && <span>⭐</span>}
                            <span>{ev.status === 'done' ? '✓ ' : ''}{ev.title}</span>
                          </span>
                          {taskItem.due_time && taskItem.due_time !== 'Not Specified' && (
                            <span style={{ fontSize: '0.62rem', opacity: 0.85, flexShrink: 0 }}>
                              {taskItem.due_time}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── VIEW MODE 2: CHRONOLOGICAL AGENDA TIMELINE ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {chronologicalAgenda.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
              <CalendarIcon size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                No Events Found
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No tasks or meetings match the active filter criteria.
              </p>
            </div>
          ) : (
            chronologicalAgenda.map((ev) => {
              const isPast = ev.rawDate < new Date() && ev.status !== 'done';
              const isToday = ev.dateStr === todayStr;
              const colors = getPriorityColor(ev.priority);

              return (
                <div
                  key={ev.id}
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: ev.type === 'meeting' ? '4px solid #8b5cf6' : `4px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => {
                    if (ev.type === 'meeting') {
                      onSelectMeeting(ev.item as Meeting);
                    } else {
                      onSelectTask(ev.item as Task);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                    {/* Date Badge */}
                    <div
                      className={isToday ? 'cal-date-badge-today' : 'cal-date-badge'}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        flexShrink: 0,
                        minWidth: '65px',
                      }}
                    >
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {ev.rawDate.toLocaleDateString([], { month: 'short' })}
                      </div>
                      <div className="cal-date-badge-number" style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                        {ev.rawDate.getDate()}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span
                          className={
                            ev.type === 'meeting'
                              ? 'cal-pill-meeting'
                              : ev.status === 'done'
                              ? 'cal-pill-task-done'
                              : ev.priority === 'urgent'
                              ? 'cal-pill-task-urgent'
                              : ev.priority === 'high'
                              ? 'cal-pill-task-high'
                              : 'cal-pill-task-medium'
                          }
                          style={{
                            fontSize: '0.675rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {ev.type === 'meeting' ? '🏛️ Council Meeting' : `📋 Task • ${ev.priority.toUpperCase()}`}
                        </span>

                        {(ev as any).isMine && (
                          <span
                            className="cal-pill-my-task"
                            style={{
                              fontSize: '0.675rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <span>⭐</span>
                            <span>My Responsibility {(ev as any).due_time ? `(Due: ${(ev as any).due_time})` : ''}</span>
                          </span>
                        )}

                        {ev.hat_name && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#cbd5e1',
                            }}
                          >
                            🎩 {ev.hat_name}
                          </span>
                        )}

                        {isPast && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(239, 68, 68, 0.18)',
                              color: '#f87171',
                              border: '1px solid #ef4444',
                            }}
                          >
                            🚨 Overdue
                          </span>
                        )}
                      </div>

                      <h4
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          margin: '0 0 4px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ev.title}
                      </h4>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {ev.type === 'meeting' ? (
                          <>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} color="#f59e0b" />
                              <span>{ev.location}</span>
                            </span>
                            <span>Chair: {ev.chair}</span>
                          </>
                        ) : (
                          <>
                            <span>Assignee: <strong>{ev.assignee}</strong></span>
                            <span>•</span>
                            <span>{ev.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
                    >
                      <Eye size={13} />
                      <span>{ev.type === 'meeting' ? 'View MoM' : 'Inspect'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
