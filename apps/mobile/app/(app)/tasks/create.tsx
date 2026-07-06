/**
 * Create Task — 2-step form for Admin+ users.
 *
 * Step 1: Title · Description · Department · Assignee(s) · Priority
 * Step 2: Due date & time · Category · Reference attachments · Recurring
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';

import type { TaskPriority, User, Department, CreateTaskDto } from '@godigitify/types';
import { departmentsApi, usersApi, tasksApi, getApiClient } from '@godigitify/api-client';
import { TimePickerModal } from '../../../src/components/ui/TimePickerModal';
import { useCreateTask, useCreateTaskBatch } from '../../../src/hooks/useTasks';
import { useTaskDraft } from '../../../src/hooks/useTaskDraft';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useAuthStore } from '../../../src/stores/auth.store';
import { useColors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Layout, Spacing } from '../../../src/constants/spacing';

type PickedFile = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
};

type TaskCategory = { id: string; label: string };

// UI-only tagging — the Task schema has no category field, so these are folded
// into the description on submit rather than sent as a separate field.
const TASK_CATEGORIES: TaskCategory[] = [
  { id: 'cat_01', label: 'Maintenance' },
  { id: 'cat_02', label: 'Reporting' },
  { id: 'cat_03', label: 'Audit' },
  { id: 'cat_04', label: 'Administration' },
  { id: 'cat_05', label: 'Training' },
  { id: 'cat_06', label: 'Procurement' },
  { id: 'cat_07', label: 'Safety' },
  { id: 'cat_08', label: 'Compliance' },
];

// ─── Priority config ─────────────────────────────────────────────────────────

type PriorityOption = {
  value: TaskPriority;
  label: string;
  dotColor: string;
  selectedBg: string;
  selectedBorder: string;
  selectedTextColor: string;
};

const PRIORITIES: PriorityOption[] = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    dotColor: '#7C3AED',
    selectedBg: '#F5F3FF',
    selectedBorder: '#7C3AED',
    selectedTextColor: '#5B21B6',
  },
  {
    value: 'HIGH',
    label: 'High',
    dotColor: '#EF4444',
    selectedBg: '#FEF2F2',
    selectedBorder: '#EF4444',
    selectedTextColor: '#B91C1C',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    dotColor: '#F59E0B',
    selectedBg: '#FFFBEB',
    selectedBorder: '#F59E0B',
    selectedTextColor: '#B45309',
  },
  {
    value: 'LOW',
    label: 'Low',
    dotColor: '#22C55E',
    selectedBg: '#F0FDF4',
    selectedBorder: '#22C55E',
    selectedTextColor: '#15803D',
  },
];

// ─── Calendar helpers ────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

// ─── File size formatter ─────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();

  // ── Step ─────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Remote data ──────────────────────────────────────────────────────────
  const currentUser = useAuthStore((s) => s.user);
  const createTask = useCreateTask();
  const createTaskBatch = useCreateTaskBatch();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptUsers, setDeptUsers] = useState<User[]>([]);
  const [categories] = useState<TaskCategory[]>(TASK_CATEGORIES);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Step 1 form fields ────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [duplicateTitleWarning, setDuplicateTitleWarning] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(currentUser?.departmentId ?? '');
  const [assignees, setAssignees] = useState<User[]>([]);
  const [assigneeError, setAssigneeError] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');

  // ── Step 2 form fields ────────────────────────────────────────────────────
  const tomorrow = dayjs().add(1, 'day');
  const [pickedDate, setPickedDate] = useState(tomorrow);
  const [dueHour, setDueHour] = useState(5);     // 1–12
  const [dueMinute, setDueMinute] = useState(0);  // 0–55
  const [isAfternoon, setIsAfternoon] = useState(true); // PM default
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<PickedFile[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);

  // ── Modal visibility ──────────────────────────────────────────────────────
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ── Submitting ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);

  // ── Draft crash-resilience ──────────────────────────────────────────────────
  const { hydrated: draftHydrated, draft, saveDraft, clearDraft } = useTaskDraft(currentUser?.id);
  const [draftRestored, setDraftRestored] = useState(false);
  const draftApplied = useRef(false);

  // Restore a saved draft once, after storage has loaded.
  useEffect(() => {
    if (!draftHydrated || draftApplied.current) return;
    draftApplied.current = true;
    if (!draft) return;
    setTitle(draft.title);
    setDescription(draft.description);
    setDepartmentId(draft.departmentId);
    setAssignees(draft.assignees);
    setPriority(draft.priority);
    setPickedDate(dayjs(draft.pickedDate));
    setDueHour(draft.dueHour);
    setDueMinute(draft.dueMinute);
    setIsAfternoon(draft.isAfternoon);
    setCategoryIds(draft.categoryIds);
    setIsRecurring(draft.isRecurring);
    setDraftRestored(true);
  }, [draftHydrated, draft]);

  // Auto-save (debounced inside the hook). Skips a pristine/empty form so we
  // don't persist a blank draft just from opening the screen.
  useEffect(() => {
    if (!draftHydrated) return;
    const pristine =
      !title.trim() && !description.trim() && assignees.length === 0 && categoryIds.length === 0 && !isRecurring;
    if (pristine) return;
    saveDraft({
      title,
      description,
      departmentId,
      assignees,
      priority,
      pickedDate: pickedDate.toISOString(),
      dueHour,
      dueMinute,
      isAfternoon,
      categoryIds,
      isRecurring,
    });
  }, [
    draftHydrated, title, description, departmentId, assignees, priority,
    pickedDate, dueHour, dueMinute, isAfternoon, categoryIds, isRecurring, saveDraft,
  ]);

  const handleDiscardDraft = useCallback(() => {
    setTitle('');
    setDescription('');
    setDepartmentId(currentUser?.departmentId ?? '');
    setAssignees([]);
    setPriority('MEDIUM');
    setPickedDate(dayjs().add(1, 'day'));
    setDueHour(5);
    setDueMinute(0);
    setIsAfternoon(true);
    setCategoryIds([]);
    setIsRecurring(false);
    clearDraft();
    setDraftRestored(false);
  }, [clearDraft, currentUser?.departmentId]);

  // ─── Load departments on mount ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await departmentsApi.getList();
        if (!mounted) return;
        setDepartments(res.data);
        if (!departmentId && res.data.length > 0 && res.data[0]) {
          setDepartmentId(res.data[0].id);
        }
      } finally {
        if (mounted) setDataLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Reload users when department changes ─────────────────────────────────
  useEffect(() => {
    if (!departmentId) return;
    let mounted = true;
    void (async () => {
      const res = await usersApi.getList({ departmentId, isActive: true, limit: 100 });
      if (mounted) {
        // Exclude the current user — the person creating the task never
        // belongs in their own assignee picker (same class of bug fixed
        // earlier for the People list — see useOrgUsers).
        const assignable = res.data.items.filter((u) => u.id !== currentUser?.id);
        setDeptUsers(assignable);
        // Remove selected assignees who are no longer in this dept
        setAssignees((prev) =>
          prev.filter((a) => assignable.some((u) => u.id === a.id)),
        );
      }
    })();
    return () => { mounted = false; };
  }, [departmentId, currentUser?.id]);

  // ─── Duplicate-title check (§4.7: "warn, not block", same dept this month) ─
  const debouncedTitle = useDebounce(title.trim(), 400);
  useEffect(() => {
    if (!debouncedTitle || !departmentId) {
      setDuplicateTitleWarning('');
      return;
    }
    let mounted = true;
    void (async () => {
      // No creation-date filter on GET /tasks — fetch by dept + title search,
      // then narrow to "this month" client-side using each task's createdAt.
      const res = await tasksApi.getList({ departmentId, search: debouncedTitle, limit: 10 });
      if (!mounted) return;
      const monthStart = dayjs().startOf('month');
      const exists = res.data.some(
        (t) => t.title.trim().toLowerCase() === debouncedTitle.toLowerCase() && dayjs(t.createdAt).isAfter(monthStart)
      );
      setDuplicateTitleWarning(exists ? 'A task with this title already exists in this department this month' : '');
    })();
    return () => { mounted = false; };
  }, [debouncedTitle, departmentId]);

  // ─── Step 1 → Step 2 validation ──────────────────────────────────────────
  const validateStep1 = (): boolean => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Task title is required');
      valid = false;
    } else {
      setTitleError('');
    }
    if (assignees.length === 0) {
      setAssigneeError('Add at least one assignee');
      valid = false;
    } else {
      setAssigneeError('');
    }
    return valid;
  };

  const handleContinue = async () => {
    if (!validateStep1()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const buildDueDateIso = (): string => {
    const hour24 = isAfternoon
      ? (dueHour === 12 ? 12 : dueHour + 12)
      : (dueHour === 12 ? 0 : dueHour);
    return pickedDate.hour(hour24).minute(dueMinute).second(0).toISOString();
  };

  const uploadAttachmentsTo = async (taskId: string) => {
    const client = getApiClient();
    for (const file of attachments) {
      try {
        const presign = await client.post<{ uploadUrl: string; storageKey: string }>(
          '/files/presign',
          { taskId, fileName: file.name, mimeType: file.mimeType, isProof: false },
        );
        await fetch(presign.data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.mimeType },
          body: await (await fetch(file.uri)).blob(),
        });
        await client.post('/files/confirm', {
          taskId,
          storageKey: presign.data.storageKey,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          isProof: false,
        });
      } catch {
        // Best-effort: task creation already succeeded; surface nothing blocking here.
      }
    }
  };

  const handleSubmit = async () => {
    const dueDate = buildDueDateIso();
    if (dayjs(dueDate).isBefore(dayjs())) {
      Alert.alert('Error', 'Due date must be in the future');
      return;
    }

    const categoryLabels = categories
      .filter((c) => categoryIds.includes(c.id))
      .map((c) => c.label);
    const fullDescription = categoryLabels.length
      ? `${description.trim()}${description.trim() ? '\n\n' : ''}Category: ${categoryLabels.join(', ')}`
      : description.trim();

    setSubmitting(true);
    try {
      let createdTaskIds: string[];

      if (assignees.length > 1) {
        // Duplicate-to-team (FR-23): one shared batchId so the Batch
        // Progress screens can track every copy as one group — each
        // assignee still gets their own isolated, independent task.
        const batchRes = await createTaskBatch.mutateAsync({
          title: title.trim(),
          priority,
          dueDate,
          assigneeIds: assignees.map((a) => a.id),
          ...(fullDescription ? { description: fullDescription } : {}),
          ...(departmentId ? { departmentId } : {}),
        });
        const summary = await tasksApi.getBatchSummary(batchRes.data.id);
        createdTaskIds = summary.data.members.map((m) => m.id);
      } else {
        // Single assignee — plain task, no batch overhead.
        const dto: CreateTaskDto = {
          title: title.trim(),
          priority,
          dueDate,
          assigneeId: assignees[0]!.id,
          ...(fullDescription ? { description: fullDescription } : {}),
          ...(departmentId ? { departmentId } : {}),
          ...(isRecurring ? { isRecurring: true } : {}),
        };
        const res = await createTask.mutateAsync(dto);
        createdTaskIds = [res.data.id];
      }

      if (attachments.length > 0) {
        await Promise.all(createdTaskIds.map((id) => uploadAttachmentsTo(id)));
      }

      clearDraft();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      // Creation itself already shows an error toast via useApiMutation
      // (useCreateTask/useCreateTaskBatch). The rarer case — creation
      // succeeds but the batch-summary lookup right after it fails — is
      // best-effort, same tolerance as the attachment upload step below.
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Attachment picker ────────────────────────────────────────────────────
  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      multiple: true,
    });
    if (result.canceled || !result.assets) return;
    const newFiles: PickedFile[] = result.assets
      .slice(0, 5 - attachments.length)
      .map((a) => ({
        uri: a.uri,
        name: a.name,
        size: a.size ?? 0,
        mimeType: a.mimeType ?? 'application/octet-stream',
      }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  // ─── Assignee helpers ─────────────────────────────────────────────────────
  const addAssignee = (user: User) => {
    if (assignees.find((a) => a.id === user.id)) return;
    setAssignees((prev) => [...prev, user]);
    setAssigneeError('');
  };

  const removeAssignee = (userId: string) => {
    setAssignees((prev) => prev.filter((a) => a.id !== userId));
  };

  const departmentName = useMemo(
    () => departments.find((d) => d.id === departmentId)?.name ?? '—',
    [departments, departmentId],
  );

  const formattedDueDate = pickedDate.format('MMM D, YYYY');
  const formattedDueTime = `${dueHour}:${String(dueMinute).padStart(2, '0')} ${isAfternoon ? 'PM' : 'AM'}`;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: C.surface.background }]}>
      {/* ── Custom header ── */}
      <View
        style={[
          s.header,
          { paddingTop: insets.top + 6, backgroundColor: C.surface.card, borderBottomColor: C.surface.border },
        ]}
      >
        <View style={s.headerRow}>
          {/* Left: X (step 1) or ← (step 2) */}
          <Pressable
            onPress={step === 1 ? () => router.back() : () => setStep(1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={s.headerIconBtn}
            accessibilityLabel={step === 1 ? 'Cancel' : 'Back'}
          >
            {step === 1 ? (
              <Feather name="x" size={22} color={C.text.primary} />
            ) : (
              <Feather name="arrow-left" size={22} color={C.text.primary} />
            )}
          </Pressable>

          <Text style={[s.headerTitle, { color: C.text.primary }]}>New Task</Text>

          <Text style={[s.stepLabel, { color: C.text.tertiary }]}>
            Step {step} of 2
          </Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressRow}>
          <View style={[s.progressSegment, { backgroundColor: C.brand.primary }]} />
          <View
            style={[
              s.progressSegment,
              { backgroundColor: step === 2 ? C.brand.primary : C.surface.border },
            ]}
          />
        </View>
      </View>

      {/* ── Body ── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {draftRestored && step === 1 && (
            <View style={[s.draftBanner, { backgroundColor: C.brand.primaryLight, borderColor: C.brand.primary }]}>
              <Feather name="rotate-ccw" size={15} color={C.brand.primary} />
              <Text style={[s.draftBannerText, { color: C.text.secondary }]}>
                Draft restored from your last session
              </Text>
              <Pressable onPress={handleDiscardDraft} hitSlop={8} accessibilityRole="button" accessibilityLabel="Discard draft">
                <Text style={[s.draftBannerAction, { color: C.brand.primary }]}>Discard</Text>
              </Pressable>
            </View>
          )}

          {dataLoading ? (
            <View style={s.loadingCenter}>
              <ActivityIndicator color={C.brand.primary} size="large" />
            </View>
          ) : step === 1 ? (
            <Step1
              C={C}
              title={title}
              titleError={titleError}
              duplicateTitleWarning={duplicateTitleWarning}
              onTitleChange={(t) => { setTitle(t); if (t.trim()) setTitleError(''); }}
              description={description}
              onDescriptionChange={setDescription}
              departmentName={departmentName}
              onDeptPress={() => setShowDeptPicker(true)}
              isCrossDept={currentUser?.role === 'ADMIN' && !!departmentId && departmentId !== currentUser?.departmentId}
              assignees={assignees}
              assigneeError={assigneeError}
              onAddAssigneePress={() => setShowAssigneePicker(true)}
              onRemoveAssignee={removeAssignee}
              priority={priority}
              onPriorityChange={setPriority}
            />
          ) : (
            <Step2
              C={C}
              formattedDate={formattedDueDate}
              formattedTime={formattedDueTime}
              onDatePress={() => setShowDatePicker(true)}
              onTimePress={() => setShowTimePicker(true)}
              categories={categories}
              categoryIds={categoryIds}
              onToggleCategory={(id) =>
                setCategoryIds((prev) =>
                  prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
                )
              }
              attachments={attachments}
              onPickFile={handlePickFile}
              onRemoveAttachment={(uri) =>
                setAttachments((prev) => prev.filter((a) => a.uri !== uri))
              }
              isRecurring={isRecurring}
              onToggleRecurring={() => setIsRecurring((v) => !v)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer CTA ── */}
      <View
        style={[
          s.footer,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: C.surface.card,
            borderTopColor: C.surface.border,
          },
        ]}
      >
        {step === 1 ? (
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [s.ctaBtn, { backgroundColor: pressed ? C.brand.primaryDark : C.brand.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Continue to step 2"
          >
            <Text style={s.ctaBtnLabel}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              s.ctaBtn,
              { backgroundColor: pressed ? C.brand.primaryDark : C.brand.primary },
              submitting && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create and assign task"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={s.ctaBtnLabel}>Create &amp; Assign</Text>
                <Feather name="check" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* ── Modals ── */}
      <DepartmentPickerModal
        visible={showDeptPicker}
        departments={departments}
        selectedId={departmentId}
        onSelect={(id) => { setDepartmentId(id); setShowDeptPicker(false); }}
        onClose={() => setShowDeptPicker(false)}
        C={C}
      />

      <AssigneePickerModal
        visible={showAssigneePicker}
        users={deptUsers}
        selectedIds={assignees.map((a) => a.id)}
        onSelect={(user) => { addAssignee(user); setShowAssigneePicker(false); }}
        onClose={() => setShowAssigneePicker(false)}
        C={C}
      />

      <DatePickerModal
        visible={showDatePicker}
        selected={pickedDate}
        onConfirm={(d) => { setPickedDate(d); setShowDatePicker(false); }}
        onClose={() => setShowDatePicker(false)}
        C={C}
      />

      <TimePickerModal
        visible={showTimePicker}
        hour={dueHour}
        minute={dueMinute}
        isAfternoon={isAfternoon}
        onConfirm={(h, m, pm) => {
          setDueHour(h); setDueMinute(m); setIsAfternoon(pm);
          setShowTimePicker(false);
        }}
        onClose={() => setShowTimePicker(false)}
        colors={C}
      />
    </View>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

type ColorsShape = ReturnType<typeof useColors>;

type Step1Props = {
  C: ColorsShape;
  title: string;
  titleError: string;
  duplicateTitleWarning: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  departmentName: string;
  onDeptPress: () => void;
  isCrossDept: boolean;
  assignees: User[];
  assigneeError: string;
  onAddAssigneePress: () => void;
  onRemoveAssignee: (id: string) => void;
  priority: TaskPriority;
  onPriorityChange: (p: TaskPriority) => void;
};

function Step1({
  C, title, titleError, duplicateTitleWarning, onTitleChange,
  description, onDescriptionChange,
  departmentName, onDeptPress, isCrossDept,
  assignees, assigneeError, onAddAssigneePress, onRemoveAssignee,
  priority, onPriorityChange,
}: Step1Props) {
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  return (
    <View style={s.stepContent}>
      {/* Task title */}
      <FieldLabel label="Task title" />
      <View
        style={[
          s.inputBox,
          { borderColor: titleFocused ? C.brand.primary : titleError ? '#EF4444' : C.surface.border },
          titleFocused && s.inputFocused,
          { backgroundColor: C.surface.card },
        ]}
      >
        <TextInput
          style={[s.inputText, { color: C.text.primary }]}
          placeholder="Enter task title…"
          placeholderTextColor={C.text.tertiary}
          value={title}
          onChangeText={onTitleChange}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          maxLength={200}
          returnKeyType="next"
          accessibilityLabel="Task title"
        />
        {title.length > 150 && (
          <Text style={[s.charCount, { color: title.length >= 200 ? '#EF4444' : C.text.tertiary }]}>
            {title.length}/200
          </Text>
        )}
      </View>
      {!!titleError && <FieldError msg={titleError} />}
      {!titleError && !!duplicateTitleWarning && <FieldError msg={duplicateTitleWarning} warning />}

      {/* Description */}
      <FieldLabel label="Description" topSpacing />
      <View
        style={[
          s.textareaBox,
          { borderColor: descFocused ? C.brand.primary : C.surface.border, backgroundColor: C.surface.card },
          descFocused && s.inputFocused,
        ]}
      >
        <TextInput
          style={[s.textareaText, { color: C.text.primary }]}
          placeholder="Add details, expectations, and any reference notes…"
          placeholderTextColor={C.text.tertiary}
          value={description}
          onChangeText={onDescriptionChange}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          multiline
          maxLength={5000}
          textAlignVertical="top"
          accessibilityLabel="Task description"
        />
      </View>

      {/* Department */}
      <FieldLabel label="Department" topSpacing />
      <Pressable
        onPress={onDeptPress}
        style={({ pressed }) => [
          s.selectBox,
          { borderColor: C.surface.border, backgroundColor: pressed ? C.brand.primaryLight : C.surface.card },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Department: ${departmentName}`}
      >
        <Text style={[s.selectText, { color: C.text.primary }]}>{departmentName}</Text>
        <Feather name="chevron-down" size={18} color={C.text.tertiary} />
      </Pressable>
      {isCrossDept && (
        <View style={[s.crossDeptChip, { backgroundColor: C.brand.primaryLight }]}>
          <Feather name="info" size={13} color={C.brand.primary} />
          <Text style={[s.crossDeptChipText, { color: C.brand.primaryDark }]}>
            This task will be assigned outside your department
          </Text>
        </View>
      )}

      {/* Assign to */}
      <FieldLabel label="Assign to" topSpacing />
      <View style={s.assigneeRow}>
        {assignees.map((user) => (
          <AssigneeChip
            key={user.id}
            user={user}
            onRemove={() => onRemoveAssignee(user.id)}
            C={C}
          />
        ))}
        <Pressable
          onPress={onAddAssigneePress}
          style={s.addPeopleBtn}
          accessibilityRole="button"
          accessibilityLabel="Add assignee"
        >
          <Feather name="plus" size={15} color={C.text.secondary} />
          <Text style={[s.addPeopleText, { color: C.text.secondary }]}>Add people</Text>
        </Pressable>
      </View>
      {assignees.length > 0 && (
        <View style={s.multiAssigneeNote}>
          <Feather name="info" size={13} color={C.text.tertiary} />
          <Text style={[s.multiAssigneeText, { color: C.text.tertiary }]}>
            Adding 2+ people creates separate task copies — each tracked individually.
          </Text>
        </View>
      )}
      {!!assigneeError && <FieldError msg={assigneeError} />}

      {/* Priority */}
      <FieldLabel label="Priority" topSpacing />
      <View style={s.priorityRow}>
        {PRIORITIES.map((p) => {
          const selected = priority === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => { void Haptics.selectionAsync(); onPriorityChange(p.value); }}
              style={[
                s.priorityTile,
                {
                  backgroundColor: selected ? p.selectedBg : C.surface.card,
                  borderColor: selected ? p.selectedBorder : C.surface.border,
                  borderWidth: selected ? 1.5 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Priority ${p.label}`}
            >
              <View style={[s.priorityDot, { backgroundColor: p.dotColor }]} />
              <Text
                style={[
                  s.priorityLabel,
                  { color: selected ? p.selectedTextColor : C.text.secondary },
                  selected && { fontFamily: 'Inter-Bold' },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────

type Step2Props = {
  C: ColorsShape;
  formattedDate: string;
  formattedTime: string;
  onDatePress: () => void;
  onTimePress: () => void;
  categories: TaskCategory[];
  categoryIds: string[];
  onToggleCategory: (id: string) => void;
  attachments: PickedFile[];
  onPickFile: () => void;
  onRemoveAttachment: (uri: string) => void;
  isRecurring: boolean;
  onToggleRecurring: () => void;
};

function Step2({
  C, formattedDate, formattedTime,
  onDatePress, onTimePress,
  categories, categoryIds, onToggleCategory,
  attachments, onPickFile, onRemoveAttachment,
  isRecurring, onToggleRecurring,
}: Step2Props) {
  return (
    <View style={s.stepContent}>
      {/* Due date & time */}
      <FieldLabel label="Due date & time" />
      <View style={s.dateTimeRow}>
        <Pressable
          onPress={onDatePress}
          style={({ pressed }) => [
            s.dateBox,
            { borderColor: C.surface.border, backgroundColor: pressed ? C.brand.primaryLight : C.surface.card },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Due date: ${formattedDate}`}
        >
          <Feather name="calendar" size={17} color={C.text.secondary} />
          <Text style={[s.dateText, { color: C.text.primary }]}>{formattedDate}</Text>
        </Pressable>
        <Pressable
          onPress={onTimePress}
          style={({ pressed }) => [
            s.timeBox,
            { borderColor: C.surface.border, backgroundColor: pressed ? C.brand.primaryLight : C.surface.card },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Due time: ${formattedTime}`}
        >
          <Feather name="clock" size={17} color={C.text.secondary} />
          <Text style={[s.dateText, { color: C.text.primary }]}>{formattedTime}</Text>
        </Pressable>
      </View>

      {/* Category */}
      {categories.length > 0 && (
        <>
          <FieldLabel label="Category" topSpacing />
          <View style={s.categoryRow}>
            {categories.map((cat) => {
              const selected = categoryIds.includes(cat.id);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => { void Haptics.selectionAsync(); onToggleCategory(cat.id); }}
                  style={[
                    s.categoryChip,
                    {
                      backgroundColor: selected ? C.brand.secondary : C.surface.card,
                      borderColor: selected ? C.brand.secondary : C.surface.border,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={cat.label}
                >
                  <Text
                    style={[
                      s.categoryLabel,
                      { color: selected ? '#fff' : C.text.secondary },
                      selected && { fontFamily: 'Inter-SemiBold' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {/* Reference attachments */}
      <FieldLabel label="Reference attachments" topSpacing />
      {attachments.length > 0 && (
        <View style={s.attachList}>
          {attachments.map((file) => (
            <AttachmentRow
              key={file.uri}
              file={file}
              onRemove={() => onRemoveAttachment(file.uri)}
              C={C}
            />
          ))}
        </View>
      )}
      {attachments.length < 5 && (
        <Pressable
          onPress={onPickFile}
          style={({ pressed }) => [
            s.uploadZone,
            {
              borderColor: C.surface.borderStrong,
              backgroundColor: pressed ? C.brand.primaryLight : C.surface.card,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add reference files"
        >
          <View style={[s.uploadIconCircle, { backgroundColor: C.brand.primaryLight }]}>
            <Feather name="upload" size={20} color={C.brand.primary} />
          </View>
          <Text style={[s.uploadTitle, { color: C.text.primary }]}>
            Drag files here or browse
          </Text>
          <Text style={[s.uploadSub, { color: C.text.tertiary }]}>
            PDF, JPG, PNG · Max 10 MB per file · Up to {5 - attachments.length} more
          </Text>
          <View style={[s.browseBtn, { backgroundColor: C.brand.primaryLight }]}>
            <Text style={[s.browseBtnText, { color: C.brand.primary }]}>Browse files</Text>
          </View>
        </Pressable>
      )}

      {/* Recurring toggle */}
      <View style={[s.recurringRow, { borderTopColor: C.surface.border }]}>
        <View style={s.recurringLeft}>
          <Feather name="repeat" size={17} color={C.text.secondary} />
          <View>
            <Text style={[s.recurringTitle, { color: C.text.primary }]}>Recurring task</Text>
            <Text style={[s.recurringSub, { color: C.text.tertiary }]}>
              Configure schedule after creation
            </Text>
          </View>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={onToggleRecurring}
          trackColor={{ false: C.surface.border, true: C.brand.primary }}
          thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
          accessibilityRole="switch"
          accessibilityState={{ checked: isRecurring }}
          accessibilityLabel="Recurring task"
        />
      </View>
    </View>
  );
}

// ─── Assignee chip ────────────────────────────────────────────────────────────

function AssigneeChip({ user, onRemove, C }: { user: User; onRemove: () => void; C: ColorsShape }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  const firstName = user.name.split(' ')[0];

  return (
    <View style={s.assigneeChip}>
      <View style={s.chipAvatar}>
        <Text style={s.chipInitials}>{initials}</Text>
      </View>
      <Text style={s.chipName}>{firstName}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={s.chipRemove}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${user.name}`}
      >
        <Feather name="x" size={11} color="#1D4ED8" />
      </Pressable>
    </View>
  );
}

// ─── Attachment row ───────────────────────────────────────────────────────────

function AttachmentRow({ file, onRemove, C }: { file: PickedFile; onRemove: () => void; C: ColorsShape }) {
  const isPdf = file.mimeType === 'application/pdf';
  return (
    <View style={[s.attachRow, { backgroundColor: C.surface.card, borderColor: C.surface.border }]}>
      <View style={[s.attachIconBox, { backgroundColor: isPdf ? '#FEF2F2' : '#EFF6FF' }]}>
        <Feather name={isPdf ? 'file-text' : 'image'} size={16} color={isPdf ? '#EF4444' : C.brand.primary} />
      </View>
      <View style={s.attachMeta}>
        <Text style={[s.attachName, { color: C.text.primary }]} numberOfLines={1}>{file.name}</Text>
        <Text style={[s.attachSize, { color: C.text.tertiary }]}>{formatBytes(file.size)}</Text>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${file.name}`}
      >
        <Feather name="x" size={16} color={C.text.tertiary} />
      </Pressable>
    </View>
  );
}

// ─── Field label / error ──────────────────────────────────────────────────────

function FieldLabel({ label, topSpacing }: { label: string; topSpacing?: boolean }) {
  const C = useColors();
  return (
    <Text style={[s.fieldLabel, { color: C.text.secondary, marginTop: topSpacing ? 18 : 0 }]}>
      {label}
    </Text>
  );
}

function FieldError({ msg, warning }: { msg: string; warning?: boolean }) {
  const color = warning ? '#B45309' : '#EF4444';
  return (
    <View style={s.errorRow}>
      <Feather name="alert-circle" size={12} color={color} />
      <Text style={[s.errorText, { color }]}>{msg}</Text>
    </View>
  );
}

// ─── Department picker modal ───────────────────────────────────────────────────

type DeptPickerProps = {
  visible: boolean;
  departments: Department[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  C: ColorsShape;
};

function DepartmentPickerModal({ visible, departments, selectedId, onSelect, onClose, C }: DeptPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[s.modalSheet, { backgroundColor: C.surface.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.modalHandle, { backgroundColor: C.surface.border }]} />
          <Text style={[s.modalTitle, { color: C.text.primary }]}>Select Department</Text>
          {departments.map((dept) => {
            const selected = dept.id === selectedId;
            return (
              <Pressable
                key={dept.id}
                onPress={() => onSelect(dept.id)}
                style={({ pressed }) => [
                  s.modalRow,
                  { backgroundColor: pressed ? C.brand.primaryLight : 'transparent' },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[s.modalRowText, { color: selected ? C.brand.primary : C.text.primary }]}>
                  {dept.name}
                </Text>
                {selected && <Feather name="check" size={18} color={C.brand.primary} />}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Assignee picker modal ────────────────────────────────────────────────────

type AssigneePickerProps = {
  visible: boolean;
  users: User[];
  selectedIds: string[];
  onSelect: (user: User) => void;
  onClose: () => void;
  C: ColorsShape;
};

function AssigneePickerModal({ visible, users, selectedIds, onSelect, onClose, C }: AssigneePickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.designation ?? '').toLowerCase().includes(q),
    );
  }, [search, users]);

  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[s.modalSheet, s.modalSheetTall, { backgroundColor: C.surface.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.modalHandle, { backgroundColor: C.surface.border }]} />
          <Text style={[s.modalTitle, { color: C.text.primary }]}>Select Assignee</Text>

          {/* Search */}
          <View style={[s.searchBox, { borderColor: C.surface.border, backgroundColor: C.surface.background }]}>
            <Feather name="search" size={16} color={C.text.tertiary} />
            <TextInput
              style={[s.searchInput, { color: C.text.primary }]}
              placeholder="Search by name or role…"
              placeholderTextColor={C.text.tertiary}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {!!search && (
              <Pressable onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={16} color={C.text.tertiary} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(u) => u.id}
            style={s.assigneeList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: C.surface.border, marginHorizontal: 20 }} />
            )}
            ListEmptyComponent={() => (
              <Text style={[s.emptyText, { color: C.text.tertiary }]}>No users found</Text>
            )}
            renderItem={({ item }) => {
              const alreadyAdded = selectedIds.includes(item.id);
              const initials = item.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w.charAt(0).toUpperCase())
                .join('');
              return (
                <Pressable
                  onPress={() => !alreadyAdded && onSelect(item)}
                  style={({ pressed }) => [
                    s.userRow,
                    { backgroundColor: pressed && !alreadyAdded ? C.brand.primaryLight : 'transparent' },
                    alreadyAdded && { opacity: 0.45 },
                  ]}
                  disabled={alreadyAdded}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: alreadyAdded }}
                  accessibilityLabel={`Select ${item.name}`}
                >
                  <View style={[s.userAvatar, { backgroundColor: C.brand.primaryLight }]}>
                    <Text style={[s.userAvatarText, { color: C.brand.primary }]}>{initials}</Text>
                  </View>
                  <View style={s.userMeta}>
                    <Text style={[s.userName, { color: C.text.primary }]}>{item.name}</Text>
                    <Text style={[s.userRole, { color: C.text.tertiary }]}>{item.designation}</Text>
                  </View>
                  {alreadyAdded && (
                    <View style={[s.addedBadge, { backgroundColor: C.brand.primaryLight }]}>
                      <Text style={[s.addedBadgeText, { color: C.brand.primary }]}>Added</Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Date picker modal ─────────────────────────────────────────────────────────

type DatePickerProps = {
  visible: boolean;
  selected: dayjs.Dayjs;
  onConfirm: (d: dayjs.Dayjs) => void;
  onClose: () => void;
  C: ColorsShape;
};

function DatePickerModal({ visible, selected, onConfirm, onClose, C }: DatePickerProps) {
  const [viewing, setViewing] = useState(() =>
    selected.isAfter(dayjs()) ? selected : dayjs().add(1, 'day'),
  );
  const [draft, setDraft] = useState(viewing);
  const today = dayjs().startOf('day');

  useEffect(() => {
    if (visible) {
      const init = selected.isAfter(dayjs()) ? selected : dayjs().add(1, 'day');
      setViewing(init);
      setDraft(init);
    }
  }, [visible, selected]);

  const prevMonth = () => setViewing((v) => v.subtract(1, 'month'));
  const nextMonth = () => setViewing((v) => v.add(1, 'month'));

  const grid = buildCalendarGrid(viewing.year(), viewing.month());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[s.modalSheet, { backgroundColor: C.surface.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[s.modalHandle, { backgroundColor: C.surface.border }]} />
          <Text style={[s.modalTitle, { color: C.text.primary }]}>Select Due Date</Text>

          {/* Month navigation */}
          <View style={s.calNav}>
            <Pressable
              onPress={prevMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[s.calNavBtn, { borderColor: C.surface.border }]}
            >
              <Feather name="chevron-left" size={18} color={C.text.primary} />
            </Pressable>
            <Text style={[s.calNavTitle, { color: C.text.primary }]}>
              {MONTH_NAMES[viewing.month()]} {viewing.year()}
            </Text>
            <Pressable
              onPress={nextMonth}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[s.calNavBtn, { borderColor: C.surface.border }]}
            >
              <Feather name="chevron-right" size={18} color={C.text.primary} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={s.calWeekRow}>
            {WEEKDAY_LABELS.map((d) => (
              <Text key={d} style={[s.calWeekLabel, { color: C.text.tertiary }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          {grid.map((row, ri) => (
            <View key={ri} style={s.calRow}>
              {row.map((day, ci) => {
                if (day === null) return <View key={ci} style={s.calCell} />;
                const cellDate = dayjs(new Date(viewing.year(), viewing.month(), day));
                const isPast = cellDate.isBefore(today);
                const isToday = cellDate.isSame(today, 'day');
                const isSelected = cellDate.isSame(draft, 'day');
                return (
                  <Pressable
                    key={ci}
                    style={[
                      s.calCell,
                      isSelected && [s.calCellSelected, { backgroundColor: C.brand.primary }],
                      isToday && !isSelected && [s.calCellToday, { borderColor: C.brand.primary }],
                    ]}
                    onPress={() => !isPast && setDraft(cellDate)}
                    disabled={isPast}
                    accessibilityRole="button"
                    accessibilityLabel={cellDate.format('MMMM D YYYY')}
                    accessibilityState={{ selected: isSelected, disabled: isPast }}
                  >
                    <Text
                      style={[
                        s.calCellText,
                        { color: isPast ? C.text.disabled : isSelected ? '#fff' : isToday ? C.brand.primary : C.text.primary },
                        isSelected && { fontFamily: 'Inter-Bold' },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable
            onPress={() => onConfirm(draft)}
            style={[s.modalConfirmBtn, { backgroundColor: C.brand.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Confirm date"
          >
            <Text style={s.modalConfirmText}>Confirm — {draft.format('MMM D, YYYY')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Time picker modal ────────────────────────────────────────────────────────

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  headerRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  headerTitle: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  stepLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    minWidth: 72,
    textAlign: 'right',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },

  // Body
  scroll: { padding: 20 },
  stepContent: { gap: 0 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  draftBannerText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter-Medium' },
  draftBannerAction: { fontSize: 12.5, fontFamily: 'Inter-SemiBold' },

  // Footer
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  ctaBtn: {
    height: 50,
    borderRadius: Layout.buttonRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  ctaBtnLabel: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },

  // Field label / error
  fieldLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
  },

  // Text input
  inputBox: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: Layout.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  inputFocused: {
    ...Platform.select({
      ios: {
        shadowColor: '#1A5CF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
    }),
  },
  inputText: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
  },
  charCount: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
  },

  // Textarea
  textareaBox: {
    minHeight: 84,
    borderWidth: 1.5,
    borderRadius: Layout.inputRadius,
    padding: 12,
  },
  textareaText: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    minHeight: 60,
  },

  // Select (dropdown trigger)
  selectBox: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: Layout.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  selectText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
  },
  crossDeptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  crossDeptChipText: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Medium',
    flexShrink: 1,
  },

  // Assignee row
  assigneeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 38,
    paddingLeft: 6,
    paddingRight: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 19,
  },
  chipAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#1A5CF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInitials: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    fontSize: 10,
  },
  chipName: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Medium',
    color: '#1D4ED8',
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 1,
  },
  addPeopleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 19,
    backgroundColor: '#fff',
  },
  addPeopleText: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Medium',
  },
  multiAssigneeNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 10,
  },
  multiAssigneeText: {
    ...Typography.captionSm,
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 16,
  },

  // Priority
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityTile: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  priorityLabel: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
  },

  // Due date / time row
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBox: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderRadius: Layout.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  timeBox: {
    width: 126,
    height: 50,
    borderWidth: 1.5,
    borderRadius: Layout.inputRadius,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  dateText: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Regular',
  },

  // Category chips
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    height: 34,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    ...Typography.labelMd,
    fontFamily: 'Inter-Medium',
  },

  // Upload zone
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 0,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
  },
  uploadSub: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  browseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 4,
  },
  browseBtnText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
  },

  // Attachment list
  attachList: { gap: 8, marginBottom: 10 },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  attachIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachMeta: { flex: 1 },
  attachName: {
    ...Typography.bodySm,
    fontFamily: 'Inter-Medium',
  },
  attachSize: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },

  // Recurring row
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    marginTop: 18,
    borderTopWidth: 1,
    gap: 12,
  },
  recurringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recurringTitle: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
  },
  recurringSub: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },

  // Modal shared
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  modalSheetTall: {
    maxHeight: '70%',
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  modalTitle: {
    ...Typography.h4,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  modalRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  modalRowText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
  },
  modalConfirmBtn: {
    height: 50,
    borderRadius: Layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginHorizontal: 0,
  },
  modalConfirmText: {
    ...Typography.labelLg,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },

  // Search box (assignee picker)
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
  },
  assigneeList: {
    maxHeight: 300,
  },
  emptyText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    ...Typography.labelMd,
    fontFamily: 'Inter-SemiBold',
  },
  userMeta: { flex: 1 },
  userName: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
  },
  userRole: {
    ...Typography.caption,
    fontFamily: 'Inter-Regular',
    marginTop: 1,
  },
  addedBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  addedBadgeText: {
    ...Typography.caption,
    fontFamily: 'Inter-SemiBold',
  },

  // Calendar
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavTitle: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-SemiBold',
  },
  calWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calWeekLabel: {
    flex: 1,
    textAlign: 'center',
    ...Typography.caption,
    fontFamily: 'Inter-Medium',
  },
  calRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  calCell: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  calCellSelected: {
    borderRadius: 19,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderRadius: 19,
  },
  calCellText: {
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
  },

  // Time picker
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  timeSep: {
    ...Typography.h2,
    fontFamily: 'Inter-Bold',
    marginTop: 18,
    paddingHorizontal: 2,
  },
  drumCol: {
    alignItems: 'center',
    gap: 8,
    minWidth: 72,
  },
  drumLabel: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  drumValueBox: {
    width: 72,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumValue: {
    ...Typography.h2,
    fontFamily: 'Inter-Bold',
  },
  ampmCol: {
    alignItems: 'center',
    gap: 8,
    marginTop: 0,
    marginLeft: 6,
  },
  ampmToggle: {
    width: 62,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    ...Typography.h4,
    fontFamily: 'Inter-Bold',
  },
});
