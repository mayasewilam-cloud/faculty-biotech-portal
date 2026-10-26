'use client';

import React, { useState, useMemo } from 'react';
import { Task, Hat } from '@/types';
import { INSTITUTIONAL_PILLARS, InstitutionalPillar } from '@/lib/pillar_catalog';
import {
  ShieldCheck,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AccreditationRadarChartProps {
  tasks: Task[];
  hats?: Hat[];
  onSelectTask?: (task: Task) => void;
  className?: string;
}

export interface PillarScoreData {
  pillar: InstitutionalPillar;
  score: number; // 0 - 100
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  deanVerifiedCount: number;
  matchedTasks: Task[];
  gaps: string[];
}

export const AccreditationRadarChart: React.FC<AccreditationRadarChartProps> = ({
  tasks,
  hats = [],
  onSelectTask,
}) => {
  const [selectedPillarCode, setSelectedPillarCode] = useState<string | null>(null);
  const [hoveredPillarCode, setHoveredPillarCode] = useState<string | null>(null);

  // Compute stats and compliance scores for all 12 pillars
  const pillarScores: PillarScoreData[] = useMemo(() => {
    return INSTITUTIONAL_PILLARS.map((pillar) => {
      const taskTitles = pillar.tasks.map((t) => t.title.toLowerCase());
      const matched = tasks.filter((t) => {
        if (t.pillar_code && t.pillar_code.toUpperCase() === pillar.code) return true;
        const titleLower = (t.title || '').toLowerCase();
        const descLower = (t.description || '').toLowerCase();
        return taskTitles.some((templateTitle) => titleLower.includes(templateTitle) || descLower.includes(templateTitle));
      });

      const total = matched.length;
      const completed = matched.filter((t) => t.status === 'done').length;
      const inProgress = matched.filter((t) => t.status === 'in_progress').length;
      const pending = matched.filter((t) => t.status === 'pending').length;
      const overdue = matched.filter((t) => {
        if (t.status === 'done' || !t.deadline) return false;
        return new Date(t.deadline) < new Date();
      }).length;
      const verified = matched.filter((t) => t.dean_acknowledged === 1).length;

      // Calculate weighted score (0 - 100)
      let score = 0;
      const gaps: string[] = [];

      if (total === 0) {
        score = 35; // Baseline institutional readiness but missing dedicated faculty dispatch
        gaps.push(`No active tasks dispatched under Pillar ${pillar.code}. Mandates should be assigned to relevant department.`);
      } else {
        const completionRatio = completed / total;
        const verificationRatio = completed > 0 ? verified / completed : 0;
        const overduePenalty = (overdue / total) * 25;

        // Formula: 60% completion rate + 40% Dean sign-off verification - overdue penalty
        score = Math.round(completionRatio * 60 + verificationRatio * 40 - overduePenalty);
        if (score < 0) score = 0;
        if (score > 100) score = 100;

        if (overdue > 0) {
          gaps.push(`${overdue} mandate(s) currently past deadline. Immediate extension or resolution required.`);
        }
        if (completed > 0 && verified < completed) {
          gaps.push(`${completed - verified} completed task(s) awaiting Dean official accreditation sign-off.`);
        }
        if (pending > 0) {
          gaps.push(`${pending} task(s) still in pending status.`);
        }
      }

      return {
        pillar,
        score,
        totalTasks: total,
        completedTasks: completed,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        overdueTasks: overdue,
        deanVerifiedCount: verified,
        matchedTasks: matched,
        gaps,
      };
    });
  }, [tasks]);

  // Overall Institutional Compliance Index
  const overallIndex = useMemo(() => {
    if (pillarScores.length === 0) return 0;
    const sum = pillarScores.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / pillarScores.length);
  }, [pillarScores]);

  // Overall Critical Gaps count
  const criticalGapsCount = useMemo(() => {
    return pillarScores.filter((p) => p.score < 50 || p.overdueTasks > 0).length;
  }, [pillarScores]);

  const verifiedDeliverablesTotal = useMemo(() => {
    return tasks.filter((t) => t.dean_acknowledged === 1).length;
  }, [tasks]);

  // SVG Geometry Constants for 12-Axis Radar
  const size = 420;
  const center = size / 2;
  const radius = 145;
  const numAxes = pillarScores.length; // 12

  // Concentric levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  // Helper to convert polar to cartesian
  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / numAxes;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Generate radar polygon points
  const polygonPoints = pillarScores
    .map((p, idx) => {
      const ratio = p.score / 100;
      const coords = getCoordinates(idx, ratio);
      return `${coords.x},${coords.y}`;
    })
    .join(' ');

  const activePillarData = pillarScores.find(
    (p) => p.pillar.code === (selectedPillarCode || hoveredPillarCode)
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* ── KPI EXECUTIVE READINESS SUMMARY ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: NAQAAE Readiness Index */}
        <div
          className="glass-card"
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.5) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
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
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              NAQAAE Readiness Index
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc' }}>
                {overallIndex}%
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: overallIndex >= 80 ? '#34d399' : overallIndex >= 60 ? '#fbbf24' : '#f87171' }}>
                {overallIndex >= 80 ? 'Grade A (Accreditation Ready)' : overallIndex >= 60 ? 'Grade B (Substantial)' : 'Grade C (Action Needed)'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Compliant Pillars */}
        <div
          className="glass-card"
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Compliant Pillars (&ge;70%)
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#34d399' }}>
                {pillarScores.filter((p) => p.score >= 70).length}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                of 12 Institutional Pillars
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Critical Gaps Detected */}
        <div
          className="glass-card"
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Pillars Requiring Attention
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: criticalGapsCount > 0 ? '#f87171' : '#34d399' }}>
                {criticalGapsCount}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {criticalGapsCount === 0 ? 'Zero Gaps Detected' : 'Institutional Gaps'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Verified Deliverables */}
        <div
          className="glass-card"
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Verified Deliverables
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24' }}>
                {verifiedDeliverablesTotal}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Dean Sign-Off Seals Issued
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN RADAR + PILLAR DETAILS DUAL SECTION ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 460px) 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: 12-AXIS SVG RADAR WEB */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              12-Pillar NAQAAE Compliance Radar
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px' }}>
              Click vertex to inspect
            </span>
          </div>

          <svg
            viewBox={`0 0 ${size} ${size}`}
            style={{ width: '100%', maxWidth: '380px', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.25" />
              </linearGradient>
              <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric Grid Web Polygons */}
            {levels.map((level) => {
              const ringPoints = Array.from({ length: numAxes })
                .map((_, i) => {
                  const c = getCoordinates(i, level);
                  return `${c.x},${c.y}`;
                })
                .join(' ');

              return (
                <g key={level}>
                  <polygon
                    points={ringPoints}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray={level < 1 ? '3 3' : 'none'}
                  />
                  {/* Percentage label */}
                  <text
                    x={center}
                    y={center - radius * level - 3}
                    textAnchor="middle"
                    fill="rgba(255, 255, 255, 0.3)"
                    fontSize="8"
                    fontWeight="600"
                  >
                    {Math.round(level * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Radial Axis Lines */}
            {Array.from({ length: numAxes }).map((_, i) => {
              const outer = getCoordinates(i, 1.0);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled Compliance Radar Polygon */}
            <polygon
              points={polygonPoints}
              fill="url(#radarGradient)"
              stroke="#3b82f6"
              strokeWidth="2.5"
              filter="url(#radarGlow)"
            />

            {/* Vertices & Axis Labels */}
            {pillarScores.map((p, i) => {
              const ratio = p.score / 100;
              const vertex = getCoordinates(i, ratio);
              const labelPos = getCoordinates(i, 1.18);
              const isSelected = selectedPillarCode === p.pillar.code;
              const isHovered = hoveredPillarCode === p.pillar.code;

              return (
                <g key={p.pillar.code}>
                  {/* Vertex Circle */}
                  <circle
                    cx={vertex.x}
                    cy={vertex.y}
                    r={isSelected || isHovered ? 6 : 4}
                    fill={p.score >= 70 ? '#34d399' : p.score >= 50 ? '#fbbf24' : '#f87171'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredPillarCode(p.pillar.code)}
                    onMouseLeave={() => setHoveredPillarCode(null)}
                    onClick={() => setSelectedPillarCode(isSelected ? null : p.pillar.code)}
                  />

                  {/* Axis Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected || isHovered ? '#60a5fa' : 'var(--text-secondary)'}
                    fontSize={isSelected || isHovered ? '11' : '9.5'}
                    fontWeight={isSelected || isHovered ? '800' : '700'}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setSelectedPillarCode(isSelected ? null : p.pillar.code)}
                    onMouseEnter={() => setHoveredPillarCode(p.pillar.code)}
                    onMouseLeave={() => setHoveredPillarCode(null)}
                  >
                    {p.pillar.code} ({p.score}%)
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              marginTop: '14px',
              fontSize: '0.725rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399' }}></span>
              <span>&ge;70% (High)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24' }}></span>
              <span>50-69% (Moderate)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f87171' }}></span>
              <span>&lt;50% (Gap Alert)</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSTITUTIONAL SELF-STUDY & PILLAR DRILL-DOWN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activePillarData ? (
            /* Selected / Hovered Pillar Focused Card */
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: '#0f172a',
                border: '1px solid rgba(59, 130, 246, 0.35)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}
                  >
                    {activePillarData.pillar.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge" style={{ background: '#2563eb', color: '#fff', fontWeight: 800 }}>
                        Pillar {activePillarData.pillar.code}
                      </span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        {activePillarData.pillar.name}
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      {activePillarData.pillar.description}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: activePillarData.score >= 70 ? '#34d399' : activePillarData.score >= 50 ? '#fbbf24' : '#f87171' }}>
                    {activePillarData.score}%
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Compliance Score
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '18px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${activePillarData.score}%`,
                    backgroundColor: activePillarData.score >= 70 ? '#10b981' : activePillarData.score >= 50 ? '#f59e0b' : '#ef4444',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                  }}
                ></div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>{activePillarData.totalTasks}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Total Tasks</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>{activePillarData.completedTasks}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Completed</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171' }}>{activePillarData.overdueTasks}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Overdue</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>{activePillarData.deanVerifiedCount}</div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>Verified Seals</div>
                </div>
              </div>

              {/* Actionable Gaps & Recommendations */}
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                  Institutional Gap Analysis & Recommendations:
                </span>
                {activePillarData.gaps.length === 0 ? (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>All standards met. Documentation and verification compliant with NAQAAE criteria.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activePillarData.gaps.map((gap, gIdx) => (
                      <div
                        key={gIdx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#fca5a5',
                          fontSize: '0.775rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          lineHeight: 1.4,
                        }}
                      >
                        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{gap}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Tasks Mini-List */}
              {activePillarData.matchedTasks.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Active Mandates in this Pillar ({activePillarData.matchedTasks.length}):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {activePillarData.matchedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask && onSelectTask(t)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: onSelectTask ? 'pointer' : 'default',
                        }}
                        className="notification-item-hover"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>#{t.id}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {t.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span className={`badge badge-${t.status}`} style={{ fontSize: '0.675rem', padding: '2px 6px' }}>
                            {t.status.replace('_', ' ').toUpperCase()}
                          </span>
                          {t.dean_acknowledged === 1 && (
                            <span title="Dean Officially Verified">
                              <ShieldCheck size={14} color="#34d399" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Default: Pillar Overview Grid */
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                12-Pillars Institutional Compliance Overview
              </h4>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Select any pillar to inspect statutory task allocations, Dean verification certificates, and automated audit gap analysis.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                {pillarScores.map((p) => {
                  const scoreColor = p.score >= 70 ? '#34d399' : p.score >= 50 ? '#fbbf24' : '#f87171';
                  return (
                    <div
                      key={p.pillar.code}
                      onClick={() => setSelectedPillarCode(p.pillar.code)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}
                      className="notification-item-hover"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>{p.pillar.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.775rem', fontWeight: 800, color: '#f8fafc' }}>
                            Pillar {p.pillar.code}
                          </div>
                          <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                            {p.totalTasks} task(s)
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.85rem', fontWeight: 900, color: scoreColor }}>
                        {p.score}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
