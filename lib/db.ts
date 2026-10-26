// Cloudflare D1 Database Adapter with resilient in-memory & file-backed persistence fallback
import { INITIAL_STAFF_SEED, StaffSeedItem } from './staff_seed';
import { loadStateFromDisk, saveStateToDisk } from './storage';
import { Meeting, MeetingActionItem, FacultyCommittee, DeanAvailabilitySlot } from '@/types';
import { OFFICIAL_FACULTY_COMMITTEES } from './committees_seed';
import { FALL_2026_TASKS } from './fall_2026_seed_tasks';

function getD1(): any {
  // 1. Try OpenNext getCloudflareContext (Official Next.js 15/16 adapter API)
  try {
    const openNext = require('@opennextjs/cloudflare');
    if (openNext && typeof openNext.getCloudflareContext === 'function') {
      const ctx = openNext.getCloudflareContext();
      if (ctx?.env?.DB) return ctx.env.DB;
    }
  } catch {}

  // 2. Try global or process environment bindings
  const g = globalThis as any;
  if (g?.__env?.DB) return g.__env.DB;
  if (g?.DB) return g.DB;
  if (typeof process !== 'undefined' && (process.env as any).DB) {
    return (process.env as any).DB;
  }
  return null;
}

// In-memory fallback stores for sessions
const memorySessions = new Map<string, { id: string; user_id: number; expires_at: string; created_at: string }>();

export interface HatRecord {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_by_id: number;
  created_at: string;
  updated_at: string;
}

export interface HatMemberRecord {
  id: number;
  hat_id: number;
  user_id: number;
  assigned_at: string;
}

export interface HatWithMembers extends HatRecord {
  member_count: number;
  members: any[];
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
}

const DEFAULT_LOGS_SEED: any[] = [
  {
    id: 1,
    user_id: 6496,
    user_name: 'Prof. Dr. Gehan Safwat',
    user_role: 'admin',
    action_type: 'DEAN_VERIFIED',
    task_id: 1,
    title: 'Dean Executive Acknowledgment',
    details: 'Prof. Dr. Gehan Safwat formally verified NAQAAE course syllabi compliance.',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    task_title: 'Submit NAQAAE Accreditation Course Syllabi (BIO301 & BIO402)',
    user_department: "Dean's Executive Office",
    user_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Gehan+El-Husseiny'
  },
  {
    id: 2,
    user_id: 6591,
    user_name: 'Prof. Dr. Amr Ageez',
    user_role: 'admin',
    action_type: 'TASK_CREATED',
    task_id: 2,
    title: 'Academic Oversight Dispatch',
    details: 'Vice Dean Prof. Dr. Amr Ageez issued molecular safety inspection directive.',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    task_title: 'DNA Sequencing Lab Safety Audit & Equipment Log',
    user_department: "Dean's Executive Office",
    user_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Amr+Ageez'
  }
];

const DEFAULT_TASKS_SEED: any[] = FALL_2026_TASKS;
export { FALL_2026_TASKS };

