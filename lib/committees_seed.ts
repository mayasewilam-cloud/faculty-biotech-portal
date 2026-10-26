export interface FacultyCommittee {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  category: 'statutory' | 'standing' | 'council';
  decree_ref: string;
  chair_id: number;
  chair_name: string;
  chair_title: string;
  rapporteur_id: number;
  rapporteur_name: string;
  rapporteur_title: string;
  description: string;
  mandates: string[];
  pillar_code: string;
  pillar_name: string;
  icon: string;
  color: string;
  members: {
    user_id: number;
    name: string;
    title: string;
    role: string;
    department: string;
  }[];
}

export const OFFICIAL_FACULTY_COMMITTEES: FacultyCommittee[] = [
  {
    id: 1,
    code: 'QAAC',
    name: 'Accreditation & Quality Assurance Standing Committee',
    name_ar: 'لجنة الجودة والاعتماد الأكاديمي الدائمة',
    category: 'standing',
    decree_ref: 'Faculty Council Decree #104 - Statutory NAQAAE Mandate',
    chair_id: 6496,
    chair_name: 'Prof. Dr. Gehan Safwat',
    chair_title: 'Dean of Faculty',
    rapporteur_id: 6591,
    rapporteur_name: 'Prof. Dr. Amr Ageez',
    rapporteur_title: 'Vice Dean for Academic Affairs',
    description: 'Statutory institutional committee tasked with driving NAQAAE national and international accreditation, institutional self-study reports, and learning outcome benchmarks across all biotechnology academic programs.',
    mandates: [
      'Comprehensive Course Learning Outcome (CLO) & Program Learning Outcome (PLO) matrix mapping',
      'Annual Institutional Self-Study Dossier compilation for NAQAAE accreditation renewal',
      'Quality audit on semester practical and theoretical examination blueprints',
      'Departmental quality assurance file reviews and continuous improvement action plans'
    ],
    pillar_code: 'E',
    pillar_name: 'Quality Assurance & Institutional Accreditation',
    icon: '🎓',
    color: '#3b82f6',
    members: [
      { user_id: 6496, name: 'Prof. Dr. Gehan Safwat', title: 'Prof. Dr.', role: 'Dean & Committee Chair', department: "Dean's Executive Office" },
      { user_id: 6591, name: 'Prof. Dr. Amr Ageez', title: 'Prof. Dr.', role: 'Vice Dean & Rapporteur', department: "Dean's Executive Office" },
      { user_id: 14191, name: 'Prof. Dr. Rania Amer', title: 'Prof. Dr.', role: 'Senior Quality Representative', department: 'Academic Staff' },
      { user_id: 13537, name: 'Assoc. Prof. Dr. Nehal Fahmy', title: 'Assoc. Prof. Dr.', role: 'Accreditation Officer', department: 'Academic Staff' },
      { user_id: 12228, name: 'Dr. Yasmine El-Gohary', title: 'Dr.', role: 'Quality Unit Coordinator', department: 'Academic Staff' },
      { user_id: 9783, name: 'Dr. Noha Hegazy', title: 'Dr.', role: 'CLO Verification Lead', department: 'Academic Staff' }
    ]
  },
  {
    id: 2,
    code: 'ECB',
    name: 'Examinations, Moderation & Control Board',
    name_ar: 'لجنة الامتحانات والمراجعة والكنترول المركزي',
    category: 'statutory',
    decree_ref: 'Faculty Council Statutory Bylaw - Article 42',
    chair_id: 7065,
    chair_name: 'Prof. Dr. Ahmed Aref',
    chair_title: 'Head of Examination Control Board',
    rapporteur_id: 14237,
    rapporteur_name: 'Assoc. Prof. Dr. Mostafa El-Deeb',
    rapporteur_title: 'Control Board Secretary & Senior Examiner',
    description: 'Official faculty statutory board responsible for exam security, question bank adherence, practical lab assessment timetables, double-marking protocols, and semester grading audit trails.',
    mandates: [
      'Secured question bank deposition and sealed examination envelope protocols',
      'Mandatory double-marking (second marking) sample verification across passed scripts',
      'Midterm and final practical examination laboratory schedule orchestration',
      'Control board ledger audit and official grade ratification for the Faculty Board'
    ],
    pillar_code: 'C',
    pillar_name: 'Academic Preparation & Examination Moderation',
    icon: '📝',
    color: '#10b981',
    members: [
      { user_id: 7065, name: 'Prof. Dr. Ahmed Aref', title: 'Prof. Dr.', role: 'Control Board Lead', department: 'Academic Staff' },
      { user_id: 14237, name: 'Assoc. Prof. Dr. Mostafa El-Deeb', title: 'Assoc. Prof. Dr.', role: 'Senior Examiner', department: 'Academic Staff' },
      { user_id: 4916, name: 'Dr. Reham Osman', title: 'Dr.', role: 'Moderation Secretary', department: 'Academic Staff' },
      { user_id: 12065, name: 'Dr. Mayar Mohamed', title: 'Dr.', role: 'Control Officer', department: 'Academic Staff' },
      { user_id: 14686, name: 'Ms. Menna Hussein', title: 'Senior Registrar', role: 'Examinations Records Lead', department: 'Academic Administration' },
      { user_id: 6591, name: 'Prof. Dr. Amr Ageez', title: 'Prof. Dr.', role: 'Vice Dean (Executive Oversight)', department: "Dean's Executive Office" }
    ]
  },
  {
    id: 3,
    code: 'LBSC',
    name: 'Laboratories, Research Stations & Biosafety Standing Committee',
    name_ar: 'لجنة المعامل والمحطات البحثية والسلامة الحيوية',
    category: 'standing',
    decree_ref: 'University Biosafety & Lab Operations Standard - Decree #88',
    chair_id: 13480,
    chair_name: 'Prof. Dr. Khaled El-Din',
    chair_title: 'Director of Central Research Labs',
    rapporteur_id: 6835,
    rapporteur_name: 'Assoc. Prof. Dr. Sherif Shawky',
    rapporteur_title: 'Senior Biosafety Officer',
    description: 'Official standing committee regulating laboratory safety, chemical waste containment, PCR and automated sequencer calibration logs, and hands-on laboratory infrastructure across Building G.',
    mandates: [
      'Biosafety Level 1 and Level 2 laboratory containment certification and compliance',
      'Routine autoclave, electrophoresis station, and PCR thermocycler calibration audits',
      'Hazardous biochemical waste disposal protocol enforcement',
      'Teaching assistant and research assistant laboratory safety orientation and licensing'
    ],
    pillar_code: 'F',
    pillar_name: 'Laboratories & Practical Training Infrastructure',
    icon: '🧪',
    color: '#f59e0b',
    members: [
      { user_id: 13480, name: 'Prof. Dr. Khaled El-Din', title: 'Prof. Dr.', role: 'Lab Directorate Lead', department: 'Academic Staff' },
      { user_id: 6835, name: 'Assoc. Prof. Dr. Sherif Shawky', title: 'Assoc. Prof. Dr.', role: 'Biosafety Officer', department: 'Academic Staff' },
      { user_id: 12600, name: 'Dr. Dina Mansour', title: 'Dr.', role: 'Equipment Logs Manager', department: 'Academic Staff' },
      { user_id: 15720, name: 'Eng. Mahmoud Hassan', title: 'Eng.', role: 'Chief Laboratory Engineer', department: 'Laboratories & Research Stations' },
      { user_id: 15683, name: 'Ms. Salma Adel', title: 'Research Specialist', role: 'Chemical Inventory Specialist', department: 'Laboratories & Research Stations' }
    ]
  },
  {
    id: 4,
    code: 'CSPC',
    name: 'Curriculum & Academic Study Plans Standing Committee',
    name_ar: 'لجنة المناهج والخطط الدراسية وتطوير البرامج',
    category: 'standing',
    decree_ref: 'Academic Council Charter - Article 18',
    chair_id: 14191,
    chair_name: 'Prof. Dr. Rania Amer',
    chair_title: 'Senior Professor of Molecular Biology',
    rapporteur_id: 13537,
    rapporteur_name: 'Assoc. Prof. Dr. Nehal Fahmy',
    rapporteur_title: 'Head of Curriculum Development',
    description: 'Official faculty committee governing the review, benchmarking, and development of undergraduate biotechnology degree tracks, credit-hour distributions, and international equivalency standards.',
    mandates: [
      'Periodic review and modern updates to molecular genetics, bioinformatics, and plant tissue curricula',
      'Integration of modern biotechnology industry competencies and computational genomics',
      'Course prerequisite structure monitoring and syllabus modernization',
      'Validation of practical-to-theoretical contact hour ratios across all semesters'
    ],
    pillar_code: 'B',
    pillar_name: 'Curriculum Benchmarking & Program Architecture',
    icon: '📚',
    color: '#8b5cf6',
    members: [
      { user_id: 14191, name: 'Prof. Dr. Rania Amer', title: 'Prof. Dr.', role: 'Curriculum Chair', department: 'Academic Staff' },
      { user_id: 13537, name: 'Assoc. Prof. Dr. Nehal Fahmy', title: 'Assoc. Prof. Dr.', role: 'Rapporteur', department: 'Academic Staff' },
      { user_id: 7065, name: 'Prof. Dr. Ahmed Aref', title: 'Prof. Dr.', role: 'Academic Member', department: 'Academic Staff' },
      { user_id: 4916, name: 'Dr. Reham Osman', title: 'Dr.', role: 'Module Specialist', department: 'Academic Staff' },
      { user_id: 6496, name: 'Prof. Dr. Gehan Safwat', title: 'Prof. Dr.', role: 'Dean (Advisor)', department: "Dean's Executive Office" }
    ]
  },
  {
    id: 5,
    code: 'PSRC',
    name: 'Postgraduate Studies & Scientific Research Council',
    name_ar: 'مجلس الدراسات العليا والبحوث العلمية بالكلية',
    category: 'council',
    decree_ref: 'University Research Board Mandate #54',
    chair_id: 6496,
    chair_name: 'Prof. Dr. Gehan Safwat',
    chair_title: 'Dean of Faculty',
    rapporteur_id: 13480,
    rapporteur_name: 'Prof. Dr. Khaled El-Din',
    rapporteur_title: 'Research Committee Secretary',
    description: 'Official governance council overseeing Master and Doctoral candidate registrations, ethical research approvals, scientific publication incentives in Q1 journals, and biotechnology patent filings.',
    mandates: [
      'Dissertation defense board approvals and external examiner appointments',
      'Review of biotechnology research protocols for institutional bioethics clearance',
      'Allocation of faculty competitive research seed funds and equipment utilization grants',
      'Tracking faculty peer-reviewed publication metrics in international high-impact journals'
    ],
    pillar_code: 'G',
    pillar_name: 'Scientific Research & Postgraduate Studies',
    icon: '🔬',
    color: '#ec4899',
    members: [
      { user_id: 6496, name: 'Prof. Dr. Gehan Safwat', title: 'Prof. Dr.', role: 'Council Chair / Dean', department: "Dean's Executive Office" },
      { user_id: 13480, name: 'Prof. Dr. Khaled El-Din', title: 'Prof. Dr.', role: 'Research Secretary', department: 'Academic Staff' },
      { user_id: 14191, name: 'Prof. Dr. Rania Amer', title: 'Prof. Dr.', role: 'Senior Research Fellow', department: 'Academic Staff' },
      { user_id: 6835, name: 'Assoc. Prof. Dr. Sherif Shawky', title: 'Assoc. Prof. Dr.', role: 'Ethics Reviewer', department: 'Academic Staff' }
    ]
  },
  {
    id: 6,
    code: 'SAAC',
    name: 'Student Affairs & Academic Advising Standing Committee',
    name_ar: 'لجنة شؤون التعليم والطلاب والإرشاد الأكاديمي',
    category: 'standing',
    decree_ref: 'Faculty Student By-Laws - Resolution #31',
    chair_id: 6591,
    chair_name: 'Prof. Dr. Amr Ageez',
    chair_title: 'Vice Dean for Academic Affairs',
    rapporteur_id: 6417,
    rapporteur_name: 'Dr. Tamer Salem',
    rapporteur_title: 'Chief Academic Advisor',
    description: 'Official committee monitoring student academic standing, intervention plans for students on academic probation, lab section quotas, student scientific societies, and academic appeals.',
    mandates: [
      'Proactive monitoring of student CGPA thresholds and academic warning interventions',
      'Adjudication of student petitions, excused absences, and practical lab makeup sessions',
      'Coordination of faculty advisors assigned to undergraduate cohorts',
      'Promotion of student scientific activities, biotechnology exhibitions, and conferences'
    ],
    pillar_code: 'D',
    pillar_name: 'Student Academic Advising & Support Services',
    icon: '👥',
    color: '#06b6d4',
    members: [
      { user_id: 6591, name: 'Prof. Dr. Amr Ageez', title: 'Prof. Dr.', role: 'Committee Chair / Vice Dean', department: "Dean's Executive Office" },
      { user_id: 6417, name: 'Dr. Tamer Salem', title: 'Dr.', role: 'Chief Academic Advisor', department: 'Academic Staff' },
      { user_id: 9580, name: 'Dr. Heba Gamal', title: 'Dr.', role: 'Advising Lead', department: 'Academic Staff' },
      { user_id: 15714, name: 'Ms. Aya Tarek', title: 'Senior TA', role: 'Student Liaison Officer', department: 'Assisting Staff (TAs & LAs)' },
      { user_id: 14686, name: 'Ms. Menna Hussein', title: 'Senior Registrar', role: 'Student Records Secretary', department: 'Academic Administration' }
    ]
  },
  {
    id: 7,
    code: 'CSEDC',
    name: 'Community Service & Environmental Development Committee',
    name_ar: 'لجنة خدمة المجتمع وتنمية البيئة والتواصل المجتمعي',
    category: 'standing',
    decree_ref: 'University Social Engagement Statute #19',
    chair_id: 14237,
    chair_name: 'Assoc. Prof. Dr. Mostafa El-Deeb',
    chair_title: 'Associate Professor & Community Lead',
    rapporteur_id: 12698,
    rapporteur_name: 'Dr. Radwa Ahmed',
    rapporteur_title: 'Outreach & Internship Coordinator',
    description: 'Official faculty committee managing industrial biotechnology internships, high school experimental days, environmental awareness seminars, and community biotechnology applications.',
    mandates: [
      'Annual High School Students Experimental Day coordination and biotechnology outreach',
      'Industrial training and internship placement with pharmaceutical and biotechnology partners',
      'Environmental biosafety awareness workshops and local community health campaigns',
      'Alumni tracking, career fair participation, and graduate employability enhancement'
    ],
    pillar_code: 'A',
    pillar_name: 'Planning, Outreach & Community Engagement',
    icon: '🌍',
    color: '#14b8a6',
    members: [
      { user_id: 14237, name: 'Assoc. Prof. Dr. Mostafa El-Deeb', title: 'Assoc. Prof. Dr.', role: 'Committee Chair', department: 'Academic Staff' },
      { user_id: 12698, name: 'Dr. Radwa Ahmed', title: 'Dr.', role: 'Outreach Coordinator', department: 'Academic Staff' },
      { user_id: 14686, name: 'Ms. Menna Hussein', title: 'Senior Registrar', role: 'Logistics Coordinator', department: 'Academic Administration' },
      { user_id: 15684, name: 'Mr. Omar Khaled', title: 'Research Specialist', role: 'Event Coordinator', department: 'Laboratories & Research Stations' }
    ]
  }
];
