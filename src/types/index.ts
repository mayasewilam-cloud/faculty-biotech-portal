export interface User {
  id: number;
  email: string;
  full_name: string;
  title: string;
  role: 'admin' | 'dean' | 'vice_dean' | 'dept_head' | 'professor' | 'staff';
  department: string;
  phone?: string;
  avatar?: string;
  status?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  assigned_by_id: number;
  assigned_to_id: number;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  status: 'pending' | 'in_progress' | 'done' | 'revision_requested';
  completion_notes?: string;
  completion_url?: string;
  completed_at?: string;
  dean_feedback?: string;
  dean_acknowledged?: number;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
  assignee_name: string;
  assignee_title: string;
  assignee_email: string;
  assignee_role: string;
  assignee_department: string;
  assignee_avatar?: string;
  creator_name: string;
  creator_title: string;
  hat_id?: number | null;
  hat_name?: string | null;
  hat_icon?: string | null;
  hat_color?: string | null;
  committee_id?: number | null;
  committee_name?: string | null;
  pillar_code?: string | null;
  pillar_name?: string | null;
  meeting_id?: number | null;
  tr?: number | null;
  start_date?: string | null;
  due_time?: string | null;
  comment_type?: string | null;
  received_by?: string | null;
  form_link?: string | null;
  submission_type?: 'file_upload' | 'external_link' | 'form_fill' | 'standard';
  is_confidential?: boolean | number;
  request_prompt?: string | null;
  group_id?: string | null;
  task_owner_id?: number | null;
  task_owner_name?: string | null;
  requires_dean_approval?: boolean | number;
  responsibility_model?: 'shared_deliverable' | 'individual_submissions' | 'standard';
  parent_task_id?: number | null;
  drive_link?: string | null;
  action_plan?: string | null;
}

export interface ConfidentialSubmissionRequest {
  title: string;
  description: string;
  submission_type: 'file_upload' | 'external_link' | 'form_fill';
  form_link?: string;
  assignee_ids: number[];
  due_date: string;
  due_time?: string;
  start_date?: string;
  is_confidential: boolean;
  comment_type?: string;
}

export interface PillarTaskTemplate {
  id: string;
  pillar_id: string;
  pillar_name: string;
  title: string;
  description: string;
  suggested_department: string;
  suggested_priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_days?: number;
}

export interface InstitutionalPillar {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  tasks: PillarTaskTemplate[];
}

export interface HatMember {
  id: number;
  hat_id: number;
  user_id: number;
  role_in_hat: string;
  joined_at: string;
  user_name: string;
  user_email: string;
  user_title: string;
  user_role: string;
  user_department: string;
  user_avatar?: string;
}

export interface Hat {
  id: number;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  members: HatMember[];
  member_count: number;
  active_tasks_count: number;
  pillar_code?: string | null;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action_type: string;
  task_id?: number;
  title: string;
  details?: string;
  metadata?: string;
  ip_address: string;
  created_at: string;
  user_avatar?: string;
  user_department?: string;
  task_title?: string;
}

export interface AnalyticsData {
  metrics: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    totalStaff: number;
    completionRate: number;
  };
  deptStats: Array<{
    department: string;
    total: number;
    done: number;
    in_progress: number;
    pending: number;
    overdue: number;
  }>;
  recentActivity: ActivityLog[];
}

export interface MeetingAttendee {
  user_id?: number;
  name: string;
  email?: string;
  role: string;
  department?: string;
  attended?: boolean;
}

export interface MeetingActionItem {
  id: string;
  meeting_id: number;
  title: string;
  assigned_to_id: number;
  assigned_to_name: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  pillar_code?: string;
  pillar_name?: string;
  task_id?: number;
  status: 'pending' | 'converted' | 'completed';
}

export interface DeanAvailabilitySlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  location: string;
  note?: string;
  is_active: boolean;
}

export interface MeetingTimeOption {
  id: string;
  label: string;
  date: string;
  time_slot: string;
  location?: string;
  slot_id?: string;
}

export interface Meeting {
  id: number;
  title: string;
  type: 'presidential_delegation' | 'faculty_board' | 'departmental' | 'committee' | 'external';
  hat_id?: number | null;
  hat_name?: string | null;
  committee_id?: number | null;
  committee_name?: string | null;
  date: string;
  location: string;
  chair: string;
  rapporteur?: string;
  objective: string;
  attendees: MeetingAttendee[];
  agenda: string[];
  minutes_body: string;
  decisions: string[];
  action_items: MeetingActionItem[];
  dean_briefing?: {
    required: boolean;
    phase: 'before' | 'after' | 'both' | 'none';
    status: 'pending' | 'scheduled' | 'completed' | 'not_required';
    briefing_date?: string;
    location?: string;
    attendees?: string[];
    minutes?: string;
    decisions?: string[];
    action_items?: MeetingActionItem[];
    completed_at?: string;
  };
  time_options?: MeetingTimeOption[];
  selected_option_id?: string;
  is_dean_request?: boolean;
  dean_notes?: string;
  recurrence?: {
    pattern: 'none' | 'weekly' | 'biweekly' | 'monthly';
    interval?: number;
    repeat_count?: number;
    parent_meeting_id?: number;
  };
  coordinator_id?: number | null;
  coordinator_name?: string | null;
  rejection_reason?: string | null;
  status: 'draft' | 'approved' | 'action_items_pending' | 'completed' | 'pending_dean_approval' | 'rejected';
  created_at: string;
  created_by_id: number;
  created_by_name: string;
}

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