const DEFAULT_HATS_SEED: HatRecord[] = [
  {
    id: 1,
    name: 'Corporate Social Responsibilities',
    description: 'Enhancing the role of the faculty through community service activities.',
    icon: '🤝',
    color: '#059669',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Graduate Affairs',
    description: 'Following up on academic and professional development and success of MSA graduates.',
    icon: '🎓',
    color: '#2563eb',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Learning and Development',
    description: 'Assesses learning needs and adapts approaches to meet desired learning outcomes and learner needs through designing, implementing, and evaluating educational modules.',
    icon: '💡',
    color: '#8b5cf6',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Events',
    description: 'Preparation and implementation of Faculty Academic & Non-Academic Events e.g. conferences, seminars, exhibitions, and awareness campaigns.',
    icon: '🎪',
    color: '#ec4899',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Research',
    description: 'Advancement of scientific research to achieve a research environment that is complementary to the University\'s mission.',
    icon: '🔬',
    color: '#06b6d4',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Student Affairs',
    description: 'Faculty student affairs activities including academic advising, registrations, training and internships, scheduling, probation, and transfer.',
    icon: '👥',
    color: '#f59e0b',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Quality',
    description: 'Processes related to accreditation in collaboration with the University Quality Assurance and Accreditation Centre.',
    icon: '⭐',
    color: '#10b981',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    name: 'Learning',
    description: 'Staff working on learning activities beside teaching tasks including curriculum development, e-learning, and course portfolio management.',
    icon: '📖',
    color: '#6366f1',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Exams Moderation',
    description: 'Faculty Control Unit, Proctoring, Control Results, Exams Appeals, Practical Exams, and Marking.',
    icon: '📝',
    color: '#ef4444',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 10,
    name: 'Center of Excellence',
    description: 'Help students in following university strategic plan by active engagement in centre funded projects.',
    icon: '🏛️',
    color: '#d97706',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Onboarding Ambassadors',
    description: 'Welcoming newly hired staff through the faculty onboarding process.',
    icon: '🧭',
    color: '#14b8a6',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 12,
    name: 'Labs and Studios',
    description: 'Ensure that studio/lab requirements, safety protocols, and equipment standards are applied.',
    icon: '🧪',
    color: '#3b82f6',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 13,
    name: 'Strategic Planning',
    description: 'Contribute to developing and monitoring the faculty strategic plan.',
    icon: '🎯',
    color: '#8b5cf6',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 14,
    name: 'Purchasing',
    description: 'Administering purchasing process of required chemicals and equipment for the faculty.',
    icon: '🛒',
    color: '#f97316',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 15,
    name: 'Unique',
    description: 'Specialized faculty mandates: Infection Control, Continuous Education, PG Bylaws, Intellectual Property, Animal House, and related areas.',
    icon: '🔮',
    color: '#a855f7',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 16,
    name: 'Internal Audit',
    description: 'Examine and ensure compliance of course file contents with internal audit committee criteria.',
    icon: '🔍',
    color: '#64748b',
    created_by_id: 6496,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_HAT_MEMBERS_SEED: HatMemberRecord[] = [];

const DEFAULT_MEETINGS_SEED: Meeting[] = [
  {
    id: 1,
    title: 'University Presidential Council - Biotechnology Delegation on Strategic Expansion & Lab Modernization',
    type: 'presidential_delegation',
    hat_id: 1,
    hat_name: 'Accreditation & Quality Assurance Committee',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    location: 'University President Boardroom (Administration Building A)',
    chair: 'University President',
    rapporteur: 'Prof. Dr. Gehan Safwat (Dean)',
    objective: 'Review faculty resource requests, graduate program expansion, and NAQAAE international accreditation roadmap.',
    attendees: [
      { user_id: 6496, name: 'Prof. Dr. Gehan Safwat', role: 'Dean & Head of Delegation', department: "Dean's Executive Office", attended: true },
      { user_id: 6591, name: 'Prof. Dr. Amr Ageez', role: 'Vice Dean for Academic Affairs', department: "Dean's Executive Office", attended: true },
      { user_id: 14191, name: 'Prof. Dr. Rania Amer', role: 'Senior Professor of Molecular Biology', department: 'Academic Staff', attended: true },
      { user_id: 99, name: 'Central University Governance Admin', role: 'Presidential Protocol Secretary', department: 'Central Administration', attended: true }
    ],
    agenda: [
      'Capital equipment budget allocation for Next-Gen Sequencers & Autoclaves (Pillars C & F)',
      'Undergraduate lab section redistributions for the upcoming semester (Pillars A & B)',
      'NAQAAE institutional compliance dossier sign-off (Pillar E)'
    ],
    minutes_body: 'The Presidential Council received the high-level delegation from the Faculty of Biotechnology led by Dean Prof. Dr. Gehan Safwat. The Dean presented a quantitative dossier illustrating student retention rate of 98.4% and an increase in peer-reviewed Q1 biotechnology journal publications.\n\nThe President formally commended the faculty leadership for maintaining high standards and agreed in principle to fund the modernization of Building G laboratories. A directive was issued to expedite safety certifications. Furthermore, the delegation reported on the upcoming High School Experimental Day as a strategic recruitment initiative.',
    decisions: [
      'Approved emergency capital allocation for Building G laboratory safety upgrades.',
      'Delegation instructed to submit final NAQAAE syllabus mapping for BIO301 & BIO402 by end of month.',
      'Authorized expansion of student capacity in Bio-Informatics computer labs.'
    ],
    action_items: [
      {
        id: 'AI-101',
        meeting_id: 1,
        title: 'Submit NAQAAE Accreditation Course Syllabi (BIO301 & BIO402)',
        assigned_to_id: 14191,
        assigned_to_name: 'Prof. Dr. Rania Amer',
        department: 'Academic Staff',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        pillar_code: 'E',
        pillar_name: 'Quality Assurance & Accreditation',
        task_id: 13,
        status: 'completed'
      },
      {
        id: 'AI-102',
        meeting_id: 1,
        title: 'DNA Sequencing Lab Safety Audit & Equipment Log',
        assigned_to_id: 13480,
        assigned_to_name: 'Prof. Dr. Khaled El-Din',
        department: 'Academic Staff',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
        pillar_code: 'F',
        pillar_name: 'Laboratories & Practical Training',
        task_id: 14,
        status: 'converted'
      },
      {
        id: 'AI-103',
        meeting_id: 1,
        title: 'High School Students Experimental Day Logistics Plan',
        assigned_to_id: 14686,
        assigned_to_name: 'Ms. Menna Hussein',
        department: 'Academic Administration',
        priority: 'medium',
        deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
        pillar_code: 'A',
        pillar_name: 'Planning & Scheduling',
        status: 'pending'
      }
    ],
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_by_id: 6496,
    created_by_name: 'Prof. Dr. Gehan Safwat'
  },
  {
    id: 2,
    title: 'Faculty Board - Quality Assurance & Exam Moderation Session',
    type: 'faculty_board',
    hat_id: 2,
    hat_name: 'Examinations & Control Board',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    location: 'Faculty Council Chamber (Floor 3)',
    chair: 'Prof. Dr. Gehan Safwat (Dean)',
    rapporteur: 'Prof. Dr. Amr Ageez (Vice Dean)',
    objective: 'Establish practical examination timetables and coordinate double-marking protocols for core biotechnology modules.',
    attendees: [
      { user_id: 6496, name: 'Prof. Dr. Gehan Safwat', role: 'Chairperson / Dean', department: "Dean's Executive Office", attended: true },
      { user_id: 6591, name: 'Prof. Dr. Amr Ageez', role: 'Vice Dean for Academic Affairs', department: "Dean's Executive Office", attended: true },
      { user_id: 7065, name: 'Prof. Dr. Ahmed Aref', role: 'Control Board Lead', department: 'Academic Staff', attended: true },
      { user_id: 14237, name: 'Assoc. Prof. Dr. Mostafa El-Deeb', role: 'Senior Examiner', department: 'Academic Staff', attended: true },
      { user_id: 4916, name: 'Dr. Reham Osman', role: 'Moderation Secretary', department: 'Academic Staff', attended: true }
    ],
    agenda: [
      'Finalize Practical Examination Schedule for Spring Semester (Pillar A)',
      'Approval of Double-Marking (Second Marking) Protocols for Exam Scripts (Pillar C)',
      'Graduation Project Venue & Topic Allocations (Pillar D)'
    ],
    minutes_body: 'The Faculty Board met with full quorum. The Vice Dean submitted draft timetables for practical examinations across Microbiology, Genetics, and Plant Tissue Culture laboratories.\n\nThe board discussed second marking guidelines, confirming that 10% sample moderation is mandatory for all passed scripts and 100% moderation for borderline or failing grades. External examiner invitations were confirmed for graduation project assessments.',
    decisions: [
      'Unanimously ratified the Practical Exam Timetable for Spring 2026.',
      'Approved mandatory second marking rubric across all departments.',
      'Confirmed external examiners roster for graduation project discussions.'
    ],
    action_items: [
      {
        id: 'AI-201',
        meeting_id: 2,
        title: 'Practical Exam Schedule Publishing & Lab Prep',
        assigned_to_id: 7065,
        assigned_to_name: 'Prof. Dr. Ahmed Aref',
        department: 'Academic Staff',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
        pillar_code: 'A',
        pillar_name: 'Planning & Scheduling',
        status: 'pending'
      },
      {
        id: 'AI-202',
        meeting_id: 2,
        title: 'Second Marking Moderation Protocol Implementation',
        assigned_to_id: 14237,
        assigned_to_name: 'Assoc. Prof. Dr. Mostafa El-Deeb',
        department: 'Academic Staff',
        priority: 'urgent',
        deadline: new Date(Date.now() + 86400000 * 6).toISOString(),
        pillar_code: 'C',
        pillar_name: 'Academic Preparation',
        status: 'pending'
      }
    ],
    status: 'approved',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_by_id: 6496,
    created_by_name: 'Prof. Dr. Gehan Safwat'
  }
];

const DEFAULT_DEAN_SLOTS: DeanAvailabilitySlot[] = [
  {
    id: 'slot-mon-10',
    day_of_week: 'Monday',
    start_time: '10:00 AM',
    end_time: '11:30 AM',
    location: "Dean's Office (Building A, Room 301)",
    note: 'Presidential delegations & institutional coordination',
    is_active: true,
  },
  {
    id: 'slot-wed-13',
    day_of_week: 'Wednesday',
    start_time: '01:00 PM',
    end_time: '02:30 PM',
    location: "Dean's Office (Building A, Room 301)",
    note: 'Academic departments & NAQAAE review briefings',
    is_active: true,
  },
  {
    id: 'slot-thu-11',
    day_of_week: 'Thursday',
    start_time: '11:00 AM',
    end_time: '01:00 PM',
    location: "Dean's Office (Building A, Room 301)",
    note: 'Faculty committees & strategic matters',
    is_active: true,
  },
];

const g = globalThis as any;

if (!g.__memoryTasks) g.__memoryTasks = DEFAULT_TASKS_SEED;
if (!g.__memoryHats) g.__memoryHats = DEFAULT_HATS_SEED;
if (!g.__memoryHatMembers) g.__memoryHatMembers = DEFAULT_HAT_MEMBERS_SEED;
if (!g.__memoryLogs) g.__memoryLogs = DEFAULT_LOGS_SEED;
if (!g.__memoryUsers) g.__memoryUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
if (!g.__memoryCustomUsers) g.__memoryCustomUsers = [];
if (!g.__memoryMeetings) g.__memoryMeetings = DEFAULT_MEETINGS_SEED;
if (!g.__memoryCommittees) g.__memoryCommittees = OFFICIAL_FACULTY_COMMITTEES;
if (!g.__memorySubscriptions) g.__memorySubscriptions = [];
if (!g.__memoryDeanSlots) g.__memoryDeanSlots = DEFAULT_DEAN_SLOTS;

async function ensureInitialized(): Promise<void> {
  const db = getD1();
  if (db) return;
  if (g.__isInitialized) return;
  g.__isInitialized = true;
  try {
    const disk = await loadStateFromDisk();
    if (disk) {
      if (Array.isArray(disk.tasks)) {
        // Discard legacy prototype mock tasks
        const legacyMockTitles = new Set([
          'submit naqaae accreditation course syllabi (bio301 & bio402)',
          'dna sequencing lab safety audit & equipment log',
          'week 4 lab attendance verification & student log',
          'practical exam schedule publishing & lab prep',
          'lecture hall reservation - 6th of october compensation sessions',
          'newly hired teaching assistant evaluation form',
          'newly hired staff laboratory tracker',
          'upload the weekly plan and minutes of meeting- fall 2026',
          'check tasks allocation - fall 2026',
          'exam submission - level one & level two',
          'the moderation committee for level one and level two',
          'submission of special needs midterm and final exams with model answers',
          'preparation of the monthly academic calendar',
          'quality assurance awareness session for rubric design'
        ]);

        // Keep real user-added tasks (not in legacy mock and not in official seed)
        const officialTitles = new Set(FALL_2026_TASKS.map(ft => ft.title.toLowerCase().trim()));
        const userAddedTasks = disk.tasks.filter((t: any) => {
          const title = (t.title || '').toLowerCase().trim();
          return !legacyMockTitles.has(title) && !officialTitles.has(title);
        });

        // Merge disk updates for official tasks (e.g. status changes, notes, attachments)
        const officialWithUpdates = FALL_2026_TASKS.map((ft: any) => {
          const diskMatch = disk.tasks.find((dt: any) => dt.title?.toLowerCase().trim() === ft.title.toLowerCase().trim() || dt.id === ft.id);
          if (diskMatch) {
            return {
              ...ft,
              status: diskMatch.status || ft.status,
              completion_notes: diskMatch.completion_notes || ft.completion_notes,
              attachment_url: diskMatch.attachment_url || ft.attachment_url,
              attachment_name: diskMatch.attachment_name || ft.attachment_name,
              drive_link: diskMatch.drive_link || ft.drive_link,
              action_plan: diskMatch.action_plan || ft.action_plan,
              google_form_url: diskMatch.google_form_url || ft.google_form_url,
              assigned_members: diskMatch.assigned_members || ft.assigned_members,
              dean_acknowledged: diskMatch.dean_acknowledged ?? ft.dean_acknowledged,
            };
          }
          return ft;
        });

        // Combine: official Fall 2026 tasks + newly added tasks
        g.__memoryTasks = [...officialWithUpdates, ...userAddedTasks];
      } else {
        g.__memoryTasks = FALL_2026_TASKS;
      }
      if (Array.isArray(disk.hats)) {
        const hasLegacyHats = disk.hats.some((h: any) => h.name === 'RA N112' || h.name === 'Prototyping RA' || h.name === 'Accreditation & Quality Assurance Committee');
        if (hasLegacyHats || disk.hats.length < 16) {
          g.__memoryHats = DEFAULT_HATS_SEED;
          g.__memoryHatMembers = DEFAULT_HAT_MEMBERS_SEED;
        } else {
          g.__memoryHats = disk.hats;
          if (Array.isArray(disk.hat_members)) g.__memoryHatMembers = disk.hat_members;
        }
      } else {
        g.__memoryHats = DEFAULT_HATS_SEED;
        g.__memoryHatMembers = DEFAULT_HAT_MEMBERS_SEED;
      }
      if (Array.isArray(disk.logs)) g.__memoryLogs = disk.logs;
      if (Array.isArray(disk.meetings)) g.__memoryMeetings = disk.meetings;
      if (Array.isArray(disk.committees)) g.__memoryCommittees = disk.committees;
      if (Array.isArray(disk.push_subscriptions)) g.__memorySubscriptions = disk.push_subscriptions;
      if (Array.isArray(disk.dean_availability_slots)) g.__memoryDeanSlots = disk.dean_availability_slots;

      if (Array.isArray(disk.users) && disk.users.length > 0) {
        const hasBaseStaff = disk.users.some((u: any) => u.id === 6496);
        if (hasBaseStaff) {
          g.__memoryUsers = disk.users;
        } else {
          // Backward compatibility: disk.users previously only stored custom users (id >= 20000)
          const baseStaff = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
          const existingIds = new Set(baseStaff.map((u: any) => u.id));
          for (const cu of disk.users) {
            if (!existingIds.has(cu.id)) {
              baseStaff.push(cu);
              existingIds.add(cu.id);
            }
          }
          g.__memoryUsers = baseStaff;
        }
        g.__memoryCustomUsers = g.__memoryUsers.filter((u: any) => u.id >= 20000);
      } else {
        g.__memoryUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
        g.__memoryCustomUsers = [];
      }
    } else if (!g.__memoryStorageInitialized) {
      await persistCurrentState();
    }
  } catch {}
  g.__memoryStorageInitialized = true;
}

export async function persistCurrentState(): Promise<void> {
  try {
    await saveStateToDisk({
      tasks: g.__memoryTasks || [],
      hats: g.__memoryHats || [],
      hat_members: g.__memoryHatMembers || [],
      logs: g.__memoryLogs || [],
      users: g.__memoryUsers || getAllStaff(),
      meetings: g.__memoryMeetings || [],
      committees: g.__memoryCommittees || [],
      push_subscriptions: g.__memorySubscriptions || [],
      dean_availability_slots: g.__memoryDeanSlots || DEFAULT_DEAN_SLOTS,
    });
  } catch {}
}

function getAllStaff(): StaffSeedItem[] {
  if (!g.__memoryUsers || !Array.isArray(g.__memoryUsers)) {
    g.__memoryUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
  }
  return g.__memoryUsers;
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = getD1();
  if (db) {
    try {
      const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
      const res = await stmt.all();
      if (res && Array.isArray(res.results)) {
        return res.results as T[];
      }
    } catch (e) {
      console.warn('D1 queryAll fallback:', e);
    }
  }

  await ensureInitialized();
  const normalizedSql = sql.toLowerCase();
  const allStaff = getAllStaff();
  const allTasks: any[] = g.__memoryTasks || [];
  const allHats: HatRecord[] = g.__memoryHats || [];
  const allHatMembers: HatMemberRecord[] = g.__memoryHatMembers || [];
  const allLogs: any[] = g.__memoryLogs || [];

  if (normalizedSql.includes('from users')) {
    let usersList = allStaff;
    if (normalizedSql.includes('where id in') && params.length > 0) {
      const allowedIds = new Set(params.map(Number));
      usersList = usersList.filter(u => allowedIds.has(u.id));
    } else if (normalizedSql.includes('where department = ?') && params.length > 0) {
      const d = String(params[0]);
      usersList = usersList.filter(u => u.department === d);
    }
    return usersList.map(u => {
      const uTasks = allTasks.filter(t => t.assigned_to_id === u.id);
      return {
        ...u,
        status: 'active',
        created_at: (u as any).created_at || new Date().toISOString(),
        total_tasks: uTasks.length,
        completed_tasks: uTasks.filter(t => t.status === 'done').length,
        in_progress_tasks: uTasks.filter(t => t.status === 'in_progress').length,
        pending_tasks: uTasks.filter(t => t.status === 'pending').length,
        overdue_tasks: uTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length,
      };
    }) as T[];
  }

  if (normalizedSql.includes('from tasks')) {
    // Check if group by department (Dean KPI Analytics)
    if (normalizedSql.includes('group by department')) {
      const departments = ['Academic Staff', 'Assisting Staff (TAs & LAs)', 'Academic Administration', 'Quality & Accreditation Office', 'Laboratories & Research Stations'];
      const now = new Date();
      return departments.map(d => {
        const dTasks = allTasks.filter(t => t.department === d);
        return {
          department: d,
          total: dTasks.length,
          done: dTasks.filter(t => t.status === 'done').length,
          in_progress: dTasks.filter(t => t.status === 'in_progress').length,
          pending: dTasks.filter(t => t.status === 'pending').length,
          overdue: dTasks.filter(t => new Date(t.deadline) < now && t.status !== 'done').length,
        };
      }) as T[];
    }

    // Check if bulk selection: where t.id in (...)
    if (normalizedSql.includes('where t.id in') || normalizedSql.includes('where id in')) {
      const allowedIds = new Set(params.map(Number));
      const filtered = allTasks.filter(t => allowedIds.has(Number(t.id)));
      return filtered.map(t => {
        const assignee = allStaff.find(u => u.id === t.assigned_to_id);
        const creator = allStaff.find(u => u.id === t.assigned_by_id);
        const hat = t.hat_id ? allHats.find(h => h.id === t.hat_id) : null;
        return {
          ...t,
          assignee_name: assignee?.full_name || 'Unassigned',
          assignee_title: assignee?.title || '',
          assignee_email: assignee?.email || '',
          assignee_role: assignee?.role || 'staff',
          assignee_department: assignee?.department || t.department,
          assignee_avatar: assignee?.avatar || '',
          creator_name: creator?.full_name || 'Leadership Office',
          creator_title: creator?.title || '',
          hat_name: hat?.name || null,
          hat_icon: hat?.icon || null,
          hat_color: hat?.color || null,
        };
      }) as T[];
    }

    // General tasks query with enrichment
    return allTasks.map(t => {
      const assignee = allStaff.find(u => u.id === t.assigned_to_id);
      const creator = allStaff.find(u => u.id === t.assigned_by_id);
      const hat = t.hat_id ? allHats.find(h => h.id === t.hat_id) : null;
      return {
        ...t,
        assignee_name: assignee?.full_name || 'Unassigned',
        assignee_title: assignee?.title || '',
        assignee_email: assignee?.email || '',
        assignee_role: assignee?.role || 'staff',
        assignee_department: assignee?.department || t.department,
        assignee_avatar: assignee?.avatar || '',
        creator_name: creator?.full_name || 'Leadership Office',
        creator_title: creator?.title || '',
        hat_name: hat?.name || null,
        hat_icon: hat?.icon || null,
        hat_color: hat?.color || null,
      };
    }) as T[];
  }

  if (normalizedSql.includes('from activity_logs')) {
    return allLogs.map(l => {
      const user = allStaff.find(u => u.id === l.user_id);
      return {
        ...l,
        user_avatar: user?.avatar || l.user_avatar || '',
        user_department: user?.department || l.user_department || '',
      };
    }) as T[];
  }

  if (normalizedSql.includes('from hats')) {
    return allHats as T[];
  }

  if (normalizedSql.includes('from hat_members')) {
    if (params.length > 0 && normalizedSql.includes('where hat_id = ?')) {
      const hId = Number(params[0]);
      return allHatMembers.filter(m => m.hat_id === hId) as T[];
    }
    if (params.length > 0 && normalizedSql.includes('where user_id = ?')) {
      const uId = Number(params[0]);
      return allHatMembers.filter(m => m.user_id === uId) as T[];
    }
    return allHatMembers as T[];
  }

  return [];
}

export async function queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const db = getD1();
  if (db) {
    try {
      const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
      const res = await stmt.first();
      return (res || null) as T | null;
    } catch (e) {
      console.warn('D1 queryFirst fallback:', e);
    }
  }

  await ensureInitialized();
  const normalizedSql = sql.toLowerCase();
  const allStaff = getAllStaff();
  const allTasks: any[] = g.__memoryTasks || [];
  const allHats: HatRecord[] = g.__memoryHats || [];

  if (normalizedSql.includes('from hats where id = ?')) {
    const id = Number(params[0]);
    const hat = allHats.find(h => h.id === id);
    return (hat || null) as T | null;
  }

  if (normalizedSql.includes('from tasks') && (normalizedSql.includes('where t.id = ?') || normalizedSql.includes('where id = ?'))) {
    const id = Number(params[0]);
    const task = allTasks.find(t => Number(t.id) === id);
    if (!task) return null;
    const assignee = allStaff.find(u => u.id === task.assigned_to_id);
    const creator = allStaff.find(u => u.id === task.assigned_by_id);
    const hat = task.hat_id ? allHats.find(h => h.id === task.hat_id) : null;
    return {
      ...task,
      assignee_name: assignee?.full_name || 'Unassigned Staff',
      assignee_title: assignee?.title || '',
      assignee_email: assignee?.email || '',
      assignee_role: assignee?.role || 'staff',
      assignee_department: assignee?.department || task.department,
      assignee_avatar: assignee?.avatar || '',
      creator_name: creator?.full_name || 'Leadership Office',
      creator_title: creator?.title || '',
      hat_name: hat?.name || null,
      hat_icon: hat?.icon || null,
      hat_color: hat?.color || null,
    } as T;
  }

  if (normalizedSql.includes('from tasks') && normalizedSql.includes('where tr = ?')) {
    const trNum = Number(params[0]);
    const task = allTasks.find(t => Number(t.tr) === trNum);
    if (!task) return null;
    return { ...task } as T;
  }

  if (normalizedSql.includes('from tasks') && normalizedSql.includes('title')) {
    const searchTitle = String(params[0] || '').toLowerCase().trim();
    const task = allTasks.find(t => (t.title || '').toLowerCase().trim() === searchTitle);
    if (!task) return null;
    return { ...task } as T;
  }

  if (normalizedSql.includes('count(*) as count from tasks')) {
    let tasks = allTasks;
    const now = new Date();
    if (normalizedSql.includes("status = 'done'")) {
      tasks = tasks.filter(t => t.status === 'done');
    } else if (normalizedSql.includes("status = 'in_progress'")) {
      tasks = tasks.filter(t => t.status === 'in_progress');
    } else if (normalizedSql.includes("status = 'pending'")) {
      tasks = tasks.filter(t => t.status === 'pending');
    } else if (normalizedSql.includes("status != 'done'") || normalizedSql.includes('overdue')) {
      tasks = tasks.filter(t => new Date(t.deadline) < now && t.status !== 'done');
    }
    return { count: tasks.length } as T;
  }
  
  if (normalizedSql.includes('where email = ? and id != ?') || normalizedSql.includes('where lower(email) = ? and id != ?')) {
    const email = String(params[0] || '').toLowerCase().trim();
    const excludeId = Number(params[1]);
    const user = allStaff.find(u => u.email.toLowerCase() === email && u.id !== excludeId);
    return (user ? { ...user, status: 'active' } : null) as T | null;
  }
  
  if (normalizedSql.includes('from users') && (normalizedSql.includes('email = ?') || normalizedSql.includes('email) = ?') || normalizedSql.includes('lower(email) = ?') || normalizedSql.includes('email ='))) {
    if (normalizedSql.includes('id !=') || normalizedSql.includes('id <>')) {
      const email = String(params[0] || '').toLowerCase().trim();
      const excludeId = Number(params[1]);
      const user = allStaff.find(u => u.email.toLowerCase() === email && u.id !== excludeId);
      return (user ? { ...user, status: 'active' } : null) as T | null;
    }
    const email = String(params[0] || '').toLowerCase().trim();
    const user = allStaff.find(u => u.email.toLowerCase() === email);
    return (user ? { ...user, status: 'active' } : null) as T | null;
  }

  if (normalizedSql.includes('from users') && (normalizedSql.includes('where id = ?') || normalizedSql.includes('where id =') || normalizedSql.includes('where u.id = ?'))) {
    const id = Number(params[0]);
    const user = allStaff.find(u => u.id === id);
    return (user ? { ...user, status: 'active' } : null) as T | null;
  }

  if (normalizedSql.includes('from sessions s') && normalizedSql.includes('where s.id = ?')) {
    const sessionId = String(params[0]);
    const sess = memorySessions.get(sessionId);
    if (sess) {
      const user = allStaff.find(u => u.id === sess.user_id);
      if (user) {
        return {
          user_id: sess.user_id,
          ...user,
          status: 'active'
        } as T;
      }
    }
    return null;
  }

  if (normalizedSql.includes('count(*) as count from users')) {
    if (normalizedSql.includes("role not in ('dean', 'admin')") || normalizedSql.includes('role not in ("dean", "admin")')) {
      const count = allStaff.filter(u => u.role !== 'dean' && u.role !== 'admin' && u.id !== 99).length;
      return { count } as T;
    }
    return { count: allStaff.length } as T;
  }

  return null;
}

export async function execute(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number }> {
  const db = getD1();
  if (db) {
    try {
      const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
      const res = await stmt.run();
      return { lastInsertRowid: Number(res.meta?.last_row_id || 0) };
    } catch (e) {
      console.warn('D1 execute fallback:', e);
    }
  }

  await ensureInitialized();
  const normalizedSql = sql.toLowerCase();

  // Sessions
  if (normalizedSql.includes('insert into sessions')) {
    const id = String(params[0]);
    const user_id = Number(params[1]);
    const expires_at = String(params[2]);
    memorySessions.set(id, { id, user_id, expires_at, created_at: new Date().toISOString() });
    return { lastInsertRowid: 1 };
  }

  if (normalizedSql.includes('delete from sessions where id = ?')) {
    memorySessions.delete(String(params[0]));
    return { lastInsertRowid: 0 };
  }

  // Users: Registration
  if (normalizedSql.includes('insert into users')) {
    if (!g.__memoryUsers) {
      g.__memoryUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
    }
    const maxExistingId = g.__memoryUsers.reduce((max: number, u: any) => Math.max(max, u.id || 0), 20000);
    const newId = maxExistingId + 1;
    const newUser = {
      id: newId,
      email: String(params[0]),
      password_hash: String(params[1]),
      full_name: String(params[2]),
      title: String(params[3] || 'Lecturer'),
      role: String(params[4] || 'professor'),
      department: String(params[5] || 'Academic Staff'),
      phone: String(params[6] || ''),
      avatar: String(params[7] || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params[2])}`),
      status: 'active',
      created_at: new Date().toISOString()
    };
    g.__memoryUsers.push(newUser);
    if (!g.__memoryCustomUsers) g.__memoryCustomUsers = [];
    g.__memoryCustomUsers.push(newUser);
    await persistCurrentState();
    return { lastInsertRowid: newId };
  }

  // Users: Update
  if (normalizedSql.includes('update users')) {
    const allUsers = getAllStaff();
    const targetId = Number(params[params.length - 1]);
    const user = allUsers.find(u => u.id === targetId);
    if (user) {
      const setMatch = sql.match(/set\s+([\s\S]+?)\s+where/i);
      if (setMatch) {
        const setClause = setMatch[1];
        const assignments = setClause.split(',').map(s => s.trim());
        let paramIdx = 0;
        for (const assignment of assignments) {
          const eqIdx = assignment.indexOf('=');
          if (eqIdx !== -1) {
            const col = assignment.slice(0, eqIdx).trim().toLowerCase();
            const val = params[paramIdx++];
            if (col === 'full_name' && val) user.full_name = String(val);
            else if (col === 'title' && val !== undefined) user.title = String(val);
            else if (col === 'role' && val) user.role = String(val) as any;
            else if (col === 'department' && val) user.department = String(val);
            else if (col === 'phone') {
              if (val) user.phone = String(val);
            }
            else if (col === 'email' && val) user.email = String(val).toLowerCase().trim();
            else if (col === 'status' && val) (user as any).status = String(val);
            else if (col === 'password_hash' && val) user.password_hash = String(val);
            else if (col === 'avatar' && val) user.avatar = String(val);
          }
        }
      }
    }
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  // Users: Delete
  if (normalizedSql.includes('delete from users')) {
    if (normalizedSql.includes('where id = ?') && params.length > 0) {
      const targetUserId = Number(params[0]);
      if (!g.__memoryUsers) {
        g.__memoryUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
      }
      g.__memoryUsers = g.__memoryUsers.filter((u: any) => u.id !== targetUserId);
      if (g.__memoryCustomUsers) {
        g.__memoryCustomUsers = g.__memoryCustomUsers.filter((u: any) => u.id !== targetUserId);
      }
    }
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  // Activity Logs
  if (normalizedSql.includes('insert into activity_logs')) {
    if (!g.__memoryLogs) g.__memoryLogs = [];
    const newLog = {
      id: g.__memoryLogs.length + 1,
      user_id: Number(params[0]),
      user_name: String(params[1]),
      user_role: String(params[2]),
      action_type: String(params[3]),
      title: String(params[4]),
      details: String(params[5]),
      ip_address: String(params[6] || '127.0.0.1'),
      created_at: new Date().toISOString()
    };
    g.__memoryLogs.unshift(newLog);
    await persistCurrentState();
    return { lastInsertRowid: newLog.id };
  }

  // Tasks: Insert
  if (normalizedSql.includes('insert into tasks')) {
    if (!g.__memoryTasks) g.__memoryTasks = [];
    const newId = g.__memoryTasks.length > 0 ? Math.max(...g.__memoryTasks.map((t: any) => t.id)) + 1 : 1;
    const newTask: any = {
      id: newId,
      status: 'pending',
      completion_notes: null,
      completion_url: null,
      completed_at: null,
      dean_feedback: null,
      dean_acknowledged: 0,
      attachment_name: null,
      attachment_type: null,
      attachment_size: null,
      attachment_url: null,
      is_confidential: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const colMatch = sql.match(/INSERT\s+INTO\s+tasks\s*\(([^)]+)\)/i);
    if (colMatch) {
      const cols = colMatch[1].split(',').map(c => c.trim().toLowerCase());
      cols.forEach((col, idx) => {
        if (idx < params.length) {
          const val = params[idx];
          if (['assigned_by_id', 'assigned_to_id', 'hat_id', 'attachment_size', 'tr', 'is_confidential', 'meeting_id'].includes(col)) {
            newTask[col] = val !== null && val !== undefined && val !== '' ? Number(val) : null;
          } else {
            newTask[col] = val;
          }
        }
      });
    } else {
      newTask.title = params[0];
      newTask.description = params[1];
      newTask.assigned_by_id = Number(params[2]);
      newTask.assigned_to_id = Number(params[3]);
      newTask.department = params[4];
      newTask.hat_id = params[5] ? Number(params[5]) : null;
      newTask.priority = params[6] || 'medium';
      newTask.deadline = params[7];
      newTask.attachment_name = params[8] || null;
      newTask.attachment_type = params[9] || null;
      newTask.attachment_size = params[10] ? Number(params[10]) : null;
      newTask.attachment_url = params[11] || null;
    }

    g.__memoryTasks.unshift(newTask);
    await persistCurrentState();
    return { lastInsertRowid: newId };
  }

  // Tasks: Delete
  if (normalizedSql.includes('delete from tasks')) {
    if (normalizedSql.includes('where id in') && params.length > 0) {
      const allowedIds = new Set(params.map(Number));
      g.__memoryTasks = (g.__memoryTasks || []).filter((t: any) => !allowedIds.has(Number(t.id)));
    } else if (normalizedSql.includes('where id = ?') && params.length > 0) {
      const taskId = Number(params[0]);
      g.__memoryTasks = (g.__memoryTasks || []).filter((t: any) => Number(t.id) !== taskId);
    }
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  // Tasks: Update hat_id = null
  if (normalizedSql.includes('update tasks set hat_id = null where hat_id = ?')) {
    const id = Number(params[0]);
    (g.__memoryTasks || []).forEach((t: any) => {
      if (t.hat_id === id) t.hat_id = null;
    });
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  // Tasks: Update
  if (normalizedSql.includes('update tasks')) {
    // Bulk Update
    if (normalizedSql.includes('where id in')) {
      const allowedIds = new Set(params.map(Number));
      (g.__memoryTasks || []).forEach((t: any) => {
        if (allowedIds.has(Number(t.id))) {
          if (normalizedSql.includes('dean_acknowledged = 1')) {
            if (t.status === 'done') t.dean_acknowledged = 1;
          }
          if (normalizedSql.includes('status = ?') && params.length > 0) {
            t.status = params[0];
          }
          if (normalizedSql.includes('priority = ?') && params.length > 0) {
            t.priority = params[0];
          }
          t.updated_at = new Date().toISOString();
        }
      });
      await persistCurrentState();
      return { lastInsertRowid: 0 };
    }

    // Single Task Update
    if (normalizedSql.includes('where id = ?') && params.length > 0) {
      const taskId = Number(params[params.length - 1]);
      const task = (g.__memoryTasks || []).find((t: any) => Number(t.id) === taskId);
      if (task) {
        const setMatch = sql.match(/SET\s+([\s\S]+?)\s+WHERE/i);
        if (setMatch) {
          const clauses = setMatch[1].split(',').map(c => c.trim());
          let paramIdx = 0;
          for (const clause of clauses) {
            const parts = clause.split('=');
            if (parts.length >= 2) {
              const col = parts[0].trim().toLowerCase();
              const valRaw = parts.slice(1).join('=').trim();
              if (valRaw.includes('?')) {
                const val = params[paramIdx++];
                if (['dean_acknowledged', 'is_confidential', 'tr'].includes(col)) {
                  task[col] = val !== null && val !== undefined ? Number(val) : null;
                } else if (['hat_id', 'attachment_size'].includes(col)) {
                  task[col] = val ? Number(val) : null;
                } else {
                  task[col] = val;
                }
              } else if (valRaw.toLowerCase().includes('current_timestamp')) {
                task[col] = new Date().toISOString();
              }
            }
          }
        }
        task.updated_at = new Date().toISOString();
        await persistCurrentState();
        return { lastInsertRowid: taskId };
      }
    }
  }

  // Hats: Insert
  if (normalizedSql.includes('insert into hats')) {
    if (!g.__memoryHats) g.__memoryHats = [];
    const newId = g.__memoryHats.length > 0 ? Math.max(...g.__memoryHats.map((h: any) => h.id)) + 1 : 1;
    const newHat: HatRecord = {
      id: newId,
      name: String(params[0]),
      description: String(params[1] || ''),
      icon: String(params[2] || '🎩'),
      color: String(params[3] || '#3b82f6'),
      created_by_id: Number(params[4] || 6496),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    g.__memoryHats.push(newHat);
    await persistCurrentState();
    return { lastInsertRowid: newId };
  }

  // Hats: Update
  if (normalizedSql.includes('update hats')) {
    const id = Number(params[params.length - 1]);
    const hat = (g.__memoryHats || []).find((h: any) => h.id === id);
    if (hat && params.length >= 4) {
      hat.name = String(params[0]);
      hat.description = String(params[1]);
      hat.icon = String(params[2]);
      hat.color = String(params[3]);
      hat.updated_at = new Date().toISOString();
    }
    await persistCurrentState();
    return { lastInsertRowid: id };
  }

  // Hats: Delete
  if (normalizedSql.includes('delete from hats where id = ?')) {
    const id = Number(params[0]);
    g.__memoryHats = (g.__memoryHats || []).filter((h: any) => h.id !== id);
    g.__memoryHatMembers = (g.__memoryHatMembers || []).filter((m: any) => m.hat_id !== id);
    (g.__memoryTasks || []).forEach((t: any) => {
      if (t.hat_id === id) t.hat_id = null;
    });
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  // Hat Members: Insert
  if (normalizedSql.includes('insert into hat_members') || normalizedSql.includes('insert or ignore into hat_members')) {
    if (!g.__memoryHatMembers) g.__memoryHatMembers = [];
    const hat_id = Number(params[0]);
    const user_id = Number(params[1]);
    const exists = g.__memoryHatMembers.some((m: any) => m.hat_id === hat_id && m.user_id === user_id);
    if (!exists) {
      const newId = g.__memoryHatMembers.length > 0 ? Math.max(...g.__memoryHatMembers.map((m: any) => m.id)) + 1 : 1;
      g.__memoryHatMembers.push({
        id: newId,
        hat_id,
        user_id,
        assigned_at: new Date().toISOString()
      });
      await persistCurrentState();
      return { lastInsertRowid: newId };
    }
    return { lastInsertRowid: 0 };
  }

  // Hat Members: Delete single
  if (normalizedSql.includes('delete from hat_members where hat_id = ? and user_id = ?')) {
    const hat_id = Number(params[0]);
    const user_id = Number(params[1]);
    g.__memoryHatMembers = (g.__memoryHatMembers || []).filter((m: any) => !(m.hat_id === hat_id && m.user_id === user_id));
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  // Hat Members: Delete all for hat
  if (normalizedSql.includes('delete from hat_members where hat_id = ?')) {
    const hat_id = Number(params[0]);
    g.__memoryHatMembers = (g.__memoryHatMembers || []).filter((m: any) => m.hat_id !== hat_id);
    await persistCurrentState();
    return { lastInsertRowid: 0 };
  }

  return { lastInsertRowid: 0 };
}

// ─────────────────────────────────────────────────────────────
// Hats & Committee Helpers
// ─────────────────────────────────────────────────────────────
export async function getAllHatsWithMembers(): Promise<HatWithMembers[]> {
  const hats = await queryAll<HatRecord>('SELECT * FROM hats ORDER BY id ASC');
  const allMembers = await queryAll<HatMemberRecord>('SELECT * FROM hat_members');
  const allTasks = await queryAll<any>('SELECT * FROM tasks');
  const allStaff = getAllStaff();

  return hats.map(h => {
    const hatMemberRows = allMembers.filter(m => m.hat_id === h.id);
    const memberUserIds = new Set(hatMemberRows.map(m => m.user_id));
    const members = allStaff
      .filter(u => memberUserIds.has(u.id))
      .map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        title: u.title,
        role: u.role,
        department: u.department,
        avatar: u.avatar,
      }));

    const hatTasks = allTasks.filter(t => t.hat_id === h.id || memberUserIds.has(t.assigned_to_id));

    return {
      ...h,
      member_count: members.length,
      members,
      total_tasks: hatTasks.length,
      completed_tasks: hatTasks.filter(t => t.status === 'done').length,
      pending_tasks: hatTasks.filter(t => t.status === 'pending').length,
      overdue_tasks: hatTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length,
    };
  });
}

export async function getHatByIdWithMembers(id: number): Promise<HatWithMembers | null> {
  const all = await getAllHatsWithMembers();
  return all.find(h => h.id === id) || null;
}

export async function createHatData(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_by_id: number;
  member_ids?: number[];
}): Promise<HatWithMembers> {
  const icon = data.icon || '🎩';
  const color = data.color || '#3b82f6';
  const description = data.description || '';

  const db = getD1();
  let hatId = 0;
  if (db) {
    try {
      const row = (await db.prepare(`
        INSERT INTO hats (name, description, icon, color, created_by_id)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
      `).bind(data.name, description, icon, color, data.created_by_id).first()) as { id: number } | null;
      if (row?.id) {
        hatId = row.id;
      }
    } catch (e) {
      console.warn('D1 direct RETURNING id fallback:', e);
    }
  }

  if (!hatId) {
    const res = await execute(`
      INSERT INTO hats (name, description, icon, color, created_by_id)
      VALUES (?, ?, ?, ?, ?)
    `, [data.name, description, icon, color, data.created_by_id]);
    hatId = res.lastInsertRowid;
  }

  if (Array.isArray(data.member_ids) && data.member_ids.length > 0) {
    for (const userId of data.member_ids) {
      await execute('INSERT OR IGNORE INTO hat_members (hat_id, user_id) VALUES (?, ?)', [hatId, userId]);
    }
  }

  const created = await getHatByIdWithMembers(hatId);
  return created!;
}

export async function updateHatData(id: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  member_ids?: number[];
}): Promise<HatWithMembers | null> {
  const existing = await getHatByIdWithMembers(id);
  if (!existing) return null;

  const name = data.name !== undefined ? data.name : existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  const icon = data.icon !== undefined ? data.icon : existing.icon;
  const color = data.color !== undefined ? data.color : existing.color;

  await execute(`
    UPDATE hats
    SET name = ?, description = ?, icon = ?, color = ?
    WHERE id = ?
  `, [name, description, icon, color, id]);

  if (Array.isArray(data.member_ids)) {
    await execute('DELETE FROM hat_members WHERE hat_id = ?', [id]);
    for (const userId of data.member_ids) {
      await execute('INSERT OR IGNORE INTO hat_members (hat_id, user_id) VALUES (?, ?)', [id, userId]);
    }
  }

  return await getHatByIdWithMembers(id);
}

export async function deleteHatData(id: number): Promise<boolean> {
  const db = getD1();
  if (db) {
    try {
      await db.prepare('DELETE FROM hat_members WHERE hat_id = ?').bind(id).run();
      await db.prepare('UPDATE tasks SET hat_id = NULL WHERE hat_id = ?').bind(id).run();
      await db.prepare('DELETE FROM hats WHERE id = ?').bind(id).run();
    } catch (e) {
      console.warn('D1 deleteHatData error:', e);
    }
  }
  await execute('DELETE FROM hat_members WHERE hat_id = ?', [id]);
  await execute('UPDATE tasks SET hat_id = NULL WHERE hat_id = ?', [id]);
  await execute('DELETE FROM hats WHERE id = ?', [id]);
  return true;
}

export async function addMemberToHat(hatId: number, userId: number): Promise<boolean> {
  await execute('INSERT OR IGNORE INTO hat_members (hat_id, user_id) VALUES (?, ?)', [hatId, userId]);
  return true;
}

export async function removeMemberFromHat(hatId: number, userId: number): Promise<boolean> {
  await execute('DELETE FROM hat_members WHERE hat_id = ? AND user_id = ?', [hatId, userId]);
  return true;
}

// Automatically ensure all official MSA Faculty of Biotechnology personnel are in D1 SQL Database
export async function ensureAllStaffExist(): Promise<void> {
  await ensureInitialized();
  const db = getD1();
  if (!db) {
    if (!g.__memoryUsers || g.__memoryUsers.length === 0) {
      g.__memoryUsers = JSON.parse(JSON.stringify(INITIAL_STAFF_SEED));
      await persistCurrentState();
    }
    return;
  }

  try {
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN attachment_name TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN attachment_type TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN attachment_size INTEGER`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN attachment_url TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN tr INTEGER`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN start_date TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN due_time TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN comment_type TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN received_by TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN form_link TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN submission_type TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN is_confidential INTEGER DEFAULT 0`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN request_prompt TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN group_id TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN committee_id INTEGER`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN committee_name TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN task_owner_id INTEGER`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN task_owner_name TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN requires_dean_approval INTEGER DEFAULT 0`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN responsibility_model TEXT DEFAULT "standard"`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE tasks ADD COLUMN parent_task_id INTEGER`).run(); } catch {}

    try { await db.prepare(`ALTER TABLE meetings ADD COLUMN is_dean_request INTEGER DEFAULT 0`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE meetings ADD COLUMN time_options TEXT`).run(); } catch {}
    try { await db.prepare(`ALTER TABLE meetings ADD COLUMN dean_notes TEXT`).run(); } catch {}

    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS dean_availability_slots (
          id TEXT PRIMARY KEY,
          day_of_week TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          location TEXT DEFAULT "Dean's Office (Building A, Room 301)",
          note TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch {}

    // Ensure Cloudflare D1 tables exist for meetings, committees, and push subscriptions
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS meetings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'departmental',
          hat_id INTEGER,
          hat_name TEXT,
          committee_id INTEGER,
          committee_name TEXT,
          date DATETIME NOT NULL,
          location TEXT NOT NULL,
          chair TEXT NOT NULL,
          rapporteur TEXT,
          objective TEXT,
          attendees TEXT,
          agenda TEXT,
          minutes_body TEXT,
          decisions TEXT,
          action_items TEXT,
          dean_briefing TEXT,
          recurrence TEXT,
          status TEXT NOT NULL DEFAULT 'approved',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by_id INTEGER NOT NULL,
          created_by_name TEXT NOT NULL
        )
      `).run();
    } catch {}

    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS committees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          name_ar TEXT,
          category TEXT NOT NULL DEFAULT 'standing',
          decree_ref TEXT,
          chair_id INTEGER NOT NULL,
          chair_name TEXT NOT NULL,
          chair_title TEXT,
          rapporteur_id INTEGER NOT NULL,
          rapporteur_name TEXT NOT NULL,
          rapporteur_title TEXT,
          description TEXT,
          mandates TEXT,
          pillar_code TEXT,
          pillar_name TEXT,
          icon TEXT DEFAULT '🏛️',
          color TEXT DEFAULT '#3b82f6',
          members TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch {}

    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          endpoint TEXT UNIQUE NOT NULL,
          p256dh TEXT,
          auth TEXT,
          keys TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch {}

    // Synchronize starter official MSA staff safely (INSERT OR IGNORE - NEVER purge custom/imported users)
    const chunkSize = 10;
    for (let i = 0; i < INITIAL_STAFF_SEED.length; i += chunkSize) {
      const chunk = INITIAL_STAFF_SEED.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')").join(', ');
      const params: any[] = [];
      for (const u of chunk) {
        params.push(u.id, u.email, u.password_hash, u.full_name, u.title, u.role, u.department, u.phone, u.avatar);
      }
      await db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, full_name, title, role, department, phone, avatar, status)
        VALUES ${placeholders}
      `).bind(...params).run();
    }
  } catch (err) {
    console.error('Error synchronizing faculty staff into D1:', err);
  }
}

