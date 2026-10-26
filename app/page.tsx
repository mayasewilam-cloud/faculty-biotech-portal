'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_FACULTY_STAFF } from '@/lib/public_staff';
import {
  School,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Users,
  Shield,
  FileText,
  Calendar,
  Send,
  ExternalLink,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingUp,
  Building2,
  History,
  Eye,
  Check,
  RotateCcw,
  Download,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Square,
  Trash2,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Sparkles,
  FilterX,
  Users2,
  CheckCheck,
  ListFilter,
  Layers,
  Sun,
  Moon,
  Paperclip,
  Award,
  FileSpreadsheet,
  Lock,
  Key,
  LayoutDashboard
} from 'lucide-react';

import { User, Task, Hat, HatMember, ActivityLog, AnalyticsData, Meeting, FacultyCommittee, DeanAvailabilitySlot } from '@/types';
import { INSTITUTIONAL_PILLARS } from '@/lib/pillar_catalog';
import { isTaskOverdue, isTaskAwaitingDeanReview, isUserAssignedToTask } from '@/lib/taskFilters';
import { Header } from '@/components/navigation/Header';
import { AnalyticsView } from '@/components/views/AnalyticsView';
import { LogsView } from '@/components/views/LogsView';
import { StaffView } from '@/components/views/StaffView';
import { HatsView } from '@/components/views/HatsView';
import { CommitteesView } from '@/components/views/CommitteesView';
import { MeetingsView } from '@/components/views/MeetingsView';
import { CalendarView } from '@/components/views/CalendarView';
import { NewTaskModal } from '@/components/modals/NewTaskModal';
import { BulkStatusModal } from '@/components/modals/BulkStatusModal';
import { BulkPriorityModal } from '@/components/modals/BulkPriorityModal';
import { UpdateTaskModal } from '@/components/modals/UpdateTaskModal';
import { TaskInspectionDrawer } from '@/components/modals/TaskInspectionDrawer';
import { HatModal } from '@/components/modals/HatModal';
import { AddMemberModal } from '@/components/modals/AddMemberModal';
import { MomInspectionModal } from '@/components/modals/MomInspectionModal';
import { NewMeetingModal } from '@/components/modals/NewMeetingModal';
import { CommitteeModal } from '@/components/modals/CommitteeModal';
import { AddCommitteeMemberModal } from '@/components/modals/AddCommitteeMemberModal';
import { AccreditationExportModal } from '@/components/modals/AccreditationExportModal';
import { BulkReassignModal } from '@/components/modals/BulkReassignModal';
import { BulkRescheduleModal } from '@/components/modals/BulkRescheduleModal';
import { exportAccreditationEvidencePack } from '@/lib/exportEvidencePack';
import { EmailDispatchModal } from '@/components/modals/EmailDispatchModal';
import { FacultyMemberModal } from '@/components/modals/FacultyMemberModal';
import { FacultyImportModal } from '@/components/modals/FacultyImportModal';
import { DeanBriefingModal } from '@/components/modals/DeanBriefingModal';
import { DeanAvailabilityModal } from '@/components/modals/DeanAvailabilityModal';
import { RequestDeanMeetingModal } from '@/components/modals/RequestDeanMeetingModal';
import { WeeklyReportView } from '@/components/views/WeeklyReportView';
import { DeanOverviewView } from '@/components/views/DeanOverviewView';
import { TasksTableView } from '@/components/views/TasksTableView';
import { CreateSubmissionRequestModal } from '@/components/modals/CreateSubmissionRequestModal';
import { ConfidentialSubmissionsDrawer } from '@/components/modals/ConfidentialSubmissionsDrawer';
import { TaskImportModal } from '@/components/modals/TaskImportModal';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Change Password Modal States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (changePasswordNew !== changePasswordConfirm) {
      setChangePasswordError('Passwords do not match.');
      return;
    }
    if (changePasswordNew.length < 6) {
      setChangePasswordError('Password must be at least 6 characters.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          new_password: changePasswordNew,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setChangePasswordSuccess('Password updated successfully!');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setChangePasswordNew('');
        setChangePasswordConfirm('');
        setChangePasswordSuccess('');
      }, 1200);
    } catch (err: any) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Initialize theme from localStorage or document element
  useEffect(() => {
    const saved = localStorage.getItem('faculty_theme') as 'dark' | 'light' | null;
    const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
    const active = saved || current || 'dark';
    setTheme(active);
    document.documentElement.setAttribute('data-theme', active);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('faculty_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Super Admin designation: Admin (99), Prof. Gehan Safwat (6496), Prof. Amr Ageez (6591)
  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.id === 99 || currentUser?.id === 6496 || currentUser?.id === 6591;
  const isDean = isSuperAdmin || currentUser?.role === 'dean' || currentUser?.role === 'vice_dean';

  // Tabs: Overview (Dean), Tasks, Committees & Meetings (governance), Calendar, Analytics, Logs, Staff
  const [activeTab, setActiveTab] = useState<'overview' | 'hats' | 'tasks' | 'governance' | 'committees' | 'meetings' | 'calendar' | 'weekly_report' | 'analytics' | 'logs' | 'staff'>('overview');

  // Confidential Submission Requests & Review State
  const [isCreateSubmissionModalOpen, setIsCreateSubmissionModalOpen] = useState(false);
  const [inspectingSubmissionsTask, setInspectingSubmissionsTask] = useState<Task | null>(null);

  // Filters for Tasks (Applicable across all portals)
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [hatFilter, setHatFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [exactDate, setExactDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDeadlineAlertCollapsed, setIsDeadlineAlertCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Hats State
  const [hats, setHats] = useState<Hat[]>([]);
  const [targetHatId, setTargetHatId] = useState<number | ''>('');
  const [targetCommitteeId, setTargetCommitteeId] = useState<number | ''>('');
  const [taskOwnerId, setTaskOwnerId] = useState<number | ''>('');
  const [responsibilityModel, setResponsibilityModel] = useState<'shared_deliverable' | 'individual_submissions'>('individual_submissions');
  const [requiresDeanApproval, setRequiresDeanApproval] = useState<boolean>(false);
  const [expandedCampaignIds, setExpandedCampaignIds] = useState<Record<string, boolean>>({});
  const [hatSearchQuery, setHatSearchQuery] = useState('');

  // Official Standing Committees State
  const [committees, setCommittees] = useState<FacultyCommittee[]>([]);
  const [isCreateCommitteeOpen, setIsCreateCommitteeOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<FacultyCommittee | null>(null);
  const [isAddCommitteeMemberOpen, setIsAddCommitteeMemberOpen] = useState(false);
  const [targetCommitteeForMember, setTargetCommitteeForMember] = useState<FacultyCommittee | null>(null);

  // Meetings & Presidential Delegations State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [inspectingMeeting, setInspectingMeeting] = useState<Meeting | null>(null);
  const [isDeanBriefingModalOpen, setIsDeanBriefingModalOpen] = useState(false);
  const [briefingTargetMeeting, setBriefingTargetMeeting] = useState<Meeting | null>(null);
  const [isAccreditationModalOpen, setIsAccreditationModalOpen] = useState(false);

  // Dean Availability Slots & 3-Slot Meeting Requests State
  const [deanSlots, setDeanSlots] = useState<DeanAvailabilitySlot[]>([]);
  const [isDeanAvailabilityModalOpen, setIsDeanAvailabilityModalOpen] = useState(false);
  const [isRequestDeanMeetingModalOpen, setIsRequestDeanMeetingModalOpen] = useState(false);
  const [meetingTaskContext, setMeetingTaskContext] = useState<Task | null>(null);

  // Faculty Member Directory Management State
  const [isFacultyMemberModalOpen, setIsFacultyMemberModalOpen] = useState(false);
  const [editingFacultyMember, setEditingFacultyMember] = useState<User | null>(null);
  const [isFacultyImportModalOpen, setIsFacultyImportModalOpen] = useState(false);

  // Hats Management Modals State
  const [isCreateHatOpen, setIsCreateHatOpen] = useState(false);
  const [isEditHatOpen, setIsEditHatOpen] = useState(false);
  const [selectedHatForEdit, setSelectedHatForEdit] = useState<Hat | null>(null);
  const [hatFormName, setHatFormName] = useState('');
  const [hatFormDesc, setHatFormDesc] = useState('');
  const [hatFormIcon, setHatFormIcon] = useState('🎓');
  const [hatFormColor, setHatFormColor] = useState('#8b5cf6');
  const [isSavingHat, setIsSavingHat] = useState(false);

  // Add Member to Hat State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [targetHatForMember, setTargetHatForMember] = useState<Hat | null>(null);
  const [newMemberUserId, setNewMemberUserId] = useState<number | ''>('');
  const [newMemberRoleInHat, setNewMemberRoleInHat] = useState('Member');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Grouping Options: 'none' | 'department' | 'status' | 'priority' | 'assignee' | 'pillar'
  const [groupBy, setGroupBy] = useState<'none' | 'department' | 'status' | 'priority' | 'assignee' | 'pillar'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Multi-Select & Bulk Operations State
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<'done' | 'in_progress' | 'pending'>('done');
  const [bulkNotes, setBulkNotes] = useState('');
  const [isBulkPriorityModalOpen, setIsBulkPriorityModalOpen] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [bulkPriority, setBulkPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [isBulkDeadlineModalOpen, setIsBulkDeadlineModalOpen] = useState(false);
  const [bulkDeadline, setBulkDeadline] = useState('');
  const [isBulkReassignModalOpen, setIsBulkReassignModalOpen] = useState(false);
  const [isBulkRescheduleModalOpen, setIsBulkRescheduleModalOpen] = useState(false);

  // Modals & Drawers
  const [isTaskImportOpen, setIsTaskImportOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isUpdateTaskOpen, setIsUpdateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetTask, setEmailTargetTask] = useState<Task | null>(null);

  // Professor Task Update Form State
  const [updateStatus, setUpdateStatus] = useState<'done' | 'in_progress' | 'pending'>('done');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateDriveLink, setUpdateDriveLink] = useState('');
  const [updateActionPlan, setUpdateActionPlan] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Task Dispatch Form State (Supports Single, Hat Group, Multi-Selected, Department-wide, or Broadcast)
  const [dispatchMode, setDispatchMode] = useState<'single' | 'committee' | 'selected' | 'department' | 'all'>('single');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('Schedules, Load & Faculty Board');
  const [newTaskGoogleFormUrl, setNewTaskGoogleFormUrl] = useState<string>('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<number | ''>('');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [targetDept, setTargetDept] = useState('Academic Staff');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [newTaskAttachment, setNewTaskAttachment] = useState<{
    name: string;
    type: string;
    size: number;
    url?: string;
    dataUrl?: string;
  } | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // File size formatting helper
  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Handle client file upload conversion to Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10 MB limit. Please select a smaller file or attach an external drive link in the instructions.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setNewTaskAttachment({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  // Multi-Assignee Campaign Summary Calculator
  const campaignSummaries = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (t.group_id) {
        const arr = map.get(t.group_id) || [];
        arr.push(t);
        map.set(t.group_id, arr);
      }
    }
    return Array.from(map.entries())
      .filter(([_, list]) => list.length > 1)
      .map(([groupId, list]) => {
        const title = list[0]?.title || 'Faculty Campaign';
        const deadline = list[0]?.deadline;
        const total = list.length;
        const submitted = list.filter(t => t.status === 'done').length;
        const pending = list.filter(t => t.status === 'pending' || t.status === 'in_progress' || t.status === 'revision_requested').length;
        const overdue = list.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done').length;
        const pct = total > 0 ? Math.round((submitted / total) * 100) : 0;
        const files = list.filter(t => t.attachment_url);
        return {
          groupId,
          title,
          deadline,
          total,
          submitted,
          pending,
          overdue,
          pct,
          files,
          tasks: list
        };
      });
  }, [tasks]);

  // Audit Logs Filter
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');
  const [logUserFilter, setLogUserFilter] = useState('all');

  // Faculty Directory Tab Filter
  const [directoryCategory, setDirectoryCategory] = useState<'all' | 'professors' | 'doctors' | 'la' | 'ta' | 'ra_n112' | 'prototyping_ra' | 'admin' | 'staff' | 'leadership'>('all');
  const [directorySearch, setDirectorySearch] = useState('');

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Current user
      const authRes = await fetch('/api/auth');
      const authData = await authRes.json();
      if (!authData.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(authData.user);
      setIsImpersonating(!!authData.isImpersonating);
      setAdminUser(authData.adminUser || null);

      const userIsDean = authData.user.role === 'admin' || authData.user.role === 'dean' || authData.user.role === 'vice_dean' || authData.user.id === 99 || authData.user.id === 6496 || authData.user.id === 6591;
      if (!userIsDean) {
        setActiveTab('tasks');
      }

      // 2. Fetch users directory
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }

      // 3. Fetch tasks, hats, committees, meetings, and dean availability slots
      await Promise.all([
        fetchTasks(),
        fetchHats(),
        fetchCommittees(),
        fetchMeetings(),
        fetchDeanSlots()
      ]);

      // 4. Fetch logs & analytics if Admin or Dean/Leadership
      if (authData.user.role === 'admin' || authData.user.role === 'dean' || authData.user.role === 'vice_dean') {
        const [logsRes, analyticsRes] = await Promise.all([
          fetch('/api/logs'),
          fetch('/api/analytics')
        ]);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData.logs || []);
        }
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeanSlots = async () => {
    try {
      const res = await fetch('/api/dean/availability');
      if (res.ok) {
        const data = await res.json();
        setDeanSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch Dean availability slots:', err);
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  };

  const fetchCommittees = async () => {
    try {
      const res = await fetch('/api/committees');
      if (res.ok) {
        const data = await res.json();
        setCommittees(data.committees || []);
      }
    } catch (err) {
      console.error('Failed to fetch committees:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users directory:', err);
    }
  };

  const fetchHats = async () => {
    try {
      const res = await fetch('/api/hats');
      if (res.ok) {
        const data = await res.json();
        setHats(data.hats || []);
      }
    } catch (err) {
      console.error('Failed to fetch hats:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      let url = `/api/tasks?status=${statusFilter}&department=${deptFilter}&priority=${priorityFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const data = await res.json();
      const rawTasks: Task[] = data.tasks || [];
      const seen = new Set<number>();
      const deduped: Task[] = [];
      for (const t of rawTasks) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          deduped.push(t);
        }
      }
      setTasks(deduped);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      let url = `/api/logs?actionType=${logActionFilter}&userId=${logUserFilter}`;
      if (logSearch) url += `&search=${encodeURIComponent(logSearch)}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  // ── Hats Management Handlers ────────────────────────────────
  const handleOpenCreateHat = () => {
    setHatFormName('');
    setHatFormDesc('');
    setHatFormIcon('🎓');
    setHatFormColor('#8b5cf6');
    setSelectedHatForEdit(null);
    setIsCreateHatOpen(true);
  };

  const handleOpenEditHat = (hat: Hat) => {
    setSelectedHatForEdit(hat);
    setHatFormName(hat.name);
    setHatFormDesc(hat.description || '');
    setHatFormIcon(hat.icon || '🎓');
    setHatFormColor(hat.color || '#8b5cf6');
    setIsEditHatOpen(true);
  };

  const handleSaveHat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hatFormName.trim()) {
      alert('Please enter a Hat group name');
      return;
    }
    setIsSavingHat(true);
    try {
      const isEditing = !!selectedHatForEdit;
      const url = isEditing ? `/api/hats/${selectedHatForEdit.id}` : '/api/hats';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hatFormName.trim(),
          description: hatFormDesc.trim(),
          icon: hatFormIcon,
          color: hatFormColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save Hat group');
      }

      setIsCreateHatOpen(false);
      setIsEditHatOpen(false);
      setSelectedHatForEdit(null);
      await fetchHats();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingHat(false);
    }
  };

  const handleDeleteHat = async (hatId: number, hatName: string) => {
    if (!confirm(`Are you sure you want to delete the Hat group "${hatName}"? This will not delete the staff members or their completed tasks.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/hats/${hatId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete Hat group');
      }
      await fetchHats();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenAddMember = (hat: Hat) => {
    setTargetHatForMember(hat);
    setNewMemberUserId('');
    setNewMemberRoleInHat('Member');
    setMemberSearchQuery('');
    setIsAddMemberOpen(true);
  };

  const handleAddMemberToHat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHatForMember || !newMemberUserId) {
      alert('Please select a faculty member to add to this Hat');
      return;
    }
    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/hats/${targetHatForMember.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: Number(newMemberUserId),
          role_in_hat: newMemberRoleInHat || 'Member',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add member to Hat');
      }
      setIsAddMemberOpen(false);
      setTargetHatForMember(null);
      setNewMemberUserId('');
      await fetchHats();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMemberFromHat = async (hatId: number, userId: number, memberName: string, hatName: string) => {
    if (!confirm(`Remove ${memberName} from "${hatName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/hats/${hatId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member from Hat');
      }
      await fetchHats();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Meetings & MoM Handlers
  const handleConvertActionItem = async (meetingId: number, actionItemId: string) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_action_item',
          meeting_id: meetingId,
          action_item_id: actionItemId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to convert action item');
      }

      const data = await res.json();
      if (data.task) {
        setTasks(prev => [data.task, ...prev.filter(t => t.id !== data.task.id)]);
      }
      if (data.meeting) {
        setMeetings(prev => prev.map(m => m.id === meetingId ? data.meeting : m));
        if (inspectingMeeting?.id === meetingId) {
          setInspectingMeeting(data.meeting);
        }
      }
      if (isDean) {
        fetchLogs();
      }
      alert('Action item successfully converted into an active faculty task!');
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to dispatch action item'}`);
    }
  };

  const handleDeleteMeeting = async (meetingId: number, meetingTitle: string) => {
    if (!confirm(`Are you sure you want to delete the meeting record "${meetingTitle}"?`)) return;
    try {
      const res = await fetch(`/api/meetings?id=${meetingId}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings(prev => prev.filter(m => m.id !== meetingId));
        if (inspectingMeeting?.id === meetingId) {
          setInspectingMeeting(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  const handleMeetingCreated = (newMeeting: Meeting, series: Meeting[] = []) => {
    setMeetings(prev => {
      const allNew = [newMeeting, ...(series || [])];
      const seen = new Set<number>();
      const combined = [...allNew, ...prev];
      return combined.filter(m => {
        if (!m || !m.id) return false;
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    });
    fetchMeetings();
    fetchTasks();
    if (isDean) fetchLogs();
  };

  const handleMeetingUpdated = (updatedMeeting: Meeting) => {
    setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
    if (inspectingMeeting?.id === updatedMeeting.id) {
      setInspectingMeeting(updatedMeeting);
    }
    fetchTasks();
    if (isDean) fetchLogs();
  };

  const handleTaskMeetingAction = (task: Task) => {
    if (isDean) {
      // Prof. Dr. Gehan scheduling meeting with task assignee
      setEditingMeeting({
        id: 0,
        title: `[Directive Session] ${task.title}`,
        type: task.committee_id ? 'committee' : 'departmental',
        date: new Date().toISOString().split('T')[0],
        location: "Dean's Office (Building A, Room 301)",
        chair: 'Prof. Dr. Gehan Safwat',
        rapporteur: task.assignee_name || 'Faculty Member',
        objective: `Dean directive and review session for task: ${task.title}`,
        agenda: [
          `1. Review current deliverables & progress`,
          `2. Technical blockers & required faculty resources`,
          `3. Agreed milestone deadlines & action items`
        ],
        attendees: [
          { name: 'Prof. Dr. Gehan Safwat', role: 'Dean & Committee Chair', attended: true },
          ...(task.assigned_to_id ? [{ user_id: task.assigned_to_id, name: task.assignee_name || 'Assignee', role: task.assignee_title || 'Responsible Staff', attended: true }] : [])
        ],
        status: 'scheduled',
      } as any);
      setIsCreateMeetingOpen(true);
    } else {
      // Regular member requesting meeting with Prof. Dr. Gehan
      setMeetingTaskContext(task);
      setIsRequestDeanMeetingModalOpen(true);
    }
  };

  const handleOpenDeanBriefing = (meeting: Meeting) => {
    setBriefingTargetMeeting(meeting);
    setIsDeanBriefingModalOpen(true);
  };

  const handleSaveDeanBriefing = async (meetingId: number, briefingData: any) => {
    const res = await fetch('/api/meetings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_dean_briefing',
        meeting_id: meetingId,
        briefing: briefingData,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save Dean briefing');
    }

    const data = await res.json();
    setMeetings(prev => prev.map(m => (m.id === meetingId ? data.meeting : m)));
    setIsDeanBriefingModalOpen(false);
    setBriefingTargetMeeting(null);
    if (isDean) fetchLogs();
  };

  const handleSaveDeanSlots = async (newSlots: DeanAvailabilitySlot[]) => {
    const res = await fetch('/api/dean/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slots: newSlots }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save Dean availability slots');
    }

    const data = await res.json();
    setDeanSlots(data.slots || newSlots);
    if (isDean) fetchLogs();
  };

  const handleApproveMeetingSlot = async (meetingId: number, optionId: string, notes?: string) => {
    const res = await fetch('/api/meetings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve_dean_meeting_option',
        meeting_id: meetingId,
        approved_option_id: optionId,
        dean_notes: notes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to approve meeting option');
      return;
    }

    const data = await res.json();
    setMeetings(prev => prev.map(m => (m.id === meetingId ? data.meeting : m)));
    if (isDean) fetchLogs();
  };

  const handleDeclineMeeting = async (meetingId: number, notes?: string) => {
    if (!confirm('Are you sure you want to decline this meeting request?')) return;
    const res = await fetch('/api/meetings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'decline_dean_meeting',
        meeting_id: meetingId,
        dean_notes: notes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to decline meeting');
      return;
    }

    const data = await res.json();
    setMeetings(prev => prev.map(m => (m.id === meetingId ? data.meeting : m)));
    if (isDean) fetchLogs();
  };

  // ── Official Standing Committees Handlers ───────────────────
  const handleOpenCreateCommittee = () => {
    setEditingCommittee(null);
    setIsCreateCommitteeOpen(true);
  };

  const handleOpenEditCommittee = (committee: FacultyCommittee) => {
    setEditingCommittee(committee);
    setIsCreateCommitteeOpen(true);
  };

  const handleSaveCommittee = async (committeeData: any) => {
    try {
      const isEdit = !!editingCommittee;
      const res = await fetch('/api/committees', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(committeeData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save committee');
      }
      setIsCreateCommitteeOpen(false);
      setEditingCommittee(null);
      await fetchCommittees();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error saving committee');
    }
  };

  const handleDeleteCommittee = async (committeeId: number, name: string) => {
    if (!confirm(`Are you sure you want to abolish / remove the official committee "${name}"?`)) return;
    try {
      const res = await fetch(`/api/committees?id=${committeeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete committee');
      }
      await fetchCommittees();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error deleting committee');
    }
  };

  const handleOpenAddCommitteeMember = (committee: FacultyCommittee) => {
    setTargetCommitteeForMember(committee);
    setIsAddCommitteeMemberOpen(true);
  };

  const handleAddCommitteeMember = async (committeeId: number, member: any) => {
    try {
      const res = await fetch('/api/committees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_member',
          committee_id: committeeId,
          member,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to appoint committee member');
      }
      setIsAddCommitteeMemberOpen(false);
      setTargetCommitteeForMember(null);
      await fetchCommittees();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error appointing member');
    }
  };

  const handleRemoveCommitteeMember = async (committeeId: number, memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this official committee?`)) return;
    try {
      const res = await fetch('/api/committees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_member',
          committee_id: committeeId,
          member_id: memberId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove committee member');
      }
      await fetchCommittees();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error removing member');
    }
  };

  // ── Faculty Member Directory Handlers ───────────────────────
  const handleOpenCreateFacultyMember = () => {
    setEditingFacultyMember(null);
    setIsFacultyMemberModalOpen(true);
  };

  const handleOpenEditFacultyMember = (member: any) => {
    setEditingFacultyMember(member);
    setIsFacultyMemberModalOpen(true);
  };

  const handleSaveFacultyMember = async (memberData: any) => {
    try {
      const isEdit = !!editingFacultyMember;
      const res = await fetch('/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save faculty member profile');
      }
      setIsFacultyMemberModalOpen(false);
      setEditingFacultyMember(null);
      await fetchUsers();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error saving faculty member');
    }
  };

  const handleDeleteFacultyMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the faculty directory? Any active tasks will be reassigned to the Dean's Office.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${memberId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove faculty member');
      }
      await fetchUsers();
      await fetchTasks();
      if (isDean) await fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error deleting faculty member');
    }
  };

  const handleFacultyImportSuccess = async () => {
    await fetchUsers();
    if (isDean) await fetchLogs();
  };

  const handleQuickDispatchToHat = (hat: Hat) => {
    setNewTaskTitle(`[${hat.name}] `);
    setIsNewTaskOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchTasks();
    }
  }, [statusFilter, deptFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'dean' || currentUser.role === 'vice_dean')) {
      fetchLogs();
    }
  }, [logActionFilter, logUserFilter, logSearch]);

  // Quick switch account (Strictly Super Admin only)
  const handleSwitchUser = async (userId: number) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch', userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to switch user');
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // 1-Click Return to Super Admin account
  const handleRevertAdmin = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert_admin' }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to return to Super Admin account');
        return;
      }
      window.location.reload();
    } catch (err) {
      console.error('Failed to revert to Admin:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  // Create Task (Supports Single Assignee, Multi-Selected Staff, Department, or Broadcast)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDescription || !newTaskDeadline) {
      alert('Please fill in title, instructions, and deadline');
      return;
    }

    if (dispatchMode === 'single' && !newTaskAssigneeId) {
      alert('Please select an assigned staff member');
      return;
    }


    if (dispatchMode === 'committee' && !targetCommitteeId) {
      alert('Please select a Standing Committee');
      return;
    }

    if (dispatchMode === 'selected' && selectedRecipients.length === 0) {
      alert('Please select at least one staff member from the list');
      return;
    }

    setIsCreatingTask(true);
    try {
      if (dispatchMode === 'single') {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTaskTitle,
            description: newTaskDescription,
            assigned_to_id: newTaskAssigneeId,
            priority: newTaskPriority,
            deadline: new Date(newTaskDeadline).toISOString(),
            category: newTaskCategory,
            google_form_url: newTaskGoogleFormUrl || undefined,
            hat_id: targetHatId ? Number(targetHatId) : undefined,
            attachment_name: newTaskAttachment?.name || undefined,
            attachment_type: newTaskAttachment?.type || undefined,
            attachment_size: newTaskAttachment?.size || undefined,
            attachment_url: newTaskAttachment?.url || newTaskAttachment?.dataUrl || undefined,
            task_owner_id: taskOwnerId ? Number(taskOwnerId) : undefined,
            requires_dean_approval: requiresDeanApproval ? 1 : 0,
            responsibility_model: responsibilityModel,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to dispatch task');
        }
      } else {
        // Bulk dispatch to hat, selected users, department, or all staff
        const res = await fetch('/api/tasks/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'dispatch_bulk',
            title: newTaskTitle,
            description: newTaskDescription,
            priority: newTaskPriority,
            deadline: new Date(newTaskDeadline).toISOString(),
            target_type: dispatchMode === 'department' ? 'department' : dispatchMode === 'all' ? 'all_staff' : dispatchMode === 'committee' ? 'committee' : 'selected_users',
            target_committee_id: targetCommitteeId ? Number(targetCommitteeId) : undefined,
            target_dept: targetDept,
            target_hat_id: targetHatId ? Number(targetHatId) : undefined,
            user_ids: selectedRecipients,
            attachment_name: newTaskAttachment?.name || undefined,
            attachment_type: newTaskAttachment?.type || undefined,
            attachment_size: newTaskAttachment?.size || undefined,
            attachment_url: newTaskAttachment?.url || newTaskAttachment?.dataUrl || undefined,
            task_owner_id: taskOwnerId ? Number(taskOwnerId) : undefined,
            requires_dean_approval: requiresDeanApproval ? 1 : 0,
            responsibility_model: responsibilityModel,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to bulk dispatch tasks');
        }
      }

      setIsNewTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAssigneeId('');
      setSelectedRecipients([]);
      setTargetHatId('');
      setTargetCommitteeId('');
      setTaskOwnerId('');
      setResponsibilityModel('individual_submissions');
      setRequiresDeanApproval(false);
      setNewTaskDeadline('');
      setNewTaskAttachment(null);
      setDispatchMode('single');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ── Multi-Select Helpers ─────────────────────────────────────
  const handleToggleSelectTask = (taskId: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAllVisible = (visibleTasks: Task[]) => {
    const visibleIds = visibleTasks.map(t => t.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedTaskIds.includes(id));
    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // ── Bulk Actions Handlers ───────────────────────────────────
  const handleBulkAcknowledge = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge',
          task_ids: selectedTaskIds,
        }),
      });
      if (!res.ok) throw new Error('Bulk acknowledge failed');
      await fetchData();
      setSelectedTaskIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkStatusSubmit = async (status: 'done' | 'in_progress' | 'pending', notes?: string) => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          task_ids: selectedTaskIds,
          data: { status, completion_notes: notes || undefined },
        }),
      });
      if (!res.ok) throw new Error('Bulk status update failed');
      setIsBulkStatusModalOpen(false);
      setBulkNotes('');
      await fetchData();
      setSelectedTaskIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkPrioritySubmit = async (priority: string) => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'priority',
          task_ids: selectedTaskIds,
          data: { priority },
        }),
      });
      if (!res.ok) throw new Error('Bulk priority update failed');
      setIsBulkPriorityModalOpen(false);
      await fetchData();
      setSelectedTaskIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkExtendDeadline = async (days: number) => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deadline',
          task_ids: selectedTaskIds,
          data: { days },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk deadline update failed');
      alert(data.message || `Extended deadlines for ${selectedTaskIds.length} tasks.`);
      setIsBulkRescheduleModalOpen(false);
      setSelectedTaskIds([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkRescheduleSubmit = async (deadline: string) => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deadline',
          task_ids: selectedTaskIds,
          data: { deadline },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk deadline update failed');
      alert(data.message || `Updated deadlines for ${selectedTaskIds.length} tasks.`);
      setIsBulkRescheduleModalOpen(false);
      setSelectedTaskIds([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkReassignSubmit = async (assignedToId: number, hatId?: number | null) => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reassign',
          task_ids: selectedTaskIds,
          data: { assigned_to_id: assignedToId, hat_id: hatId },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk reassign failed');
      alert(data.message || `Reassigned ${selectedTaskIds.length} tasks.`);
      setIsBulkReassignModalOpen(false);
      setSelectedTaskIds([]);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedTaskIds.length} tasks? This will be recorded in the audit trail.`)) {
      return;
    }
    setIsBulkLoading(true);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          task_ids: selectedTaskIds,
        }),
      });
      if (!res.ok) throw new Error('Bulk delete failed');
      await fetchData();
      setSelectedTaskIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDeptFilter('all');
    setHatFilter('all');
    setPillarFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setVerificationFilter('all');
    setDueFilter('all');
    setExactDate('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  // Submit Professor Update (Done/In Progress + Text Description)
  const handleSubmitTaskUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setIsSubmittingUpdate(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: updateStatus,
            completion_notes: updateNotes,
            completion_url: updateUrl,
            drive_link: updateDriveLink || null,
            action_plan: updateActionPlan || null,
          }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit update');
      }

      setIsUpdateTaskOpen(false);
      setSelectedTask(null);
      setUpdateNotes('');
        setUpdateUrl('');
        setUpdateDriveLink('');
        setUpdateActionPlan('');
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  // Dean Acknowledge Submission & Apply Official Stamp
  const handleDeanAcknowledge = async (taskId: number, feedback?: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dean_acknowledged: 1,
          dean_feedback: feedback || undefined,
        }),
      });
      if (res.ok) {
        await fetchData();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev: any) => ({
            ...prev,
            dean_acknowledged: 1,
            dean_feedback: feedback || prev?.dean_feedback,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to acknowledge task:', err);
    }
  };

  // Dean Request Revision from Faculty Member
  const handleRequestRevision = async (taskId: number, feedback: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'revision_requested',
          dean_feedback: feedback,
          dean_acknowledged: 0,
        }),
      });
      if (res.ok) {
        await fetchData();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask((prev: any) => ({
            ...prev,
            status: 'revision_requested',
            dean_feedback: feedback,
            dean_acknowledged: 0,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to request revision:', err);
    }
  };

  // Export Audit Log to CSV
  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ['ID', 'Timestamp', 'Staff Member', 'Role', 'Department', 'Action Type', 'Summary', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString(),
      `"${l.user_name}"`,
      l.user_role,
      `"${l.user_department || ''}"`,
      l.action_type,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ip_address,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faculty_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Academic & Administration Cadres of the Faculty
  const facultyDepartments = [
    'Academic Staff',
    'Academic Administration',
    'RA N112',
    'Prototyping RA',
    'Faculty Leadership',
  ];

  // Standardized Cadre Groups for all portal selections (100% synchronized with official faculty roster)
  const staffCatMap = new Map<number, string>(ALL_FACULTY_STAFF.map(s => [s.id, s.category]));

  const getUserCat = (u: any): string => {
    const cat = staffCatMap.get(u.id);
    if (cat) return cat;
    if (u.id === 99 || u.id === 6496 || u.id === 6591 || u.role === 'admin' || u.role === 'dean' || u.role === 'vice_dean') return 'leadership';
    if (u.department === 'RA N112' || ['14388', '14294', '14297'].includes(String(u.id))) return 'ra_n112';
    if (u.department === 'Prototyping RA' || ['15684', '15683', '14889'].includes(String(u.id))) return 'prototyping_ra';
    if (u.department === 'Academic Administration' || ['9783', '14686', '13886', '12698'].includes(String(u.id))) return 'administration';
    if (u.title?.includes('Prof.') || u.full_name?.includes('Prof.')) return 'professors';
    if (u.title === 'Dr.' || u.full_name?.startsWith('Dr.')) return 'doctors';
    if (u.title === 'LA.' || u.full_name?.startsWith('LA.')) return 'la';
    if (u.title === 'TA.' || u.full_name?.startsWith('TA.')) return 'ta';
    return 'ta';
  };

  const baseUsers = allUsers.length > 0 ? allUsers : ALL_FACULTY_STAFF;

  const leadershipUsers = baseUsers.filter(u => getUserCat(u) === 'leadership');
  const profUsers = baseUsers.filter(u => getUserCat(u) === 'professors');
  const drUsers = baseUsers.filter(u => getUserCat(u) === 'doctors');
  const laUsers = baseUsers.filter(u => getUserCat(u) === 'la');
  const taUsers = baseUsers.filter(u => getUserCat(u) === 'ta');
  const raN112Users = baseUsers.filter(u => getUserCat(u) === 'ra_n112');
  const prototypingRaUsers = baseUsers.filter(u => getUserCat(u) === 'prototyping_ra');
  const adminCadreUsers = baseUsers.filter(u => getUserCat(u) === 'administration');

  const academicStaffUsers = [...profUsers, ...drUsers, ...laUsers, ...taUsers];

  // Active Filters Evaluation
  const hasActiveFilters = 
    statusFilter !== 'all' || 
    deptFilter !== 'all' || 
    hatFilter !== 'all' || 
    pillarFilter !== 'all' ||
    priorityFilter !== 'all' || 
    assigneeFilter !== 'all' || 
    verificationFilter !== 'all' || 
    dueFilter !== 'all' || 
    exactDate !== '' ||
    startDate !== '' ||
    endDate !== '' ||
    searchQuery.trim() !== '';

  const activeFiltersCount = [
    statusFilter !== 'all',
    deptFilter !== 'all',
    hatFilter !== 'all',
    pillarFilter !== 'all',
    priorityFilter !== 'all',
    assigneeFilter !== 'all',
    verificationFilter !== 'all',
    dueFilter !== 'all' || exactDate !== '' || startDate !== '' || endDate !== '',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  // Safe Date Normalizer
  const parseSafeDate = (dStr: string | null | undefined): Date | null => {
    if (!dStr) return null;
    const clean = dStr.includes(' ') && !dStr.includes('T') ? dStr.replace(' ', 'T') : dStr;
    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
  };

  const now = new Date();

  // Overdue and Imminent Tasks lists for Alert Center
  const overdueTasksList = tasks.filter(task => {
    if (task.status === 'done') return false;
    const d = parseSafeDate(task.deadline);
    return d !== null && d < now;
  });

  const imminentTasksList = tasks.filter(task => {
    if (task.status === 'done') return false;
    const d = parseSafeDate(task.deadline);
    if (!d) return false;
    const diffHours = (d.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 48;
  });

  // Deadline Countdown & Status Helper
  const getDeadlineAlertBadge = (deadlineStr: string, status: string) => {
    if (status === 'done') {
      return {
        type: 'done',
        text: 'Completed',
        color: 'var(--status-done)',
        bg: 'var(--status-done-bg)',
        border: 'var(--status-done-border)',
      };
    }
    const d = parseSafeDate(deadlineStr);
    if (!d) return null;

    const diffMs = d.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(Math.abs(diffHours) / 24);
    const remHours = Math.floor(Math.abs(diffHours) % 24);

    if (diffMs < 0) {
      const overdueText = diffDays > 0 
        ? `⚠️ Overdue by ${diffDays}d ${remHours}h` 
        : `⚠️ Overdue by ${Math.max(1, Math.round(Math.abs(diffHours)))}h`;
      return {
        type: 'overdue',
        text: overdueText,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.4)',
      };
    } else if (diffHours <= 24) {
      const hoursLeft = Math.max(1, Math.round(diffHours));
      return {
        type: 'urgent',
        text: `⚡ Due in ${hoursLeft}h`,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.16)',
        border: 'rgba(245, 158, 11, 0.45)',
      };
    } else if (diffHours <= 48) {
      return {
        type: 'warning',
        text: `⏳ Due Tomorrow (${remHours}h)`,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.35)',
      };
    } else if (diffHours <= 168) {
      return {
        type: 'upcoming',
        text: `🗓️ Due in ${diffDays}d`,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.3)',
      };
    } else {
      return {
        type: 'future',
        text: `📆 ${d.toLocaleDateString()}`,
        color: 'var(--text-secondary)',
        bg: 'var(--bg-inset)',
        border: 'var(--border)',
      };
    }
  };

  // Filtered Tasks computation
  const filteredTasks = tasks.filter(task => {
    // 0. Member Role Privacy Guard: Normal members only see their own tasks and things related to them
    if (!isDean && currentUser) {
      const isRelated = task.assigned_to_id === currentUser.id ||
                        task.task_owner_id === currentUser.id ||
                        task.assigned_by_id === currentUser.id;
      if (!isRelated) return false;
    }
    // 1. Status Filter (Single Source of Truth)
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue' && !isTaskOverdue(task, now)) return false;
      if (statusFilter === 'awaiting_dean' && !isTaskAwaitingDeanReview(task)) return false;
      if (statusFilter === 'pending' && (task.status !== 'pending' || isTaskOverdue(task, now))) return false;
      if (statusFilter === 'done' && task.status !== 'done') return false;
      if (statusFilter === 'in_progress' && task.status !== 'in_progress') return false;
      if (statusFilter === 'revision_requested' && task.status !== 'revision_requested') return false;
    }
    // 2. Department Filter
    if (deptFilter !== 'all' && task.department !== deptFilter) return false;
    // 2.1 Hat Group Filter
    if (hatFilter !== 'all') {
      const hId = Number(hatFilter);
      const targetHat = hats.find(h => h.id === hId);
      const memberIds = targetHat ? targetHat.members.map(m => m.user_id) : [];
      const isDirectHatTask = task.hat_id === hId;
      const isMemberAssigned = memberIds.includes(task.assigned_to_id);
      if (!isDirectHatTask && !isMemberAssigned) return false;
    }
    // 2.2 Institutional Pillar Filter (A through L)
    if (pillarFilter !== 'all') {
      const p = INSTITUTIONAL_PILLARS.find(pill => pill.code === pillarFilter);
      const pTaskTitles = p ? p.tasks.map(t => t.title.toLowerCase()) : [];
      const matchesPillar = (task.pillar_code && task.pillar_code.toUpperCase() === pillarFilter.toUpperCase()) ||
        pTaskTitles.some(title => (task.title || '').toLowerCase().includes(title) || (task.description || '').toLowerCase().includes(title));
      if (!matchesPillar) return false;
    }
    // 3. Priority Filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    // 4. Assignee Filter
    if (assigneeFilter !== 'all' && String(task.assigned_to_id) !== String(assigneeFilter)) return false;
    // 5. Verification Filter
    if (verificationFilter === 'verified' && task.dean_acknowledged !== 1) return false;
    if (verificationFilter === 'unverified' && task.dean_acknowledged === 1) return false;

    // 6. Due Date & Duration Filter
    const d = parseSafeDate(task.deadline);
    if (dueFilter !== 'all' || exactDate !== '' || startDate !== '' || endDate !== '') {
      if (!d) {
        if (dueFilter === 'overdue') return false;
      } else {
        const diffHours = (d.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (dueFilter === 'overdue' && (d >= now || task.status === 'done')) return false;

        if (dueFilter === 'today') {
          const isToday = d.toDateString() === now.toDateString();
          if (!isToday) return false;
        }

        if (dueFilter === 'tomorrow') {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const isTomorrow = d.toDateString() === tomorrow.toDateString();
          if (!isTomorrow) return false;
        }

        if (dueFilter === '3days' && (diffHours < 0 || diffHours > 72)) return false;

        if (dueFilter === 'week' && (diffHours < 0 || diffHours > 168)) return false;

        if (dueFilter === 'month' && (diffHours < 0 || diffHours > 720)) return false;

        // Specific single date filter (matches exact date string YYYY-MM-DD)
        if (exactDate) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const taskDate = `${y}-${m}-${day}`;
          if (taskDate !== exactDate) return false;
        }

        // Custom date duration range filter (from startDate to endDate)
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`);
          if (d < start) return false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59.999`);
          if (d > end) return false;
        }
      }
    }

    // 7. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchAssignee = (task.assignee_name || '').toLowerCase().includes(q);
      const matchDept = (task.department || '').toLowerCase().includes(q);
      const matchNotes = (task.completion_notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee && !matchDept && !matchNotes) return false;
    }

    // 8. Option B Hierarchy Guard: Keep child responsibilities inside parent drawers
    if (task.parent_task_id && assigneeFilter === 'all') {
      if (isDean || task.assigned_to_id !== currentUser?.id) {
        return false;
      }
    }

    return true;
  });

  // Calculate task counts (focus on top-level tasks to prevent sub-task count inflation, scoped by role)
  const scopedTasksForCounters = isDean ? tasks : tasks.filter(t =>
    t.assigned_to_id === currentUser?.id ||
    t.task_owner_id === currentUser?.id ||
    t.assigned_by_id === currentUser?.id
  );
  const topLevelTasks = scopedTasksForCounters.filter(t => !t.parent_task_id);
  const totalTasksCount = topLevelTasks.length;
  const completedTasksCount = topLevelTasks.filter(t => t.status === 'done').length;
  const inProgressTasksCount = topLevelTasks.filter(t => t.status === 'in_progress').length;
  const pendingTasksCount = topLevelTasks.filter(t => t.status === 'pending').length;
  const overdueTasksCount = topLevelTasks.filter(t => {
    if (t.status === 'done') return false;
    const d = parseSafeDate(t.deadline);
    return d !== null && d < now;
  }).length;
  const awaitingDeanReviewCount = topLevelTasks.filter(t => t.status === 'done' && t.dean_acknowledged !== 1).length;
  const revisionRequestedCount = topLevelTasks.filter(t => t.status === 'revision_requested').length;

  // Grouped Tasks Builder
  interface TaskGroupItem {
    key: string;
    title: string;
    subtitle?: string;
    badgeColor?: string;
    tasks: Task[];
  }

  const groupedTasks: TaskGroupItem[] = (() => {
    if (groupBy === 'none') {
      return [{ key: 'all', title: 'All Tasks', tasks: filteredTasks }];
    }

    if (groupBy === 'department') {
      const depts = Array.from(new Set(filteredTasks.map(t => t.department || 'Other Departments')));
      return depts.sort().map(dept => ({
        key: `dept-${dept}`,
        title: dept,
        subtitle: 'Departmental Queue',
        tasks: filteredTasks.filter(t => (t.department || 'Other Departments') === dept),
      }));
    }

    if (groupBy === 'status') {
      const statusOrder = [
        { key: 'pending', title: '🟡 Pending (Not Started)', color: '#f59e0b' },
        { key: 'in_progress', title: '🔵 In Progress', color: '#3b82f6' },
        { key: 'done', title: '🟢 Done (Completed)', color: '#10b981' },
        { key: 'overdue', title: '🔴 Overdue Tasks', color: '#ef4444' },
      ];
      return statusOrder.map(s => {
        const groupTasks = filteredTasks.filter(t => {
          const isOverdue = new Date(t.deadline) < new Date() && t.status !== 'done';
          if (s.key === 'overdue') return isOverdue;
          if (isOverdue) return false;
          return t.status === s.key;
        });
        return {
          key: `status-${s.key}`,
          title: s.title,
          badgeColor: s.color,
          tasks: groupTasks,
        };
      }).filter(g => g.tasks.length > 0);
    }

    if (groupBy === 'priority') {
      const priorities = [
        { key: 'urgent', title: '🚨 Urgent Priority', color: '#ef4444' },
        { key: 'high', title: '🟠 High Priority', color: '#f97316' },
        { key: 'medium', title: '🟡 Medium Priority', color: '#eab308' },
        { key: 'low', title: '🟢 Low Priority', color: '#22c55e' },
      ];
      return priorities.map(p => ({
        key: `priority-${p.key}`,
        title: p.title,
        badgeColor: p.color,
        tasks: filteredTasks.filter(t => t.priority === p.key),
      })).filter(g => g.tasks.length > 0);
    }

    if (groupBy === 'assignee') {
      const assignees = Array.from(new Set(filteredTasks.map(t => t.assignee_name || 'Unassigned')));
      return assignees.sort().map(name => {
        const matching = filteredTasks.filter(t => (t.assignee_name || 'Unassigned') === name);
        const dept = matching[0]?.assignee_department || '';
        const title = matching[0]?.assignee_title || '';
        return {
          key: `assignee-${name}`,
          title: `${title} ${name}`.trim(),
          subtitle: dept,
          tasks: matching,
        };
      });
    }

    if (groupBy === 'pillar') {
      return INSTITUTIONAL_PILLARS.map(p => {
        const taskTitles = p.tasks.map(t => t.title.toLowerCase());
        const pTasks = filteredTasks.filter(t => 
          (t.pillar_code && t.pillar_code.toUpperCase() === p.code) ||
          taskTitles.some(title => (t.title || '').toLowerCase().includes(title) || (t.description || '').toLowerCase().includes(title))
        );
        return {
          key: `pillar-${p.code}`,
          title: `${p.icon} Pillar ${p.code}: ${p.name}`,
          subtitle: `${pTasks.length} Institutional Tasks`,
          badgeColor: p.color,
          tasks: pTasks,
        };
      }).filter(g => g.tasks.length > 0);
    }

    return [{ key: 'all', title: 'All Tasks', tasks: filteredTasks }];
  })();

  // Compute actual assigned task count for the logged-in user
  const myTasksCount = useMemo(() => {
    if (!currentUser) return 0;
    if (isDean) return tasks.length;
    return tasks.filter(t => isUserAssignedToTask(t, currentUser)).length;
  }, [tasks, currentUser, isDean]);

  if (loading || !currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={32} className="pulse-dot" color="#3b82f6" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {!currentUser ? 'Redirecting to faculty login...' : 'Loading Faculty Governance Platform...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Top Navigation & Executive Header */}
      <Header
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin}
        isDean={isDean}
        isImpersonating={false}
        adminUser={adminUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onChangePassword={() => {
          setIsChangePasswordOpen(true);
          setChangePasswordError('');
          setChangePasswordSuccess('');
        }}
        leadershipUsers={leadershipUsers}
        profUsers={profUsers}
        drUsers={drUsers}
        laUsers={laUsers}
        taUsers={taUsers}
        raN112Users={raN112Users}
        prototypingRaUsers={prototypingRaUsers}
        adminCadreUsers={adminCadreUsers}
        tasks={tasks}
        logs={logs}
        onSelectTask={setSelectedTask}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={() => setIsMobilePreview(prev => !prev)}
      />

      {/* Main Container */}
      <main
        style={isMobilePreview ? {
          maxWidth: '430px',
          margin: '20px auto 40px',
          padding: '20px 16px',
          borderRadius: '42px',
          border: '10px solid #1e293b',
          boxShadow: '0 25px 70px rgba(0,0,0,0.5), 0 0 0 2px #475569',
          background: 'var(--bg-surface, #ffffff)',
          overflowX: 'hidden',
          position: 'relative',
        } : {
          maxWidth: '1480px',
          margin: '28px auto 0',
          padding: '0 28px',
        }}
      >
        {isMobilePreview && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px 14px',
            borderBottom: '1.5px solid var(--border)',
            marginBottom: '18px',
          }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📱 Mobile Layout (390 × 844)
            </span>
            <button
              onClick={() => setIsMobilePreview(false)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '3px 10px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontWeight: 700 }}
            >
              ✕ Exit Mobile
            </button>
          </div>
        )}
        
        {/* Clean Dashboard Navigation & Action Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          {/* Primary Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
            }}
          >
            {/* Overview */}
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                color: activeTab === 'overview' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'overview' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <LayoutDashboard size={17} />
              <span>Overview</span>
            </button>

            {/* Tasks */}
            <button
              onClick={() => {
                setStatusFilter('all');
                setActiveTab('tasks');
              }}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                color: activeTab === 'tasks' || activeTab === 'weekly_report' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'tasks' || activeTab === 'weekly_report' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <FileText size={17} />
              <span>{isDean ? 'Tasks' : 'My Tasks'}</span>
              <span className="tag-cat tag-cat-prof" style={{ fontSize: '0.75rem', padding: '1px 7px' }}>
                {isDean ? tasks.length : myTasksCount}
              </span>
            </button>

            {/* Committees & Meetings */}
            <button
              onClick={() => {
                setActiveTab('governance');
                fetchCommittees();
                fetchMeetings();
              }}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                color:
                  activeTab === 'governance' || activeTab === 'committees' || activeTab === 'meetings'
                    ? theme === 'dark'
                      ? '#fde047'
                      : '#b45309'
                    : 'var(--text-secondary)',
                borderBottom:
                  activeTab === 'governance' || activeTab === 'committees' || activeTab === 'meetings'
                    ? '2px solid #eab308'
                    : '2px solid transparent',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Award size={17} />
              <span>Committees & Meetings</span>
              <span
                className="tag-cat"
                style={{
                  background: 'rgba(234,179,8,0.15)',
                  color: '#eab308',
                  border: '1px solid rgba(234,179,8,0.3)',
                  fontSize: '0.75rem',
                  padding: '1px 7px',
                }}
              >
                {committees.length + meetings.length}
              </span>
            </button>

            {/* Calendar */}
            <button
              onClick={() => setActiveTab('calendar')}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                color: activeTab === 'calendar' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'calendar' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Calendar size={17} />
              <span>Calendar</span>
            </button>

            {/* Staff Directory (Available to all faculty) */}
            <button
              onClick={() => setActiveTab('staff')}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                color: activeTab === 'staff' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'staff' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <Users size={17} />
              <span>Faculty Staff</span>
            </button>

            {/* Master Audit Trail (Who did what and when) */}
            <button
              onClick={() => {
                setActiveTab('logs');
                fetchLogs();
              }}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                color: activeTab === 'logs' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'logs' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <History size={17} />
              <span>Master Audit Trail</span>
            </button>
          </div>

          {/* Clean Primary Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setIsNewTaskOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '0.88rem',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* TAB 0: DEAN'S OVERVIEW & INSTITUTIONAL BRIEFING */}
        {activeTab === 'overview' && (
          <DeanOverviewView
            tasks={tasks}
            hats={hats}
            currentUser={currentUser}
            analytics={analytics}
            meetings={meetings}
            committees={committees}
            onSelectTask={(task) => setSelectedTask(task)}
            onNavigateToTasks={(status) => {
              if (status && status !== 'all') {
                setStatusFilter(status);
              } else {
                setStatusFilter('all');
              }
              setActiveTab('tasks');
            }}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
            onOpenAccreditationDossier={() => setIsAccreditationModalOpen(true)}
            onOpenImportModal={() => setIsTaskImportOpen(true)}
            onDeanApprove={handleDeanAcknowledge}
            onScheduleMeeting={(task, committee) => {
              if (committee) {
                setEditingMeeting({
                  id: 0,
                  title: `[${committee.name}] Official Standing Committee Session`,
                  type: 'committee',
                  date: new Date().toISOString().split('T')[0],
                  location: "Presidential Boardroom (Building A)",
                  chair: `${committee.chair_title || ''} ${committee.chair_name || 'Committee Chair'}`,
                  rapporteur: `${committee.rapporteur_title || ''} ${committee.rapporteur_name || ''}`,
                  objective: `Statutory proceedings and review of committee mandates under decree ${committee.decree_ref || ''}.`,
                  agenda: committee.mandates && committee.mandates.length > 0 ? committee.mandates : ['1. Review of statutory mandates', '2. Deliberations & recommendations', '3. Approval of action items'],
                  attendees: (committee.members || []).map(m => ({
                    user_id: m.user_id,
                    name: m.name,
                    email: '',
                    role: m.role || 'Member',
                    department: '',
                    attended: true,
                  })),
                  status: 'scheduled',
                } as any);
                setIsCreateMeetingOpen(true);
              } else if (task) {
                handleTaskMeetingAction(task);
              } else {
                setEditingMeeting(null);
                setIsCreateMeetingOpen(true);
              }
            }}
          />
        )}

        {/* TAB 1: TASKS & COMPLIANCE MATRIX (Excel-Style Table View) */}
        {activeTab === 'tasks' && (
          <TasksTableView
            tasks={tasks}
            allUsers={allUsers}
            onRefreshTasks={fetchTasks}
            hats={hats}
            currentUser={currentUser}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelectTask={(task) => setSelectedTask(task)}
            onUpdateTask={(task) => {
              setSelectedTask(task);
              setUpdateStatus(task.status === 'done' ? 'done' : task.status === 'in_progress' ? 'in_progress' : 'pending');
              setUpdateNotes(task.completion_notes || '');
              setUpdateUrl(task.attachment_url || '');
              setUpdateDriveLink(task.drive_link || '');
              setUpdateActionPlan(task.action_plan || '');
              setIsUpdateTaskOpen(true);
            }}
            onRequestDeanMeeting={handleTaskMeetingAction}
            onNewTaskClick={() => setIsNewTaskOpen(true)}
            onOpenImportModal={() => setIsTaskImportOpen(true)}
            onDeanApprove={handleDeanAcknowledge}
          />
        )}

        {/* TAB: HATS & SPECIALIZED COMMITTEES */}
        {activeTab === 'hats' && (
          <HatsView
            hats={hats}
            tasks={tasks}
            currentUser={currentUser}
            hatSearchQuery={hatSearchQuery}
            setHatSearchQuery={setHatSearchQuery}
            onOpenCreateHat={handleOpenCreateHat}
            onOpenEditHat={handleOpenEditHat}
            onDeleteHat={handleDeleteHat}
            onQuickDispatchToHat={handleQuickDispatchToHat}
            onOpenAddMember={handleOpenAddMember}
            onRemoveMemberFromHat={handleRemoveMemberFromHat}
            onViewHatTasks={(hatId) => {
              setHatFilter(String(hatId));
              setActiveTab('tasks');
            }}
          />
        )}

        {/* TAB: COMMITTEES & MEETINGS (merged governance tab) */}
        {(activeTab === 'governance' || activeTab === 'committees' || activeTab === 'meetings') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* ── Section 1: Official Standing Committees ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid rgba(234,179,8,0.3)' }}>
                <Award size={20} style={{ color: '#eab308' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Official Standing Committees</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(234,179,8,0.15)', color: '#eab308' }}>
                  {committees.length} Statutory Bodies
                </span>
              </div>
              <CommitteesView
                committees={committees}
                currentUser={currentUser}
                tasks={tasks}
                onOpenCreateCommittee={handleOpenCreateCommittee}
                onOpenEditCommittee={handleOpenEditCommittee}
                onDeleteCommittee={handleDeleteCommittee}
                onOpenAddMember={handleOpenAddCommitteeMember}
                onRemoveMember={(committeeId, userId, userName, committeeName) =>
                  handleRemoveCommitteeMember(committeeId, userId, userName)
                }
                onOpenCreateCommitteeTask={(committee) => {
                  setTargetCommitteeId(committee.id);
                  setDispatchMode('committee');
                  setNewTaskTitle(`[${committee.name}] `);
                  setIsNewTaskOpen(true);
                }}
                onViewCommitteeTasks={(committeeId) => {
                  setActiveTab('tasks');
                }}
                onViewCommitteeMeetings={(committeeName) => {
                  // already on same page
                }}
                onScheduleCommitteeMeeting={(committee) => {
                  setEditingMeeting({
                    id: 0,
                    title: `[${committee.name}] Official Standing Committee Session`,
                    type: 'committee',
                    date: new Date().toISOString().split('T')[0],
                    location: "Presidential Boardroom (Building A)",
                    chair: `${committee.chair_title || ''} ${committee.chair_name || 'Committee Chair'}`,
                    rapporteur: `${committee.rapporteur_title || ''} ${committee.rapporteur_name || ''}`,
                    objective: `Statutory proceedings and review of committee mandates under decree ${committee.decree_ref || ''}.`,
                    agenda: committee.mandates && committee.mandates.length > 0 ? committee.mandates : ['1. Review of statutory mandates', '2. Deliberations & recommendations', '3. Approval of action items'],
                    attendees: (committee.members || []).map(m => ({
                      user_id: m.user_id,
                      name: m.name,
                      email: '',
                      role: m.role || 'Member',
                      department: '',
                      attended: true,
                    })),
                    status: 'scheduled',
                  } as any);
                  setIsCreateMeetingOpen(true);
                }}
                onScheduleMeetingWithDean={(committee) => {
                  if (isDean) {
                    setEditingMeeting({
                      id: 0,
                      title: `[${committee.name}] Executive Directive Review w/ Dean Prof. Dr. Gehan Safwat`,
                      type: 'committee',
                      date: new Date().toISOString().split('T')[0],
                      location: "Dean's Office (Building A, Room 301)",
                      chair: 'Prof. Dr. Gehan Safwat',
                      rapporteur: `${committee.rapporteur_title || ''} ${committee.rapporteur_name || ''}`,
                      objective: `Executive review of committee statutory proceedings and Dean directive sign-off under decree ${committee.decree_ref || ''}.`,
                      agenda: [
                        '1. Executive briefing & review of progress',
                        '2. Dean directives and strategic approvals',
                        '3. Action items and compliance milestones'
                      ],
                      attendees: [
                        { name: 'Prof. Dr. Gehan Safwat', role: 'Dean & Committee Chair', attended: true },
                        ...(committee.members || []).map(m => ({
                          user_id: m.user_id,
                          name: m.name,
                          email: '',
                          role: m.role || 'Member',
                          department: '',
                          attended: true,
                        }))
                      ],
                      status: 'scheduled',
                    } as any);
                    setIsCreateMeetingOpen(true);
                  } else {
                    setIsRequestDeanMeetingModalOpen(true);
                  }
                }}
                onScheduleInformationSession={(committee) => {
                  setEditingMeeting({
                    id: 0,
                    title: `[${committee.name}] Information & Guidance Session for Faculty & Students`,
                    type: 'committee',
                    date: new Date().toISOString().split('T')[0],
                    location: "Faculty Auditorium (Building A) / Hybrid Room 301",
                    chair: `${committee.chair_title || ''} ${committee.chair_name || 'Committee Chair'}`,
                    rapporteur: `${committee.rapporteur_title || ''} ${committee.rapporteur_name || ''}`,
                    objective: `Official statutory information session to present academic guidelines, protocols, and updates to faculty staff and students under decree ${committee.decree_ref || ''}.`,
                    agenda: [
                      `1. Introduction & Statutory Context under Decree ${committee.decree_ref || ''}`,
                      `2. Presentation of Guidelines, Protocols & Information to Participants`,
                      `3. Open Floor Q&A, Feedback & Inquiries`
                    ],
                    attendees: (committee.members || []).map(m => ({
                      user_id: m.user_id,
                      name: m.name,
                      email: '',
                      role: m.role || 'Member',
                      department: '',
                      attended: true,
                    })),
                    status: 'scheduled',
                  } as any);
                  setIsCreateMeetingOpen(true);
                }}
                onRecordCommitteeMoM={(committee) => {
                  setEditingMeeting({
                    id: 0,
                    title: `[${committee.name}] Official Committee Session & Minutes of Meeting (MoM)`,
                    type: 'committee',
                    date: new Date().toISOString().split('T')[0],
                    location: "Presidential Boardroom (Building A)",
                    chair: `${committee.chair_title || ''} ${committee.chair_name || 'Committee Chair'}`,
                    rapporteur: `${committee.rapporteur_title || ''} ${committee.rapporteur_name || ''}`,
                    objective: `Official statutory proceedings, deliberation of mandates, and resolution of committee directives under decree ${committee.decree_ref || ''}.`,
                    agenda: committee.mandates && committee.mandates.length > 0 ? committee.mandates : ['1. Opening and review of mandates', '2. Executive committee deliberations', '3. Approval of resolutions & MoM'],
                    attendees: (committee.members || []).map(m => ({
                      user_id: m.user_id,
                      name: m.name,
                      email: '',
                      role: m.role || 'Member',
                      department: '',
                      attended: true,
                    })),
                    status: 'completed',
                  } as any);
                  setIsCreateMeetingOpen(true);
                }}
              />
            </div>

            {/* ── Divider ── */}
            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* ── Section 2: Meetings, Delegations & MoM ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid rgba(59,130,246,0.3)' }}>
                <Building2 size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Meetings & Presidential Delegations</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                  {meetings.length} Sessions
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                  (includes pre/post-presidential discussions and faculty committee sessions)
                </span>
              </div>
              <MeetingsView
                meetings={meetings}
                currentUser={currentUser}
                onOpenCreateMeeting={() => {
                  setEditingMeeting(null);
                  setIsCreateMeetingOpen(true);
                }}
                onOpenEditMeeting={(meeting) => {
                  setEditingMeeting(meeting);
                  setIsCreateMeetingOpen(true);
                }}
                onOpenInspectMoM={(m) => setInspectingMeeting(m)}
                onDeleteMeeting={handleDeleteMeeting}
                onOpenTaskDetails={(taskId) => {
                  const t = tasks.find(x => x.id === taskId);
                  if (t) {
                    setSelectedTask(t);
                    setActiveTab('tasks');
                  }
                }}
                onOpenDeanBriefing={handleOpenDeanBriefing}
                onOpenRequestMeetingWithDean={() => setIsRequestDeanMeetingModalOpen(true)}
                onOpenDeanAvailabilitySettings={() => setIsDeanAvailabilityModalOpen(true)}
                onApproveMeetingSlot={handleApproveMeetingSlot}
                onDeclineMeeting={handleDeclineMeeting}
                deanSlots={deanSlots}
              />
            </div>
          </div>
        )}

        {/* TAB: WEEKLY DIRECTIVE & FOLLOW-UP TASKS (FALL 2026) */}
        {activeTab === 'weekly_report' && (
          <WeeklyReportView
            tasks={tasks}
            currentUser={currentUser}
            theme={theme}
            onOpenCreateRequest={() => setIsCreateSubmissionModalOpen(true)}
            onOpenTaskDetails={(task) => {
              if (currentUser?.id === task.assigned_to_id && task.status !== 'done') {
                setSelectedTask(task);
                setUpdateStatus((task.status as any) || 'in_progress');
                setUpdateNotes(task.completion_notes || '');
                setUpdateUrl(task.completion_url || '');
                setIsUpdateTaskOpen(true);
              } else {
                setSelectedTask(task);
              }
            }}
            onOpenEmailDispatch={(task, subject, body) => {
              setEmailTargetTask(task || null);
              setIsEmailModalOpen(true);
            }}
            onOpenSubmissionsDrawer={(task) => setInspectingSubmissionsTask(task)}
          />
        )}

        {/* TAB: CALENDAR & DUE DATES SCHEDULE (All Members & Dean) */}
        {activeTab === 'calendar' && (
          <CalendarView
            tasks={tasks}
            meetings={meetings}
            hats={hats}
            currentUser={currentUser}
            onSelectTask={(task) => setSelectedTask(task)}
            onSelectMeeting={(meeting) => setInspectingMeeting(meeting)}
            isDean={isDean}
          />
        )}

        {/* TAB: MASTER AUDIT TRAIL (Who did what and when) */}
        {activeTab === 'logs' && (
          <LogsView
            logs={logs}
            logSearch={logSearch}
            setLogSearch={setLogSearch}
            logActionFilter={logActionFilter}
            setLogActionFilter={setLogActionFilter}
            logUserFilter={logUserFilter}
            setLogUserFilter={setLogUserFilter}
            leadershipUsers={leadershipUsers}
            profUsers={profUsers}
            drUsers={drUsers}
            laUsers={laUsers}
            taUsers={taUsers}
            raN112Users={raN112Users}
            prototypingRaUsers={prototypingRaUsers}
            adminCadreUsers={adminCadreUsers}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* TAB: FACULTY DIRECTORY & PERFORMANCE OVERVIEW (Dean Only) */}
        {activeTab === 'staff' && isDean && (
          <StaffView
            baseUsers={baseUsers}
            profUsers={profUsers}
            drUsers={drUsers}
            laUsers={laUsers}
            taUsers={taUsers}
            raN112Users={raN112Users}
            prototypingRaUsers={prototypingRaUsers}
            adminCadreUsers={adminCadreUsers}
            leadershipUsers={leadershipUsers}
            academicStaffUsers={academicStaffUsers}
            directoryCategory={directoryCategory}
            setDirectoryCategory={setDirectoryCategory}
            directorySearch={directorySearch}
            setDirectorySearch={setDirectorySearch}
            onAssignTaskToMember={(memberId) => {
              setNewTaskAssigneeId(memberId);
              setDispatchMode('single');
              setIsNewTaskOpen(true);
            }}
            onViewMemberTasks={(name) => {
              setSearchQuery(name);
              setActiveTab('tasks');
            }}
            onOpenCreateMember={handleOpenCreateFacultyMember}
            onOpenImportMembers={() => setIsFacultyImportModalOpen(true)}
            onEditMember={handleOpenEditFacultyMember}
            onDeleteMember={handleDeleteFacultyMember}
            currentUser={currentUser}
          />
        )}

        {/* TAB: FACULTY ANALYTICS (Dean Only) */}
        {activeTab === 'analytics' && isDean && (
          <AnalyticsView
            analytics={analytics}
            onOpenAccreditationDossier={() => setIsAccreditationModalOpen(true)}
            tasks={tasks}
            hats={hats}
            onSelectTask={setSelectedTask}
          />
        )}
      </main>

      {/* MODAL 1: DISPATCH / UPLOAD TASK (Dean Office) */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSubmit={handleCreateTask}
        dispatchMode={dispatchMode}
        setDispatchMode={setDispatchMode}
        hats={hats}
        targetHatId={targetHatId}
        setTargetHatId={setTargetHatId}
        committees={committees}
        targetCommitteeId={targetCommitteeId}
        setTargetCommitteeId={setTargetCommitteeId}
        taskOwnerId={taskOwnerId}
        setTaskOwnerId={setTaskOwnerId}
        responsibilityModel={responsibilityModel}
        setResponsibilityModel={setResponsibilityModel}
        requiresDeanApproval={requiresDeanApproval}
        setRequiresDeanApproval={setRequiresDeanApproval}
        selectedRecipients={selectedRecipients}
        setSelectedRecipients={setSelectedRecipients}
        targetDept={targetDept}
        setTargetDept={setTargetDept}
        recipientSearch={recipientSearch}
        setRecipientSearch={setRecipientSearch}
        newTaskCategory={newTaskCategory}
        setNewTaskCategory={setNewTaskCategory}
        newTaskGoogleFormUrl={newTaskGoogleFormUrl}
        setNewTaskGoogleFormUrl={setNewTaskGoogleFormUrl}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskPriority={newTaskPriority}
        setNewTaskPriority={setNewTaskPriority}
        newTaskDeadline={newTaskDeadline}
        setNewTaskDeadline={setNewTaskDeadline}
        newTaskDescription={newTaskDescription}
        setNewTaskDescription={setNewTaskDescription}
        newTaskAssigneeId={newTaskAssigneeId}
        setNewTaskAssigneeId={setNewTaskAssigneeId}
        newTaskAttachment={newTaskAttachment}
        setNewTaskAttachment={setNewTaskAttachment}
        handleFileChange={handleFileChange}
        formatFileSize={formatFileSize}
        isCreatingTask={isCreatingTask}
        currentUser={currentUser}
        allUsers={allUsers}
        baseUsers={baseUsers}
        leadershipUsers={leadershipUsers}
        profUsers={profUsers}
        drUsers={drUsers}
        laUsers={laUsers}
        taUsers={taUsers}
        raN112Users={raN112Users}
        prototypingRaUsers={prototypingRaUsers}
        adminCadreUsers={adminCadreUsers}
        facultyDepartments={facultyDepartments}
      />

      {/* MODAL: BULK STATUS UPDATE (For Dean & Staff) */}
      <BulkStatusModal
        isOpen={isBulkStatusModalOpen}
        onClose={() => setIsBulkStatusModalOpen(false)}
        selectedCount={selectedTaskIds.length}
        bulkStatus={bulkStatus}
        setBulkStatus={setBulkStatus}
        bulkNotes={bulkNotes}
        setBulkNotes={setBulkNotes}
        isDean={isDean}
        isBulkLoading={isBulkLoading}
        onSubmit={handleBulkStatusSubmit}
      />

      {/* MODAL: BULK PRIORITY UPDATE (Dean Only) */}
      <BulkPriorityModal
        isOpen={isBulkPriorityModalOpen}
        onClose={() => setIsBulkPriorityModalOpen(false)}
        selectedCount={selectedTaskIds.length}
        bulkPriority={bulkPriority}
        setBulkPriority={setBulkPriority}
        isBulkLoading={isBulkLoading}
        onSubmit={handleBulkPrioritySubmit}
      />

      {/* MODAL: BULK REASSIGN (Dean Only) */}
      <BulkReassignModal
        isOpen={isBulkReassignModalOpen}
        onClose={() => setIsBulkReassignModalOpen(false)}
        selectedCount={selectedTaskIds.length}
        users={allUsers}
        hats={hats}
        isBulkLoading={isBulkLoading}
        onSubmit={handleBulkReassignSubmit}
      />

      {/* MODAL: BULK RESCHEDULE (Dean Only) */}
      <BulkRescheduleModal
        isOpen={isBulkRescheduleModalOpen}
        onClose={() => setIsBulkRescheduleModalOpen(false)}
        selectedCount={selectedTaskIds.length}
        isBulkLoading={isBulkLoading}
        onSubmit={handleBulkRescheduleSubmit}
        onQuickExtend={handleBulkExtendDeadline}
      />

      {/* MODAL 2: PROFESSOR UPDATE TASK & WRITE DESCRIPTION */}
      <UpdateTaskModal
          isOpen={isUpdateTaskOpen && !!selectedTask}
          task={selectedTask}
          onClose={() => setIsUpdateTaskOpen(false)}
          onSubmit={handleSubmitTaskUpdate}
          updateStatus={updateStatus}
          setUpdateStatus={setUpdateStatus}
          updateNotes={updateNotes}
          setUpdateNotes={setUpdateNotes}
          updateUrl={updateUrl}
          setUpdateUrl={setUpdateUrl}
          driveLink={updateDriveLink}
          setDriveLink={setUpdateDriveLink}
          actionPlan={updateActionPlan}
          setActionPlan={setUpdateActionPlan}
          onRequestDeanMeeting={() => {
            if (selectedTask) {
              setIsUpdateTaskOpen(false);
              handleTaskMeetingAction(selectedTask);
            }
          }}
          isSubmittingUpdate={isSubmittingUpdate}
          formatFileSize={formatFileSize}
          isDean={isDean}
        />

      {/* MODAL 3: TASK & GOVERNANCE INSPECTION DRAWER */}
      <TaskInspectionDrawer
        task={selectedTask && !isUpdateTaskOpen ? selectedTask : null}
        onClose={() => setSelectedTask(null)}
        onDeanAcknowledge={handleDeanAcknowledge}
        onRequestRevision={handleRequestRevision}
        onOpenEmailDispatch={(t) => {
          setEmailTargetTask(t);
          setIsEmailModalOpen(true);
        }}
          onRequestDeanMeeting={(t) => {
            handleTaskMeetingAction(t);
          }}
        formatFileSize={formatFileSize}
        allTasks={tasks}
        currentUser={currentUser}
        allUsers={allUsers}
        onSubTaskCreated={fetchTasks}
      />

      {/* MODAL: CREATE OR EDIT HAT GROUP */}
      <HatModal
        isOpen={isCreateHatOpen || isEditHatOpen}
        isEdit={isEditHatOpen}
        onClose={() => {
          setIsCreateHatOpen(false);
          setIsEditHatOpen(false);
        }}
        onSubmit={handleSaveHat}
        hatFormName={hatFormName}
        setHatFormName={setHatFormName}
        hatFormDesc={hatFormDesc}
        setHatFormDesc={setHatFormDesc}
        hatFormIcon={hatFormIcon}
        setHatFormIcon={setHatFormIcon}
        hatFormColor={hatFormColor}
        setHatFormColor={setHatFormColor}
        isSavingHat={isSavingHat}
      />

      {/* MODAL: ADD MEMBER TO HAT */}
      <AddMemberModal
        isOpen={isAddMemberOpen && !!targetHatForMember}
        onClose={() => setIsAddMemberOpen(false)}
        targetHat={targetHatForMember}
        onSubmit={handleAddMemberToHat}
        memberSearchQuery={memberSearchQuery}
        setMemberSearchQuery={setMemberSearchQuery}
        newMemberUserId={newMemberUserId}
        setNewMemberUserId={setNewMemberUserId}
        newMemberRoleInHat={newMemberRoleInHat}
        setNewMemberRoleInHat={setNewMemberRoleInHat}
        leadershipUsers={leadershipUsers}
        profUsers={profUsers}
        drUsers={drUsers}
        laUsers={laUsers}
        taUsers={taUsers}
        raN112Users={raN112Users}
        prototypingRaUsers={prototypingRaUsers}
        adminCadreUsers={adminCadreUsers}
        isAddingMember={isAddingMember}
      />

      {/* MODAL: MINUTES OF MEETING (MoM) VIEWER */}
      <MomInspectionModal
        isOpen={!!inspectingMeeting}
        onClose={() => setInspectingMeeting(null)}
        meeting={inspectingMeeting}
        currentUser={currentUser}
        onConvertActionItem={handleConvertActionItem}
        onOpenTaskDetails={(taskId) => {
          setInspectingMeeting(null);
          const t = tasks.find(x => x.id === taskId);
          if (t) {
            setSelectedTask(t);
            setActiveTab('tasks');
          }
        }}
      />

      {/* MODAL: NEW OR EDIT MEETING / MoM */}
      <NewMeetingModal
        isOpen={isCreateMeetingOpen}
        onClose={() => {
          setIsCreateMeetingOpen(false);
          setEditingMeeting(null);
        }}
        currentUser={currentUser}
        hats={hats}
        staff={ALL_FACULTY_STAFF}
        onCreated={handleMeetingCreated}
        onUpdated={handleMeetingUpdated}
        editingMeeting={editingMeeting}
        meetings={meetings}
        tasks={tasks}
      />

      {/* MODAL: DEAN BRIEFING & STRATEGIC ALIGNMENT (Prof. Dr. Gehan Safwat) */}
      <DeanBriefingModal
        isOpen={isDeanBriefingModalOpen}
        onClose={() => {
          setIsDeanBriefingModalOpen(false);
          setBriefingTargetMeeting(null);
        }}
        meeting={briefingTargetMeeting}
        staffList={baseUsers}
        currentUser={currentUser}
        onSaveBriefing={handleSaveDeanBriefing}
      />

      {/* MODAL: DEAN AVAILABILITY SETTINGS (Prof. Dr. Gehan Safwat) */}
      <DeanAvailabilityModal
        isOpen={isDeanAvailabilityModalOpen}
        onClose={() => setIsDeanAvailabilityModalOpen(false)}
        slots={deanSlots}
        onSaveSlots={handleSaveDeanSlots}
      />

      {/* MODAL: REQUEST MEETING WITH DEAN GEHAN (3 OPTIONS PROPOSAL) */}
      <RequestDeanMeetingModal
        isOpen={isRequestDeanMeetingModalOpen}
        onClose={() => {
          setIsRequestDeanMeetingModalOpen(false);
          setMeetingTaskContext(null);
        }}
        currentUser={currentUser}
        staff={ALL_FACULTY_STAFF}
        hats={hats}
        committees={committees}
        deanSlots={deanSlots}
        task={meetingTaskContext}
        onMeetingRequested={(newMeeting) => {
          handleMeetingCreated(newMeeting);
          setIsRequestDeanMeetingModalOpen(false);
          setMeetingTaskContext(null);
        }}
      />

      {/* MODAL: CREATE OR EDIT OFFICIAL COMMITTEE */}
      <CommitteeModal
        isOpen={isCreateCommitteeOpen}
        onClose={() => {
          setIsCreateCommitteeOpen(false);
          setEditingCommittee(null);
        }}
        committee={editingCommittee}
        currentUser={currentUser}
        onSave={handleSaveCommittee}
        onDelete={handleDeleteCommittee}
      />

      {/* MODAL: APPOINT MEMBER TO OFFICIAL COMMITTEE */}
      <AddCommitteeMemberModal
        isOpen={isAddCommitteeMemberOpen && !!targetCommitteeForMember}
        onClose={() => {
          setIsAddCommitteeMemberOpen(false);
          setTargetCommitteeForMember(null);
        }}
        committee={targetCommitteeForMember}
        staffList={allUsers}
        onAddMember={handleAddCommitteeMember}
      />

      {/* MODAL: 12-PILLARS NAQAAE ACCREDITATION DOSSIER */}
      <AccreditationExportModal
        isOpen={isAccreditationModalOpen}
        onClose={() => setIsAccreditationModalOpen(false)}
        tasks={tasks}
        hats={hats}
      />

      {/* MODAL: ACADEMIC EMAIL DIRECTIVE DISPATCHER */}
      <EmailDispatchModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailTargetTask(null);
        }}
        task={emailTargetTask}
        users={allUsers}
        hats={hats}
        currentUser={currentUser}
        onDispatchSuccess={fetchData}
      />

      {/* MODAL: CREATE OR EDIT FACULTY MEMBER */}
      <FacultyMemberModal
        isOpen={isFacultyMemberModalOpen}
        onClose={() => {
          setIsFacultyMemberModalOpen(false);
          setEditingFacultyMember(null);
        }}
        member={editingFacultyMember}
        onSave={handleSaveFacultyMember}
        facultyDepartments={facultyDepartments}
      />

      {/* MODAL: BATCH IMPORT FACULTY MEMBERS */}
      <FacultyImportModal
        isOpen={isFacultyImportModalOpen}
        onClose={() => setIsFacultyImportModalOpen(false)}
        onImportSuccess={handleFacultyImportSuccess}
      />

      {/* MODAL: CREATE CONFIDENTIAL SUBMISSION / FILE REQUEST */}
      <CreateSubmissionRequestModal
        isOpen={isCreateSubmissionModalOpen}
        onClose={() => setIsCreateSubmissionModalOpen(false)}
        currentUser={currentUser}
        staffList={allUsers}
        onCreated={() => {
          fetchData();
        }}
      />

      {/* DRAWER: CONFIDENTIAL SUBMISSIONS INSPECTION (CREATOR ONLY) */}
      <ConfidentialSubmissionsDrawer
        isOpen={Boolean(inspectingSubmissionsTask)}
        onClose={() => setInspectingSubmissionsTask(null)}
        rootTask={inspectingSubmissionsTask}
        allTasks={tasks}
        currentUser={currentUser}
        onAcknowledgeSubmission={handleDeanAcknowledge}
        onRequestRevision={handleRequestRevision}
        formatFileSize={formatFileSize}
      />

      {/* MODAL: SPREADSHEET & EXCEL TASK IMPORT / SYNC */}
      <TaskImportModal
        isOpen={isTaskImportOpen}
        onClose={() => setIsTaskImportOpen(false)}
        onSuccess={() => {
          fetchTasks();
          if (isDean) fetchLogs();
        }}
      />

      {/* MODAL: CHANGE PERSONAL PASSWORD */}
      {isChangePasswordOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px',
        }}>
          <div className="modal-content" style={{
            background: 'var(--card-bg, #111a31)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="var(--accent-blue)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Change Your Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Logged in as <strong style={{ color: 'var(--text-main)' }}>{currentUser?.full_name}</strong> ({currentUser?.email})
            </p>

            {changePasswordError && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.82rem',
                marginBottom: '14px',
              }}>
                {changePasswordError}
              </div>
            )}

            {changePasswordSuccess && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.82rem',
                marginBottom: '14px',
              }}>
                {changePasswordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="Minimum 6 characters"
                  value={changePasswordNew}
                  onChange={(e) => setChangePasswordNew(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="Re-type your new password"
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600 }}
                  disabled={changePasswordLoading}
                >
                  {changePasswordLoading ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
