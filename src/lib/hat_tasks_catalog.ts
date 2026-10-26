// Official 16 Faculty Hats and their Specific Operational Tasks / Focus Areas
// As defined by Faculty Leadership - Faculty of Biotechnology, MSA University

export interface HatTaskDefinition {
  hatName: string;
  hasSubTasks: boolean;
  tasks: string[];
}

export const FACULTY_HATS_CATALOG: HatTaskDefinition[] = [
  {
    hatName: 'Corporate Social Responsibilities',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Graduate Affairs',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Learning and Development',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Center of Excellence',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Onboarding Ambassadors',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Strategic Planning',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Purchasing',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Internal Audit',
    hasSubTasks: false,
    tasks: []
  },
  {
    hatName: 'Events',
    hasSubTasks: true,
    tasks: [
      'Conferences',
      'Seminars',
      'Events',
      'Exhibitions',
      'Awareness Campaigns'
    ]
  },
  {
    hatName: 'Research',
    hasSubTasks: true,
    tasks: [
      'Journals & Publications',
      'Research'
    ]
  },
  {
    hatName: 'Student Affairs',
    hasSubTasks: true,
    tasks: [
      'Students Activities',
      'Students\' Complaints',
      'Academic Advising',
      'Probation',
      'Registration',
      'Family Leaders',
      'Training and Internships',
      'Scheduling',
      'Transfer and Equalization',
      'Outstanding & Creative Students',
      'Course File',
      'Student Affairs',
      'Attendance',
      'International Student'
    ]
  },
  {
    hatName: 'Quality',
    hasSubTasks: true,
    tasks: [
      'National Accreditation',
      'International Validation',
      'QS Ranking',
      'Questionnaires',
      'Quality'
    ]
  },
  {
    hatName: 'Learning',
    hasSubTasks: true,
    tasks: [
      'International/National Co-operation',
      'Books & Publications',
      'Graduation Projects',
      'Curriculum Development',
      'E-Learning',
      'Ethics',
      'Portfolios Management',
      'Learning'
    ]
  },
  {
    hatName: 'Exams Moderation',
    hasSubTasks: true,
    tasks: [
      'Faculty Control Unit',
      'Proctoring Attendance',
      'Control Results',
      'Exams Appeals',
      'Practical Exams',
      'Marking'
    ]
  },
  {
    hatName: 'Labs and Studios',
    hasSubTasks: true,
    tasks: [
      'Production Lab',
      'MCOM Studios Channel',
      'Labs and Studios',
      'Equipment Maintenance'
    ]
  },
  {
    hatName: 'Unique',
    hasSubTasks: true,
    tasks: [
      'Infection Control',
      'Continuous Education',
      'Postgraduate Study Bylaws',
      'Center of Earth',
      'Postgraduate Studies Database',
      'Promotional Material',
      'Educational Pharmacy',
      'Intellectual Property',
      'Digitalization of Faculty Databases',
      'Staff Evaluation by PG Certified',
      'Writing and Support Center',
      'Hospital/Clinics',
      'Entrepreneurship Hub',
      'Scientific Committee',
      'Interprofessional Education (IPE)',
      'Animal House',
      'English Units',
      'Non-core Courses Coordinator (Miscellaneous)'
    ]
  }
];

export function getSubTasksForHat(hatName: string | null | undefined): string[] {
  if (!hatName) return [];
  const found = FACULTY_HATS_CATALOG.find(
    h => h.hatName.toLowerCase().trim() === hatName.toLowerCase().trim()
  );
  return found ? found.tasks : [];
}
