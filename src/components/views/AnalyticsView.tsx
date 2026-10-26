'use client';

import React from 'react';
import { AnalyticsData, Task, Hat } from '@/types';
import { Building2, Award, FileText, ArrowRight } from 'lucide-react';
import { AccreditationRadarChart } from '@/components/reports/AccreditationRadarChart';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
  onOpenAccreditationDossier?: () => void;
  tasks?: Task[];
  hats?: Hat[];
  onSelectTask?: (task: Task) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  onOpenAccreditationDossier,
  tasks = [],
  hats = [],
  onSelectTask,
}) => {
  if (!analytics || !Array.isArray(analytics.deptStats) || analytics.deptStats.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        <Building2 size={32} color="#60a5fa" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>Departmental Analytics</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          No analytics data currently available. Please sign in or refresh after dispatching tasks.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── NAQAAE 12-PILLARS ACCREDITATION BANNER ── */}
      {onOpenAccreditationDossier && (
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.4) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                flexShrink: 0,
              }}
            >
              <Award size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Faculty Academic Quality & Performance Review
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                Executive Dean&apos;s institutional evaluation synthesizing academic governance, curriculum delivery, and laboratory readiness.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAccreditationDossier}
            style={{
              padding: '8px 18px',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <FileText size={16} />
            <span>Generate Performance Review</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── NAQAAE 12-PILLARS ACCREDITATION RADAR & SELF-STUDY SYNTHESIS ── */}
      <div style={{ marginBottom: '32px' }}>
        <AccreditationRadarChart
          tasks={tasks}
          hats={hats}
          onSelectTask={onSelectTask}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
          Departmental Cadres & Operations Performance
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Real-time Task Completion & Overdue Monitoring
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {analytics.deptStats.map((dept, idx) => {
          const completionPct = dept.total > 0 ? Math.round((dept.done / dept.total) * 100) : 0;
          return (
            <div key={idx} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={20} color="#60a5fa" />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{dept.department}</h4>
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: completionPct > 70 ? '#10b981' : completionPct > 40 ? '#3b82f6' : '#f59e0b' }}>
                  {completionPct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '999px' }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Total</span>
                  <strong>{dept.total}</strong>
                </div>
                <div>
                  <span style={{ color: '#10b981', display: 'block' }}>Done</span>
                  <strong>{dept.done}</strong>
                </div>
                <div>
                  <span style={{ color: '#60a5fa', display: 'block' }}>In Prog</span>
                  <strong>{dept.in_progress}</strong>
                </div>
                <div>
                  <span style={{ color: dept.overdue > 0 ? '#ef4444' : 'var(--text-muted)', display: 'block' }}>Overdue</span>
                  <strong style={{ color: dept.overdue > 0 ? '#ef4444' : undefined }}>{dept.overdue}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