// Super Admin sync helper
export async function ensureSuperAdminExists(): Promise<void> {
  await ensureAllStaffExist();
}

// ─────────────────────────────────────────────────────────────
// Meetings & Minutes of Meeting (MoM) Helpers
// ─────────────────────────────────────────────────────────────
export async function getAllMeetings(): Promise<Meeting[]> {
  await ensureInitialized();
  const db = getD1();
  if (db) {
    try {
      const res = await db.prepare('SELECT * FROM meetings ORDER BY date DESC, id DESC').all();
      if (res && Array.isArray(res.results)) {
        return res.results.map((r: any) => ({
          ...r,
          attendees: typeof r.attendees === 'string' ? JSON.parse(r.attendees) : (r.attendees || []),
          agenda: typeof r.agenda === 'string' ? JSON.parse(r.agenda) : (r.agenda || []),
          decisions: typeof r.decisions === 'string' ? JSON.parse(r.decisions) : (r.decisions || []),
          action_items: typeof r.action_items === 'string' ? JSON.parse(r.action_items) : (r.action_items || []),
        }));
      }
    } catch {}
  }
  const meetings: Meeting[] = g.__memoryMeetings || [];
  return [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getMeetingById(id: number): Promise<Meeting | null> {
  const all = await getAllMeetings();
  return all.find(m => m.id === id) || null;
}

export async function createMeeting(data: Partial<Meeting> & { title: string; created_by_id: number; created_by_name: string }): Promise<Meeting> {
  await ensureInitialized();
  const meetings: Meeting[] = g.__memoryMeetings || [];
  const newId = meetings.length > 0 ? Math.max(...meetings.map(m => m.id)) + 1 : 1;

  const newMeeting: Meeting = {
    id: newId,
    title: data.title,
    type: data.type || 'departmental',
    hat_id: data.hat_id || null,
    hat_name: data.hat_name || null,
    date: data.date || new Date().toISOString(),
    location: data.location || "Dean's Office (Building A, Room 301)",
    chair: data.chair || data.created_by_name,
    rapporteur: data.rapporteur || '',
    objective: data.objective || '',
    attendees: data.attendees || [],
    agenda: data.agenda || [],
    minutes_body: data.minutes_body || '',
    decisions: data.decisions || [],
    action_items: data.action_items || [],
    dean_briefing: data.dean_briefing || undefined,
    recurrence: data.recurrence || undefined,
    time_options: data.time_options || [],
    selected_option_id: data.selected_option_id || undefined,
    is_dean_request: !!data.is_dean_request,
    dean_notes: data.dean_notes || undefined,
    status: data.status || 'approved',
    created_at: new Date().toISOString(),
    created_by_id: data.created_by_id,
    created_by_name: data.created_by_name,
  };

  meetings.unshift(newMeeting);
  g.__memoryMeetings = meetings;
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO meetings (
          id, title, type, hat_id, hat_name, date, location, chair,
          rapporteur, objective, attendees, agenda, minutes_body,
          decisions, action_items, status, created_at, created_by_id, created_by_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newMeeting.id,
        newMeeting.title,
        newMeeting.type,
        newMeeting.hat_id,
        newMeeting.hat_name,
        newMeeting.date,
        newMeeting.location,
        newMeeting.chair,
        newMeeting.rapporteur,
        newMeeting.objective,
        JSON.stringify(newMeeting.attendees),
        JSON.stringify(newMeeting.agenda),
        newMeeting.minutes_body,
        JSON.stringify(newMeeting.decisions),
        JSON.stringify(newMeeting.action_items),
        newMeeting.status,
        newMeeting.created_at,
        newMeeting.created_by_id,
        newMeeting.created_by_name
      ).run();
    } catch (e) {
      console.warn('D1 insert meeting fallback:', e);
    }
  }

  return newMeeting;
}

