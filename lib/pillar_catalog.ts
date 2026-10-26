import { InstitutionalPillar, PillarTaskTemplate } from '@/types';
export type { InstitutionalPillar, PillarTaskTemplate };

export const INSTITUTIONAL_PILLARS: InstitutionalPillar[] = [
  {
    id: 'pillar-a',
    code: 'A',
    name: 'Planning & Scheduling',
    icon: '📅',
    color: '#3b82f6',
    description: 'Faculty scheduling, academic timetables, exam supervision, and institutional events.',
    tasks: [
      {
        id: 'A-1',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Task Allocation',
        description: 'Assigns administrative and academic responsibilities to staff each semester.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 14
      },
      {
        id: 'A-2',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Course Instructors’ Supervision Schedule',
        description: 'Schedules course instructors for lab sessions and tutorials across all semesters.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'A-3',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Practical Exam Schedule',
        description: 'Creates and verifies the timetable and station distribution for practical lab examinations.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'high',
        estimated_days: 10
      },
      {
        id: 'A-4',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Final Practical Supervision Schedule',
        description: 'Assigns academic staff and invigilators to supervise the final practical exams.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'urgent',
        estimated_days: 7
      },
      {
        id: 'A-5',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Exams Proctoring Allocation Team',
        description: 'Manages assisting staff (TAs & LAs) assignment for proctoring midterm and final written exams.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'A-6',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Faculty Board Bulletin',
        description: 'Compiles, summarizes, and circulates the official bulletin documenting faculty board decisions.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 5
      },
      {
        id: 'A-7',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Spring Day Celebration Logistics',
        description: 'Organizes the annual Spring Day celebration, venue preparation, student activities, and logistics.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 21
      },
      {
        id: 'A-8',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'Charity Event & Community Outreach',
        description: 'Plans, coordinates, and executes the faculty’s charitable and community outreach initiatives.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 14
      },
      {
        id: 'A-9',
        pillar_id: 'A',
        pillar_name: 'Planning & Scheduling',
        title: 'High School Students Experimental Day',
        description: 'Coordinates wet-lab science exploration workshops and demonstrations for visiting high school students.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'medium',
        estimated_days: 10
      }
    ]
  },
  {
    id: 'pillar-b',
    code: 'B',
    name: 'Registration & Student Onboarding',
    icon: '🎓',
    color: '#10b981',
    description: 'Student admissions, course selections, graduation sign-ups, and student onboarding programs.',
    tasks: [
      {
        id: 'B-1',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Continuing Students Registration',
        description: 'Manages course registration for continuing students, resolving schedule conflicts and credit loads.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'urgent',
        estimated_days: 10
      },
      {
        id: 'B-2',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Newcomers Registration & File Audit',
        description: 'Handles formal admission, file auditing, and registration processing for incoming freshman students.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'high',
        estimated_days: 14
      },
      {
        id: 'B-3',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Graduation Project Registration',
        description: 'Facilitates sign-up and eligibility screening for senior students registering for graduation projects.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'B-4',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Newcomers Welcome Handout & Packages',
        description: 'Prepares and distributes welcome gifts, laboratory manuals, and orientation schedules to new students.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 7
      },
      {
        id: 'B-5',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Freshman Orientation Program',
        description: 'Designs and delivers the comprehensive faculty orientation program for incoming students.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'B-6',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Faculty Ambassador Program Coordination',
        description: 'Coordinates senior student and staff ambassadors assisting new staff and VIP academic visitors.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'medium',
        estimated_days: 14
      },
      {
        id: 'B-7',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Family Leaders Mentorship Program',
        description: 'Supervises peer mentors and family leaders guiding new students through faculty academic integration.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'medium',
        estimated_days: 14
      },
      {
        id: 'B-8',
        pillar_id: 'B',
        pillar_name: 'Registration & Student Onboarding',
        title: 'Prospective Applicants Consultation Meeting',
        description: 'Manages the faculty open reception and informational sessions addressing applicant inquiries.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 5
      }
    ]
  },
  {
    id: 'pillar-c',
    code: 'C',
    name: 'Academic Preparation',
    icon: '📚',
    color: '#8b5cf6',
    description: 'Curriculum delivery plans, syllabi alignment, exam moderation, and marking compliance.',
    tasks: [
      {
        id: 'C-1',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Course Assessment Alignment Review',
        description: 'Reviews assessments submitted by course instructors to ensure alignment with rubric and grade breakdown.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'C-2',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Course Weekly Teaching Plan',
        description: 'Formulates and approves the week-by-week teaching, tutorial, and practical plan for the semester.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'C-3',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Course Team Meeting Minutes',
        description: 'Prepares and logs minutes and action points from departmental meetings held with course instructors.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 5
      },
      {
        id: 'C-4',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Faculty Office Hours Publication',
        description: 'Compiles and schedules mandatory faculty office hours for student academic consultations.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 5
      },
      {
        id: 'C-5',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Coursework Submission Due Dates Schedule',
        description: 'Establishes faculty-wide coordinated deadlines for assignments and lab reports to avoid student overlap.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 5
      },
      {
        id: 'C-6',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Coursework Marking & Feedback Revision',
        description: 'Audits marked coursework submissions against marking criteria and validates feedback timeliness.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 10
      },
      {
        id: 'C-7',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Exam Moderation Committee Session',
        description: 'Convenes moderation committee to review, moderate, and approve midterm and final exam papers.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'urgent',
        estimated_days: 5
      },
      {
        id: 'C-8',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'Second Marking Verification Protocol',
        description: 'Implements double-marking and sample verification processes for final exam papers.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'urgent',
        estimated_days: 7
      },
      {
        id: 'C-9',
        pillar_id: 'C',
        pillar_name: 'Academic Preparation',
        title: 'TRN (Teaching & Research Needs) Requisition',
        description: 'Processes Teaching & Research Resource Needs requests for lab consumables, glassware, and kits.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'high',
        estimated_days: 10
      }
    ]
  },
  {
    id: 'pillar-d',
    code: 'D',
    name: 'Graduation Projects',
    icon: '🔬',
    color: '#06b6d4',
    description: 'Senior research supervision, thesis evaluation, ethics approvals, and external examination.',
    tasks: [
      {
        id: 'D-1',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Graduation Project Venue & Lab Allocation',
        description: 'Assigns senior research students to designated specialized research stations and external partner facilities.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'D-2',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Approved Research Topics Register File',
        description: 'Maintains and updates the official register of approved graduation project titles and supervisor pairings.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'D-3',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Ethics Committee Proposal Review',
        description: 'Submits and audits graduation project research proposals for bioethics compliance (human/animal subjects).',
        suggested_department: 'Academic Staff',
        suggested_priority: 'urgent',
        estimated_days: 14
      },
      {
        id: 'D-4',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Thesis & Manuscript Rubrics Review',
        description: 'Standardizes grading rubrics and criteria for thesis writing, data presentation, and scientific manuscripts.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 7
      },
      {
        id: 'D-5',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Scientific Manuscript Writing Sessions',
        description: 'Organizes faculty-led writing clinics supporting seniors in preparing journal manuscripts and thesis drafts.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 10
      },
      {
        id: 'D-6',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Senior Submissions Portal & Plagiarism Check',
        description: 'Manages digital form submission for senior theses and conducts Turnitin similarity index verification.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'D-7',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Internal Thesis Evaluation & Screening',
        description: 'Coordinates initial departmental blind reviews of submitted student theses prior to discussion day.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 10
      },
      {
        id: 'D-8',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Graduation Discussion Day Preparation',
        description: 'Prepares examination rooms, external examiner invitations, thank-you letters, and welcome packages.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'urgent',
        estimated_days: 14
      },
      {
        id: 'D-9',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'Graduation Project Marks Audit & Ledger Review',
        description: 'Audits and aggregates final grades submitted by internal supervisors and external defense juries.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'urgent',
        estimated_days: 5
      },
      {
        id: 'D-10',
        pillar_id: 'D',
        pillar_name: 'Graduation Projects',
        title: 'External Examiner Logistics & Special Requests',
        description: 'Fulfills requests from visiting external professors for equipment, honoraria, and special accommodations.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 7
      }
    ]
  },
  {
    id: 'pillar-e',
    code: 'E',
    name: 'Quality Assurance & Accreditation',
    icon: '🏆',
    color: '#eab308',
    description: 'National and international accreditation compliance (NAQAAE, Greenwich UoG partnership).',
    tasks: [
      {
        id: 'E-1',
        pillar_id: 'E',
        pillar_name: 'Quality Assurance & Accreditation',
        title: 'NAQAAE Institutional Standards Audit',
        description: 'Reviews course specifications, ILO mapping matrices, and program annual self-study reports for NAQAAE.',
        suggested_department: 'Quality & Accreditation Office',
        suggested_priority: 'urgent',
        estimated_days: 21
      },
      {
        id: 'E-2',
        pillar_id: 'E',
        pillar_name: 'Quality Assurance & Accreditation',
        title: 'Greenwich (UoG) Moderation Visit Preparation',
        description: 'Prepares module boxes, sample exam scripts, student coursework, and link tutor coordination for UoG visit.',
        suggested_department: 'Quality & Accreditation Office',
        suggested_priority: 'urgent',
        estimated_days: 14
      },
      {
        id: 'E-3',
        pillar_id: 'E',
        pillar_name: 'Quality Assurance & Accreditation',
        title: 'Module Monitoring Reports (MMRs) Review',
        description: 'Collects, audits, and archives end-of-semester MMRs across all faculty undergraduate modules.',
        suggested_department: 'Quality & Accreditation Office',
        suggested_priority: 'high',
        estimated_days: 10
      },
      {
        id: 'E-4',
        pillar_id: 'E',
        pillar_name: 'Quality Assurance & Accreditation',
        title: 'Board of Study Minutes & Follow-up Actions',
        description: 'Drafts official Board of Study proceedings with student representatives and tracks agreed action items.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 7
      }
    ]
  },
  {
    id: 'pillar-f',
    code: 'F',
    name: 'Operations & Logistics',
    icon: '⚙️',
    color: '#f97316',
    description: 'Laboratory supplies, animal research facility protocols, equipment calibration, and facilities.',
    tasks: [
      {
        id: 'F-1',
        pillar_id: 'F',
        pillar_name: 'Operations & Logistics',
        title: 'Biological Specimen & Chemical Reagents Procurement',
        description: 'Coordinates chemical inventory, DNA polymerases, primers, culture media, and hazardous waste disposal.',
        suggested_department: 'Laboratories & Research Stations',
        suggested_priority: 'high',
        estimated_days: 14
      },
      {
        id: 'F-2',
        pillar_id: 'F',
        pillar_name: 'Operations & Logistics',
        title: 'Animal Research Vivarium Protocol Audit',
        description: 'Audits veterinary care logs, feed inventory, ethical housing, and breeding conditions in the animal house.',
        suggested_department: 'Laboratories & Research Stations',
        suggested_priority: 'urgent',
        estimated_days: 7
      },
      {
        id: 'F-3',
        pillar_id: 'F',
        pillar_name: 'Operations & Logistics',
        title: 'Lab Equipment Calibration & Preventative Maintenance',
        description: 'Inspects and certifies PCR thermocyclers, autoclaves, spectrophotometers, and biosafety laminar flow hoods.',
        suggested_department: 'Laboratories & Research Stations',
        suggested_priority: 'high',
        estimated_days: 10
      },
      {
        id: 'F-4',
        pillar_id: 'F',
        pillar_name: 'Operations & Logistics',
        title: 'Event Ushers & Floor Logistics Organization',
        description: 'Briefs assisting staff and student ushers for crowd management, registration desks, and VIP logistics.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'medium',
        estimated_days: 5
      }
    ]
  },
  {
    id: 'pillar-g',
    code: 'G',
    name: 'Student Monitoring & Advisory',
    icon: '👥',
    color: '#ec4899',
    description: 'Academic probation tracking, lab attendance enforcement, misconduct hearings, and medical leaves.',
    tasks: [
      {
        id: 'G-1',
        pillar_id: 'G',
        pillar_name: 'Student Monitoring & Advisory',
        title: 'On-Probation Student Performance Tracking',
        description: 'Reviews GPA thresholds, arranges mandatory academic advising sessions, and monitors study plans.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'G-2',
        pillar_id: 'G',
        pillar_name: 'Student Monitoring & Advisory',
        title: 'Lab Attendance & Absence Warning Issuance',
        description: 'Scans practical attendance records and issues formal first and second warnings for excessive absence.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'high',
        estimated_days: 5
      },
      {
        id: 'G-3',
        pillar_id: 'G',
        pillar_name: 'Student Monitoring & Advisory',
        title: 'Academic Misconduct Disciplinary Committee',
        description: 'Investigates reported examination infractions or severe plagiarism and submits recommendations to Dean.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'urgent',
        estimated_days: 5
      },
      {
        id: 'G-4',
        pillar_id: 'G',
        pillar_name: 'Student Monitoring & Advisory',
        title: 'Medical Excuses Validation & Make-up Exam Roster',
        description: 'Validates submitted hospital and clinic documentation to determine eligibility for make-up assessments.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 5
      }
    ]
  },
  {
    id: 'pillar-h',
    code: 'H',
    name: 'Research, Innovation & Competitions',
    icon: '💡',
    color: '#14b8a6',
    description: 'National scientific competitions (SOLE), patent prototyping, and faculty scientific journal.',
    tasks: [
      {
        id: 'H-1',
        pillar_id: 'H',
        pillar_name: 'Research, Innovation & Competitions',
        title: 'SOLE National Competition Team Mentorship',
        description: 'Prepares and coaches student biotechnology teams competing in the Science Olympiad / SOLE national event.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 30
      },
      {
        id: 'H-2',
        pillar_id: 'H',
        pillar_name: 'Research, Innovation & Competitions',
        title: 'Faculty Biotechnology Journal Manuscript Review',
        description: 'Coordinates peer-review assignments, formatting compliance, and publication layout for the faculty journal.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 21
      }
    ]
  },
  {
    id: 'pillar-i',
    code: 'I',
    name: 'Communication & Public Relations',
    icon: '📢',
    color: '#f43f5e',
    description: 'Public health awareness, scientific conferences, media coverage, and annual award celebrations.',
    tasks: [
      {
        id: 'I-1',
        pillar_id: 'I',
        pillar_name: 'Communication & Public Relations',
        title: 'Public Health & Biotechnology Awareness Campaign',
        description: 'Designs infographics and coordinates community public health campaigns (genomics, breast cancer, vaccines).',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 14
      },
      {
        id: 'I-2',
        pillar_id: 'I',
        pillar_name: 'Communication & Public Relations',
        title: 'Annual Biotechnology Conference Organization',
        description: 'Manages keynote speaker invitations, abstract proceedings, poster sessions, and sponsorship outreach.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'urgent',
        estimated_days: 45
      },
      {
        id: 'I-3',
        pillar_id: 'I',
        pillar_name: 'Communication & Public Relations',
        title: 'Annual Faculty Award Day Celebration',
        description: 'Prepares honorary certificates, trophies, and ceremonies recognizing top faculty researchers and graduates.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'high',
        estimated_days: 21
      },
      {
        id: 'I-4',
        pillar_id: 'I',
        pillar_name: 'Communication & Public Relations',
        title: 'Scientific Social Media & Media Outreach Coverage',
        description: 'Drafts scientific press releases and media highlights covering faculty breakthroughs and honors.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'low',
        estimated_days: 7
      }
    ]
  },
  {
    id: 'pillar-j',
    code: 'J',
    name: 'Academic Documentation & Archiving',
    icon: '📁',
    color: '#6366f1',
    description: 'Central course drives, annual faculty achievement book, bilingual translations, and exam archives.',
    tasks: [
      {
        id: 'J-1',
        pillar_id: 'J',
        pillar_name: 'Academic Documentation & Archiving',
        title: 'Faculty Course Cloud Drive Audit',
        description: 'Audits standardized cloud folders ensuring syllabi, lectures, model answers, and student samples are backed up.',
        suggested_department: 'Assisting Staff (TAs & LAs)',
        suggested_priority: 'high',
        estimated_days: 10
      },
      {
        id: 'J-2',
        pillar_id: 'J',
        pillar_name: 'Academic Documentation & Archiving',
        title: 'Annual Faculty Achievement Book Production',
        description: 'Gathers departmental publications, research grants, patents, and community activities into the annual volume.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 30
      },
      {
        id: 'J-3',
        pillar_id: 'J',
        pillar_name: 'Academic Documentation & Archiving',
        title: 'Bilingual (Arabic/English) Official Documents Review',
        description: 'Verifies accurate translation and legal alignment of official faculty regulations, bylaws, and certificates.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 10
      },
      {
        id: 'J-4',
        pillar_id: 'J',
        pillar_name: 'Academic Documentation & Archiving',
        title: 'Central Exam Papers & Secret Numbering Archive',
        description: 'Safely stores final written exam scripts, marking sheets, and secret control sheets in the secure archive.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'urgent',
        estimated_days: 7
      }
    ]
  },
  {
    id: 'pillar-k',
    code: 'K',
    name: 'Training & Staff Development',
    icon: '🛠️',
    color: '#0284c7',
    description: 'Onboarding tutorials for junior staff, molecular wet-lab workshops, and lab technician safety certifications.',
    tasks: [
      {
        id: 'K-1',
        pillar_id: 'K',
        pillar_name: 'Training & Staff Development',
        title: 'Newly Hired Assisting Staff Onboarding Bootcamp',
        description: 'Conducts intensive orientation on teaching methods, grading integrity, and LMS portal administration.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 7
      },
      {
        id: 'K-2',
        pillar_id: 'K',
        pillar_name: 'Training & Staff Development',
        title: 'TAs & LAs Molecular Biology Technical Workshops',
        description: 'Organizes hands-on professional development sessions on CRISPR gene editing, qPCR, and flow cytometry.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'medium',
        estimated_days: 14
      },
      {
        id: 'K-3',
        pillar_id: 'K',
        pillar_name: 'Training & Staff Development',
        title: 'Laboratory Technicians Biosafety & Hazardous Waste Training',
        description: 'Delivers biosafety certification training, autoclave operation guidelines, and chemical spill protocols.',
        suggested_department: 'Laboratories & Research Stations',
        suggested_priority: 'urgent',
        estimated_days: 7
      }
    ]
  },
  {
    id: 'pillar-l',
    code: 'L',
    name: 'External Relations & Partnerships',
    icon: '🤝',
    color: '#059669',
    description: 'National and international protocols (Vacsera, 57357 Hospital, Eva Pharma) and alumni career placement.',
    tasks: [
      {
        id: 'L-1',
        pillar_id: 'L',
        pillar_name: 'External Relations & Partnerships',
        title: 'Collaboration Protocol Renewal (Vacsera & 57357)',
        description: 'Reviews and extends partnership agreements for joint cancer research, vaccine production, and clinical training.',
        suggested_department: 'Faculty Leadership',
        suggested_priority: 'urgent',
        estimated_days: 21
      },
      {
        id: 'L-2',
        pillar_id: 'L',
        pillar_name: 'External Relations & Partnerships',
        title: 'Industrial Internship Placement Agreement (Eva Pharma)',
        description: 'Secures summer industrial training slots and industrial graduation project topics with pharmaceutical partners.',
        suggested_department: 'Academic Staff',
        suggested_priority: 'high',
        estimated_days: 14
      },
      {
        id: 'L-3',
        pillar_id: 'L',
        pillar_name: 'External Relations & Partnerships',
        title: 'Alumni Employment Tracker & Career Fair',
        description: 'Monitors employment rates of biotech alumni, builds alumni directory, and coordinates annual job fair.',
        suggested_department: 'Academic Administration',
        suggested_priority: 'medium',
        estimated_days: 21
      }
    ]
  }
];

export function getPillarByCode(code: string): InstitutionalPillar | undefined {
  return INSTITUTIONAL_PILLARS.find(p => p.code.toUpperCase() === code.toUpperCase());
}

export function getAllPillarTasks(): PillarTaskTemplate[] {
  return INSTITUTIONAL_PILLARS.flatMap(p => p.tasks);
}
