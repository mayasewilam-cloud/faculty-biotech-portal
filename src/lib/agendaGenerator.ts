import { Meeting, Task } from '@/types';

interface GenerateAgendaParams {
  type: string;
  title: string;
  hatId?: number | null;
  hatName?: string | null;
  previousMeetings?: Meeting[];
  tasks?: Task[];
}

export function generateDynamicAgenda({
  type,
  title,
  hatId,
  hatName,
  previousMeetings = [],
  tasks = [],
}: GenerateAgendaParams): string[] {
  const agenda: string[] = [];

  // 1. Quorum & Formal Opening
  agenda.push('1. Formal Call to Order, Quorum Verification & Adoption of Agenda');

  // 2. Previous Minutes & Unresolved Action Items
  const relevantPrevious = previousMeetings.find(
    (m) => m.type === type || (hatId && m.hat_id === hatId)
  );

  if (relevantPrevious) {
    const prevDate = new Date(relevantPrevious.date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    agenda.push(`2. Ratification of Minutes of Meeting dated ${prevDate} ("${relevantPrevious.title}") & Review of Matters Arising`);

    const unresolvedAi = (relevantPrevious.action_items || []).filter(
      (ai) => ai.status === 'pending'
    );
    if (unresolvedAi.length > 0) {
      agenda.push(
        `3. Audit of Unresolved Action Items from Previous Session (${unresolvedAi.length} pending items flagged)`
      );
    }
  } else {
    agenda.push('2. Review of Matters Arising & Ratification of Previous Executive Proceedings');
  }

  // 3. Substantive Deliberations by Meeting Type
  if (type === 'presidential_delegation') {
    agenda.push('4. Strategic Alignment with University President Directives & Institutional Priorities');
    agenda.push('5. Presentation of Faculty Research Throughput, Laboratory Equipment & Resource Allocations');
    agenda.push('6. Pre/Post-Briefing Protocol & Coordination with Dean Prof. Dr. Gehan Safwat');
    agenda.push('7. Action Item Formulation & Institutional Commitments Dispatched to University Leadership');
  } else if (type === 'faculty_board') {
    agenda.push('4. Verification of Midterm & Final Examination Schedules, Question Banks, and Moderation Protocols');
    agenda.push('5. Academic Syllabus Specifications & 12-Pillar Quality Assurance Benchmark Review');
    agenda.push('6. Departmental Staffing Distribution, Teaching Assistant Allocations & Research Output');
  } else if (type === 'committee') {
    const committeeLabel = hatName || 'Standing Committee';
    agenda.push(`4. Statutory Mandate Implementation Review for ${committeeLabel}`);
    agenda.push('5. Inspection of Standard Operating Procedures (SOPs) & Departmental Compliance Ledgers');
  } else {
    agenda.push('4. Core Operational Deliverables & Milestone Progress Review');
    agenda.push('5. Inter-Departmental Coordination & Resource Requirements');
  }

  // 4. Pending Tasks in Portfolio
  const relevantTasks = tasks.filter((t) => {
    if (t.status === 'done') return false;
    if (hatId && t.hat_id === hatId) return true;
    if (t.priority === 'urgent' || t.priority === 'high') return true;
    return false;
  }).slice(0, 3);

  if (relevantTasks.length > 0) {
    const taskTitles = relevantTasks.map((t) => `"${t.title}" (Due: ${t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB') : 'Scheduled'})`).join('; ');
    agenda.push(`8. High-Priority Deliverables Oversight: ${taskTitles}`);
  }

  // 5. Wrap up
  agenda.push('9. Any Other Business (A.O.B.)');
  agenda.push('10. Adjournment & Scheduling of Next Formal Proceeding');

  return agenda;
}