export async function updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting | null> {
  await ensureInitialized();
  const meetings: Meeting[] = g.__memoryMeetings || [];
  const idx = meetings.findIndex(m => m.id === id);
  if (idx === -1) return null;

  const updated: Meeting = {
    ...meetings[idx],
    ...data,
    id,
  };
  meetings[idx] = updated;
  g.__memoryMeetings = meetings;
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare(`
        UPDATE meetings SET
          title = ?, type = ?, hat_id = ?, hat_name = ?, date = ?,
          location = ?, chair = ?, rapporteur = ?, objective = ?,
          attendees = ?, agenda = ?, minutes_body = ?, decisions = ?,
          action_items = ?, status = ?
        WHERE id = ?
      `).bind(
        updated.title,
        updated.type,
        updated.hat_id,
        updated.hat_name,
        updated.date,
        updated.location,
        updated.chair,
        updated.rapporteur,
        updated.objective,
        JSON.stringify(updated.attendees),
        JSON.stringify(updated.agenda),
        updated.minutes_body,
        JSON.stringify(updated.decisions),
        JSON.stringify(updated.action_items),
        updated.status,
        id
      ).run();
    } catch {}
  }

  return updated;
}

export async function deleteMeeting(id: number): Promise<boolean> {
  await ensureInitialized();
  const meetings: Meeting[] = g.__memoryMeetings || [];
  g.__memoryMeetings = meetings.filter(m => m.id !== id);
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare('DELETE FROM meetings WHERE id = ?').bind(id).run();
    } catch {}
  }

  return true;
}

