'use client';

import React from 'react';
import { ActivityLog } from '@/types';
import { Search, Download, History } from 'lucide-react';

interface LogsViewProps {
  logs: ActivityLog[];
  logSearch: string;
  setLogSearch: (val: string) => void;
  logActionFilter: string;
  setLogActionFilter: (val: string) => void;
  logUserFilter: string;
  setLogUserFilter: (val: string) => void;
  leadershipUsers: any[];
  profUsers: any[];
  drUsers: any[];
  laUsers: any[];
  taUsers: any[];
  raN112Users: any[];
  prototypingRaUsers: any[];
  adminCadreUsers: any[];
  onExportCSV: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({
  logs,
  logSearch,
  setLogSearch,
  logActionFilter,
  setLogActionFilter,
  logUserFilter,
  setLogUserFilter,
  leadershipUsers,
  profUsers,
  drUsers,
  laUsers,
  taUsers,
  raN112Users,
  prototypingRaUsers,
  adminCadreUsers,
  onExportCSV,
}) => {
  return (
    <div>
      {/* Filter Bar for Audit Logs */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '400px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.85rem' }}
              placeholder="Search logs by staff name, action, or details..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
            {/* Action Filter */}
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.85rem', width: 'auto' }}
              value={logActionFilter}
              onChange={(e) => setLogActionFilter(e.target.value)}
            >
              <option value="all">All Action Types</option>
              <option value="TASK_CREATED">Task Dispatched</option>
              <option value="TASK_STATUS_UPDATED">Status Updated</option>
              <option value="TASK_COMPLETED">Task Marked Done</option>
              <option value="TASK_ACKNOWLEDGED">Dean Acknowledged</option>
              <option value="LOGIN">Faculty Logins</option>
              <option value="STAFF_CREATED">Staff Registered</option>
            </select>

            {/* Staff Member Filter */}
            <select
              className="form-select"
              style={{ height: '38px', fontSize: '0.85rem', width: 'auto' }}
              value={logUserFilter}
              onChange={(e) => setLogUserFilter(e.target.value)}
            >
              <option value="all">All Faculty Members</option>
              <optgroup label="👑 Faculty Leadership">
                {leadershipUsers.map((u) => (
                  <option key={u.id} value={u.id}>👑 {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`🏛️ Professors & Assoc. Professors (${profUsers.length})`}>
                {profUsers.map((u) => (
                  <option key={u.id} value={u.id}>🏛️ {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`🩺 Lecturers (Dr.) (${drUsers.length})`}>
                {drUsers.map((u) => (
                  <option key={u.id} value={u.id}>🩺 {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`🧬 Lecturer Assistants (LA) (${laUsers.length})`}>
                {laUsers.map((u) => (
                  <option key={u.id} value={u.id}>🧬 {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`📚 Teaching Assistants (TA) (${taUsers.length})`}>
                {taUsers.map((u) => (
                  <option key={u.id} value={u.id}>📚 {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`🧪 RA N112 (${raN112Users.length})`}>
                {raN112Users.map((u) => (
                  <option key={u.id} value={u.id}>🔬 {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`🔬 Prototyping RA (${prototypingRaUsers.length})`}>
                {prototypingRaUsers.map((u) => (
                  <option key={u.id} value={u.id}>🧪 {u.full_name}</option>
                ))}
              </optgroup>
              <optgroup label={`🏢 Academic Administration (${adminCadreUsers.length})`}>
                {adminCadreUsers.map((u) => (
                  <option key={u.id} value={u.id}>📋 {u.full_name}</option>
                ))}
              </optgroup>
            </select>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onExportCSV}
              style={{ height: '38px' }}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline / Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Exact Timestamp</th>
              <th>Staff Member</th>
              <th>Action Executed</th>
              <th>Action Summary & Target</th>
              <th>Submitted Description / Changes Diff</th>
              <th>IP / Device</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <History size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No audit events found</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isComplete = log.action_type === 'TASK_COMPLETED';
                const isCreated = log.action_type === 'TASK_CREATED';
                const isAck = log.action_type === 'TASK_ACKNOWLEDGED';
                return (
                  <tr key={log.id}>
                    {/* Timestamp */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#60a5fa', fontFamily: 'monospace' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Actor */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={log.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={log.user_name}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem' }}>
                            {log.user_name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {log.user_department || log.user_role.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        background: isComplete ? 'var(--status-done-bg)' : isCreated ? 'var(--status-progress-bg)' : isAck ? 'var(--status-pending-bg)' : 'rgba(148, 163, 184, 0.12)',
                        color: isComplete ? 'var(--status-done)' : isCreated ? 'var(--status-progress)' : isAck ? 'var(--status-pending)' : 'var(--text-secondary)',
                        border: `1px solid ${isComplete ? 'var(--status-done-border)' : isCreated ? 'var(--status-progress-border)' : isAck ? 'var(--status-pending-border)' : 'var(--border)'}`
                      }}>
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Title / Summary */}
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem' }}>
                        {log.title}
                      </div>
                      {log.task_title && (
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Target: {log.task_title}
                        </div>
                      )}
                    </td>

                    {/* Details / Text Description */}
                    <td style={{ maxWidth: '340px' }}>
                      <div style={{
                        background: 'var(--bg-inset)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                      }}>
                        {log.details || 'System event recorded'}
                      </div>
                    </td>

                    {/* IP */}
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {log.ip_address}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
