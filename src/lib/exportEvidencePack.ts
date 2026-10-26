import { Task, Hat, User } from '@/types';
import { INSTITUTIONAL_PILLARS } from '@/lib/pillar_catalog';

/**
 * Maps a task to its corresponding NAQAAE Institutional Pillar (A through L)
 */
export function identifyTaskPillar(task: Task): { code: string; name: string } {
  if (task.pillar_code) {
    const pillar = INSTITUTIONAL_PILLARS.find((p) => p.code.toUpperCase() === task.pillar_code?.toUpperCase());
    if (pillar) {
      return { code: pillar.code, name: pillar.name };
    }
  }

  const titleLower = (task.title || '').toLowerCase();
  const descLower = (task.description || '').toLowerCase();

  for (const pillar of INSTITUTIONAL_PILLARS) {
    for (const t of pillar.tasks) {
      const templateTitle = t.title.toLowerCase();
      if (titleLower.includes(templateTitle) || descLower.includes(templateTitle)) {
        return { code: pillar.code, name: pillar.name };
      }
    }
  }

  // Fallback by department keywords
  const dept = (task.department || '').toLowerCase();
  if (dept.includes('qa') || dept.includes('quality')) {
    return { code: 'B', name: 'Quality Assurance System' };
  }
  if (dept.includes('postgrad') || dept.includes('research')) {
    return { code: 'I', name: 'Scientific Research & Innovation' };
  }
  if (dept.includes('community') || dept.includes('environment')) {
    return { code: 'K', name: 'Community Participation & Environmental Dev' };
  }

  return { code: 'GENERAL', name: 'Institutional Operations & Academic Governance' };
}

/**
 * Escapes a single CSV field following RFC 4180
 */
function escapeCSVField(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports tasks as an Accreditation Evidence Pack CSV with UTF-8 BOM for Excel
 */
export function exportAccreditationEvidencePack(
  tasks: Task[],
  hats: Hat[] = [],
  users: User[] = [],
  customFilename?: string
): void {
  if (!tasks || tasks.length === 0) return;

  const hatMap = new Map<number, string>();
  hats.forEach((h) => hatMap.set(h.id, h.name));

  const userMap = new Map<number, User>();
  users.forEach((u) => userMap.set(u.id, u));

  const headers = [
    'Pillar Code',
    'Pillar Name',
    'Task ID',
    'Task Title',
    'Priority',
    'Status',
    'Assignee Name',
    'Assignee Title',
    'Assignee Department',
    'Assignee Email',
    'Assigned Hat / Committee',
    'Deadline',
    'Completed At',
    'Dean Verified',
    'Evidence File Name',
    'Evidence File Link',
    'Completion Notes / Final Report',
    'Task Description',
    'Created At'
  ];

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const rows = tasks.map((t) => {
    const pillar = identifyTaskPillar(t);
    const assignee = t.assigned_to_id ? userMap.get(t.assigned_to_id) : undefined;
    const hatName = t.hat_id ? (hatMap.get(t.hat_id) || t.hat_name || `Hat #${t.hat_id}`) : (t.hat_name || 'None');
    
    // Construct full deliverable URL if available
    let fileUrl = t.attachment_url || '';
    if (fileUrl && fileUrl.startsWith('/') && origin) {
      fileUrl = `${origin}${fileUrl}`;
    }

    return [
      escapeCSVField(pillar.code),
      escapeCSVField(pillar.name),
      escapeCSVField(`#${t.id}`),
      escapeCSVField(t.title),
      escapeCSVField((t.priority || 'medium').toUpperCase()),
      escapeCSVField((t.status || 'pending').replace('_', ' ').toUpperCase()),
      escapeCSVField(t.assignee_name || assignee?.full_name || 'Unassigned'),
      escapeCSVField(t.assignee_title || assignee?.title || ''),
      escapeCSVField(t.department || assignee?.department || ''),
      escapeCSVField(t.assignee_email || assignee?.email || ''),
      escapeCSVField(hatName),
      escapeCSVField(t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB') : ''),
      escapeCSVField(t.completed_at ? new Date(t.completed_at).toLocaleString('en-GB') : ''),
      escapeCSVField(t.dean_acknowledged ? 'VERIFIED (Dean Sign-Off)' : 'Pending Sign-Off'),
      escapeCSVField(t.attachment_name || 'No File Attached'),
      escapeCSVField(fileUrl || 'N/A'),
      escapeCSVField(t.completion_notes || ''),
      escapeCSVField(t.description || ''),
      escapeCSVField(t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : '')
    ].join(',');
  });

  // UTF-8 BOM \uFEFF ensures proper decoding in MS Excel
  const csvContent = '\uFEFF' + [headers.map(escapeCSVField).join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const dateStr = new Date().toISOString().slice(0, 10);
  const defaultFilename = `MSA_BioTech_NAQAAE_Accreditation_Evidence_Pack_${dateStr}.csv`;
  link.setAttribute('download', customFilename || defaultFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