// ─────────────────────────────────────────────────────────────
// Dean Availability Settings Helpers
// ─────────────────────────────────────────────────────────────
export async function getDeanAvailabilitySlots(): Promise<DeanAvailabilitySlot[]> {
  await ensureInitialized();
  return g.__memoryDeanSlots || DEFAULT_DEAN_SLOTS;
}

export async function saveDeanAvailabilitySlots(slots: DeanAvailabilitySlot[]): Promise<DeanAvailabilitySlot[]> {
  await ensureInitialized();
  g.__memoryDeanSlots = slots;
  await persistCurrentState();
  return slots;
}

export async function convertMeetingActionItemToTask(
  meetingId: number,
  actionItemId: string,
  creatorId: number
): Promise<{ task: any; meeting: Meeting } | null> {
  await ensureInitialized();
  const meetings: Meeting[] = g.__memoryMeetings || [];
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) return null;

  const actionItem = meeting.action_items.find(ai => ai.id === actionItemId);
  if (!actionItem) return null;

  const allStaff = getAllStaff();
  const assignedUser = allStaff.find(u => u.id === actionItem.assigned_to_id) || allStaff[0];
  const creatorUser = allStaff.find(u => u.id === creatorId) || allStaff.find(u => u.id === 6496)!;
  const currentTasks = g.__memoryTasks || [];
  const maxTaskId = currentTasks.length > 0 ? Math.max(...currentTasks.map((t: any) => t.id)) : 0;
  const newTaskId = maxTaskId + 1;

  const newTask = {
    id: newTaskId,
    title: actionItem.title,
    description: `Official Action Item generated from meeting: "${meeting.title}".\n\nMeeting Details:\n- Date: ${new Date(meeting.date).toLocaleDateString()}\n- Venue: ${meeting.location}\n- Chairperson: ${meeting.chair}\n- Focus/Objective: ${meeting.objective}`,
    assigned_by_id: creatorUser.id,
    assigned_to_id: actionItem.assigned_to_id,
    department: actionItem.department || assignedUser.department || 'Academic Staff',
    priority: actionItem.priority || 'high',
    deadline: actionItem.deadline || new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'pending',
    hat_id: meeting.hat_id || null,
    hat_name: meeting.hat_name || null,
    committee_id: meeting.committee_id || null,
    committee_name: meeting.committee_name || null,
    pillar_code: actionItem.pillar_code || null,
    pillar_name: actionItem.pillar_name || null,
    meeting_id: meeting.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  currentTasks.push(newTask);
  g.__memoryTasks = currentTasks;

  actionItem.task_id = newTaskId;
  actionItem.status = 'converted';
  meeting.status = meeting.action_items.every(ai => ai.status === 'completed' || ai.status === 'converted') ? 'completed' : 'action_items_pending';

  // Add activity log
  const maxLogId = (g.__memoryLogs || []).length > 0 ? Math.max(...(g.__memoryLogs || []).map((l: any) => l.id)) : 0;
  (g.__memoryLogs = g.__memoryLogs || []).unshift({
    id: maxLogId + 1,
    user_id: creatorUser.id,
    user_name: creatorUser.full_name,
    user_role: creatorUser.role,
    action_type: 'MEETING_ACTION_ITEM_DISPATCHED',
    task_id: newTaskId,
    title: 'Meeting Action Item Dispatched',
    details: `Dispatched action item "${actionItem.title}" to ${assignedUser.full_name} with deadline ${new Date(actionItem.deadline).toLocaleDateString()}.`,
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString(),
    task_title: newTask.title,
    user_department: creatorUser.department,
    user_avatar: creatorUser.avatar
  });

  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO tasks (
          id, title, description, assigned_by_id, assigned_to_id,
          department, priority, deadline, status, hat_id, committee_id, committee_name, meeting_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newTask.id,
        newTask.title,
        newTask.description,
        newTask.assigned_by_id,
        newTask.assigned_to_id,
        newTask.department,
        newTask.priority,
        newTask.deadline,
        newTask.status,
        newTask.hat_id,
        newTask.committee_id,
        newTask.committee_name,
        newTask.meeting_id,
        newTask.created_at,
        newTask.updated_at
      ).run();

      await db.prepare(`UPDATE meetings SET action_items = ?, status = ? WHERE id = ?`).bind(
        JSON.stringify(meeting.action_items),
        meeting.status,
        meeting.id
      ).run();
    } catch {}
  }

  return { task: newTask, meeting };
}

// ─────────────────────────────────────────────────────────────
// Web Push Notification Subscription Helpers
// ─────────────────────────────────────────────────────────────
export async function savePushSubscription(userId: number, subscription: any): Promise<void> {
  await ensureInitialized();
  const subs: any[] = g.__memorySubscriptions || [];
  const endpoint = subscription?.endpoint;
  if (!endpoint) return;

  const existingIdx = subs.findIndex(s => s.endpoint === endpoint);
  const entry = {
    userId,
    endpoint,
    keys: subscription.keys || {},
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    subs[existingIdx] = entry;
  } else {
    subs.push(entry);
  }

  g.__memorySubscriptions = subs;
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth, keys, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        userId,
        endpoint,
        subscription.keys?.p256dh || '',
        subscription.keys?.auth || '',
        JSON.stringify(subscription.keys || {})
      ).run();
    } catch {}
  }
}

export async function getPushSubscriptions(userId?: number): Promise<any[]> {
  await ensureInitialized();
  const db = getD1();
  if (db) {
    try {
      const sql = userId
        ? 'SELECT * FROM push_subscriptions WHERE user_id = ?'
        : 'SELECT * FROM push_subscriptions';
      const stmt = userId ? db.prepare(sql).bind(userId) : db.prepare(sql);
      const res = await stmt.all();
      if (res && Array.isArray(res.results) && res.results.length > 0) {
        return res.results.map((r: any) => ({
          userId: r.user_id,
          endpoint: r.endpoint,
          keys: typeof r.keys === 'string' ? JSON.parse(r.keys) : { p256dh: r.p256dh, auth: r.auth },
          updatedAt: r.updated_at,
        }));
      }
    } catch {}
  }

  const subs: any[] = g.__memorySubscriptions || [];
  if (userId) {
    return subs.filter(s => s.userId === userId);
  }
  return subs;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await ensureInitialized();
  const subs: any[] = g.__memorySubscriptions || [];
  g.__memorySubscriptions = subs.filter(s => s.endpoint !== endpoint);
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').bind(endpoint).run();
    } catch {}
  }
}

// ─────────────────────────────────────────────────────────────
// Official Faculty Standing Committees Helpers
// ─────────────────────────────────────────────────────────────
export async function getAllCommittees(): Promise<FacultyCommittee[]> {
  await ensureInitialized();
  const db = getD1();
  if (db) {
    try {
      const res = await db.prepare('SELECT * FROM committees ORDER BY id ASC').all();
      if (res && Array.isArray(res.results) && res.results.length > 0) {
        return res.results.map((r: any) => ({
          ...r,
          mandates: typeof r.mandates === 'string' ? JSON.parse(r.mandates) : r.mandates || [],
          members: typeof r.members === 'string' ? JSON.parse(r.members) : r.members || [],
        })) as FacultyCommittee[];
      }
    } catch (e) {
      console.warn('D1 committees fetch fallback:', e);
    }
  }
  return g.__memoryCommittees || OFFICIAL_FACULTY_COMMITTEES;
}

export async function getCommitteeById(id: number): Promise<FacultyCommittee | null> {
  await ensureInitialized();
  const db = getD1();
  if (db) {
    try {
      const res = await db.prepare('SELECT * FROM committees WHERE id = ?').bind(id).first();
      if (res) {
        return {
          ...res,
          mandates: typeof res.mandates === 'string' ? JSON.parse(res.mandates) : res.mandates || [],
          members: typeof res.members === 'string' ? JSON.parse(res.members) : res.members || [],
        } as FacultyCommittee;
      }
    } catch {}
  }
  const comms: FacultyCommittee[] = g.__memoryCommittees || OFFICIAL_FACULTY_COMMITTEES;
  return comms.find(c => c.id === id) || null;
}

export async function createCommittee(data: Omit<FacultyCommittee, 'id'>): Promise<FacultyCommittee> {
  await ensureInitialized();
  const comms: FacultyCommittee[] = g.__memoryCommittees || OFFICIAL_FACULTY_COMMITTEES;
  const newId = comms.length > 0 ? Math.max(...comms.map(c => c.id)) + 1 : 1;
  const newComm: FacultyCommittee = {
    ...data,
    id: newId,
    members: data.members || [],
    mandates: data.mandates || [],
  };
  comms.unshift(newComm);
  g.__memoryCommittees = comms;
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO committees (
          id, code, name, name_ar, category, decree_ref, chair_id, chair_name,
          chair_title, rapporteur_id, rapporteur_name, rapporteur_title, description,
          mandates, pillar_code, pillar_name, icon, color, members
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newComm.id,
        newComm.code,
        newComm.name,
        newComm.name_ar,
        newComm.category,
        newComm.decree_ref,
        newComm.chair_id,
        newComm.chair_name,
        newComm.chair_title,
        newComm.rapporteur_id,
        newComm.rapporteur_name,
        newComm.rapporteur_title,
        newComm.description,
        JSON.stringify(newComm.mandates),
        newComm.pillar_code,
        newComm.pillar_name,
        newComm.icon,
        newComm.color,
        JSON.stringify(newComm.members)
      ).run();
    } catch (e) {
      console.warn('D1 insert committee fallback:', e);
    }
  }

  return newComm;
}

export async function updateCommittee(id: number, data: Partial<FacultyCommittee>): Promise<FacultyCommittee | null> {
  await ensureInitialized();
  const comms: FacultyCommittee[] = g.__memoryCommittees || OFFICIAL_FACULTY_COMMITTEES;
  const idx = comms.findIndex(c => c.id === id);
  if (idx === -1) return null;
  comms[idx] = { ...comms[idx], ...data };
  g.__memoryCommittees = comms;
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare(`
        UPDATE committees SET
          name = ?, name_ar = ?, category = ?, decree_ref = ?, chair_id = ?, chair_name = ?,
          chair_title = ?, rapporteur_id = ?, rapporteur_name = ?, rapporteur_title = ?,
          description = ?, mandates = ?, pillar_code = ?, pillar_name = ?, icon = ?,
          color = ?, members = ?
        WHERE id = ?
      `).bind(
        comms[idx].name,
        comms[idx].name_ar,
        comms[idx].category,
        comms[idx].decree_ref,
        comms[idx].chair_id,
        comms[idx].chair_name,
        comms[idx].chair_title,
        comms[idx].rapporteur_id,
        comms[idx].rapporteur_name,
        comms[idx].rapporteur_title,
        comms[idx].description,
        JSON.stringify(comms[idx].mandates),
        comms[idx].pillar_code,
        comms[idx].pillar_name,
        comms[idx].icon,
        comms[idx].color,
        JSON.stringify(comms[idx].members),
        id
      ).run();
    } catch {}
  }

  return comms[idx];
}

export async function deleteCommittee(id: number): Promise<boolean> {
  await ensureInitialized();
  const comms: FacultyCommittee[] = g.__memoryCommittees || OFFICIAL_FACULTY_COMMITTEES;
  const filtered = comms.filter(c => c.id !== id);
  if (filtered.length === comms.length) return false;
  g.__memoryCommittees = filtered;
  await persistCurrentState();

  const db = getD1();
  if (db) {
    try {
      await db.prepare('DELETE FROM committees WHERE id = ?').bind(id).run();
    } catch {}
  }

  return true;
}
