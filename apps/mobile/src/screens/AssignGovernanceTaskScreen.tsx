/**
 * AssignGovernanceTaskScreen — "Assign to admin" compose (HTML screen 61).
 * The Super Admin assigns a governance/administrative task directly to a
 * department admin. Distinct from the full Admin+ CreateTaskScreen
 * (app/(app)/tasks/create.tsx) — fewer fields (no category/recurring),
 * single admin-only assignee. Every governance task always requires proof
 * + SA approval on the backend (governance.service.ts), so the per-task
 * proof/approval toggles from the old mock UI have no backend equivalent
 * and were dropped.
 *
 * Attachments are staged locally and uploaded only after the task is
 * created (governance task creation has no attachments field — see
 * filesApi.presign/confirm), same two-step pattern as CreateTaskScreen's
 * uploadAttachmentsTo.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import dayjs from 'dayjs';
import { filesApi } from '@godigitify/api-client';

import type { TaskPriority } from '@godigitify/types';
import { useOrgAdmins, type OrgUser } from '../hooks/useOrgDirectory';
import { GOVERNANCE_PRIORITY_OPTIONS } from '../data/superAdminTasks.mock';
import { useCreateGovernanceTask } from '../hooks/useGovernance';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { DueDatePickerModal } from '../components/calendar/DueDatePickerModal';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type PickedFile = { uri: string; name: string; size: number; mimeType: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssignGovernanceTaskScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const adminsQuery = useOrgAdmins();
  const createMutation = useCreateGovernanceTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<OrgUser | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState(() => dayjs().add(7, 'day').toISOString());
  const [adminSheetVisible, setAdminSheetVisible] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);
  const [attachments, setAttachments] = useState<PickedFile[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const admins = adminsQuery.data ?? [];
  const assigneeDepartmentId = assignee?.departments[0]?.id;
  const canSubmit = title.trim().length > 0 && !!assignee && !!assigneeDepartmentId && !createMutation.isPending;

  const handlePickFile = useCallback(async () => {
    setAttachmentError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'application/pdf'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const room = MAX_ATTACHMENTS - attachments.length;
    const picked = result.assets.slice(0, room);
    const oversized = picked.some((f) => (f.size ?? 0) > MAX_FILE_SIZE);
    if (oversized) {
      setAttachmentError('Each file must be under 10MB');
    }
    const accepted = picked.filter((f) => (f.size ?? 0) <= MAX_FILE_SIZE);
    setAttachments((prev) => [
      ...prev,
      ...accepted.map((f) => ({
        uri: f.uri,
        name: f.name,
        size: f.size ?? 0,
        mimeType: f.mimeType ?? 'application/octet-stream',
      })),
    ]);
  }, [attachments.length]);

  const handleRemoveAttachment = useCallback((uri: string) => {
    setAttachments((prev) => prev.filter((f) => f.uri !== uri));
  }, []);

  const uploadAttachmentsTo = useCallback(async (taskId: string) => {
    for (const file of attachments) {
      try {
        const presign = await filesApi.presign({
          taskId,
          fileName: file.name,
          mimeType: file.mimeType,
          isProof: false,
        });
        await fetch(presign.data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.mimeType },
          body: await (await fetch(file.uri)).blob(),
        });
        await filesApi.confirm({
          taskId,
          storageKey: presign.data.storageKey,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          isProof: false,
        });
      } catch {
        // Task creation already succeeded — an attachment failure here is
        // surfaced nowhere blocking; the SA can re-attach from the task detail screen.
      }
    }
  }, [attachments]);

  const handleSubmit = useCallback(async () => {
    if (!assignee || !assigneeDepartmentId) return;
    try {
      const res = await createMutation.mutateAsync({
        title: title.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        assigneeId: assignee.id,
        departmentId: assigneeDepartmentId,
        priority,
        dueDate,
      });
      if (attachments.length > 0) {
        await uploadAttachmentsTo(res.data.id);
      }
      router.back();
    } catch {
      // Error toast already shown by useCreateGovernanceTask (useApiMutation).
    }
  }, [assignee, assigneeDepartmentId, createMutation, title, description, priority, dueDate, attachments, uploadAttachmentsTo, router]);

  const dueDateLabel = useMemo(() => dayjs(dueDate).format('MMM D, YYYY'), [dueDate]);

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6, backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Assign to admin</Text>
        <Text style={[s.draftText, { color: colors.text.tertiary }]}>Draft</Text>
      </View>

      <ScrollView style={s.body} contentContainerStyle={s.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={[s.noteCard]}>
          <Feather name="shield" size={16} color={colors.brand.secondary} style={s.noteIcon} />
          <Text style={[s.noteText, { color: colors.brand.secondary }]}>
            A governance task assigned to a department admin. It appears in their <Text style={s.bold}>Assigned to me</Text> and in your{' '}
            <Text style={s.bold}>Assigned by me</Text> tracker.
          </Text>
        </View>

        <View style={[s.fieldCard, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.fieldLabel, { color: colors.text.tertiary }]}>TASK TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Submit Q2 department budget"
            placeholderTextColor={colors.text.tertiary}
            style={[s.fieldValue, { color: colors.text.primary }]}
            maxLength={200}
            accessibilityLabel="Task title"
          />
        </View>

        <Pressable
          onPress={() => setAdminSheetVisible(true)}
          style={[s.fieldCard, { backgroundColor: colors.surface.card }]}
          accessibilityRole="button"
          accessibilityLabel="Assign to admin"
        >
          <View style={s.fieldHeaderRow}>
            <Text style={[s.fieldLabel, { color: colors.text.tertiary }]}>ASSIGN TO · ADMIN</Text>
            <Text style={[s.changeText, { color: colors.brand.primary }]}>{assignee ? 'Change' : 'Select'}</Text>
          </View>
          {assignee ? (
            <View style={s.assigneeRow}>
              <View style={[s.assigneeAvatar, { backgroundColor: colors.brand.secondary }]}>
                <Text style={s.assigneeAvatarText}>{assignee.initials}</Text>
              </View>
              <View style={s.assigneeInfo}>
                <Text style={[s.assigneeName, { color: colors.text.primary }]}>{assignee.name}</Text>
                <Text style={[s.assigneeDept, { color: colors.text.tertiary }]} numberOfLines={1}>
                  Department Admin · {assignee.departments.map((d) => d.name).join(', ')}
                </Text>
              </View>
              <View style={s.adminChip}>
                <Feather name="shield" size={10} color={colors.brand.secondary} />
                <Text style={[s.adminChipText, { color: colors.brand.secondary }]}>Admin</Text>
              </View>
            </View>
          ) : (
            <Text style={[s.placeholderText, { color: colors.text.tertiary }]}>Select a department admin</Text>
          )}
        </Pressable>

        <View style={s.rowGap}>
          <View style={[s.fieldCard, s.flex1, { backgroundColor: colors.surface.card }]}>
            <Text style={[s.fieldLabel, { color: colors.text.tertiary }]}>PRIORITY</Text>
            <View style={[s.priorityTrack, { backgroundColor: colors.surface.background }]}>
              {GOVERNANCE_PRIORITY_OPTIONS.map((opt) => {
                const active = opt.value === priority;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPriority(opt.value)}
                    style={[s.priorityPill, active && { backgroundColor: colors.semantic.error }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[s.priorityText, { color: active ? '#FFFFFF' : colors.text.secondary }, active && s.priorityTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => setDateSheetVisible(true)}
            style={[s.fieldCard, s.flex1, { backgroundColor: colors.surface.card }]}
            accessibilityRole="button"
            accessibilityLabel="Due date"
          >
            <Text style={[s.fieldLabel, { color: colors.text.tertiary }]}>DUE DATE</Text>
            <View style={s.dueDateRow}>
              <Feather name="calendar" size={16} color={colors.text.secondary} />
              <Text style={[s.dueDateText, { color: colors.text.primary }]}>{dueDateLabel}</Text>
            </View>
          </Pressable>
        </View>

        <View style={[s.fieldCard, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.fieldLabel, { color: colors.text.tertiary }]}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add context for the admin…"
            placeholderTextColor={colors.text.tertiary}
            style={[s.descriptionInput, { color: colors.text.secondary }]}
            multiline
            maxLength={2000}
            accessibilityLabel="Description"
          />
        </View>

        <View style={[s.fieldCard, { backgroundColor: colors.surface.card }]}>
          <Text style={[s.fieldLabel, { color: colors.text.tertiary }]}>ATTACHMENTS</Text>
          {attachments.map((file) => (
            <View key={file.uri} style={s.attachmentRow}>
              <View style={[s.attachmentIcon, { backgroundColor: colors.surface.background }]}>
                <Feather
                  name={file.mimeType.startsWith('image/') ? 'image' : 'file-text'}
                  size={16}
                  color={colors.text.secondary}
                />
              </View>
              <View style={s.attachmentInfo}>
                <Text style={[s.attachmentName, { color: colors.text.primary }]} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={[s.attachmentMeta, { color: colors.text.tertiary }]}>{formatBytes(file.size)}</Text>
              </View>
              <Pressable
                onPress={() => handleRemoveAttachment(file.uri)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${file.name}`}
              >
                <Feather name="x" size={16} color={colors.text.tertiary} />
              </Pressable>
            </View>
          ))}
          {attachments.length < MAX_ATTACHMENTS && (
            <Pressable
              onPress={handlePickFile}
              style={[s.attachmentDropzone, { borderColor: colors.surface.border }]}
              accessibilityRole="button"
              accessibilityLabel="Add attachment"
            >
              <Feather name="upload" size={16} color={colors.text.secondary} />
              <Text style={[s.attachmentDropzoneText, { color: colors.text.secondary }]}>
                Add attachment · PDF, JPG, PNG · Max 10MB
              </Text>
            </Pressable>
          )}
          {attachmentError && (
            <Text style={[s.attachmentError, { color: colors.semantic.error }]}>{attachmentError}</Text>
          )}
        </View>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.surface.card, borderTopColor: colors.surface.border, paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            s.submitBtn,
            { backgroundColor: colors.brand.secondary },
            !canSubmit && s.disabled,
            pressed && canSubmit && s.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Assign task"
        >
          <Feather name="send" size={17} color="#FFFFFF" />
          <Text style={s.submitText}>{createMutation.isPending ? 'Assigning…' : 'Assign task'}</Text>
        </Pressable>
      </View>

      <Modal visible={adminSheetVisible} transparent animationType="slide" onRequestClose={() => setAdminSheetVisible(false)}>
        <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={() => setAdminSheetVisible(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}>
            <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />
            <Text style={[s.sheetTitle, { color: colors.text.primary }]}>Select admin</Text>
            <FlatList
              data={admins}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setAssignee(item);
                    setAdminSheetVisible(false);
                  }}
                  style={({ pressed }) => [s.adminRow, pressed && s.pressed]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item.id === assignee?.id }}
                >
                  <View style={[s.assigneeAvatar, { backgroundColor: colors.brand.secondary }]}>
                    <Text style={s.assigneeAvatarText}>{item.initials}</Text>
                  </View>
                  <View style={s.assigneeInfo}>
                    <Text style={[s.assigneeName, { color: colors.text.primary }]}>{item.name}</Text>
                    <Text style={[s.assigneeDept, { color: colors.text.tertiary }]} numberOfLines={1}>
                      {item.departments.map((d) => d.name).join(', ')}
                    </Text>
                  </View>
                  {item.id === assignee?.id && <Feather name="check" size={18} color={colors.brand.primary} />}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <DueDatePickerModal
        visible={dateSheetVisible}
        selected={dayjs(dueDate)}
        onConfirm={(d) => {
          setDueDate(d.toISOString());
          setDateSheetVisible(false);
        }}
        onClose={() => setDateSheetVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold' },
  draftText: { fontSize: 13, fontFamily: 'Inter-SemiBold', paddingHorizontal: 4 },
  body: { flex: 1 },
  bodyContent: { padding: Spacing[4], gap: Spacing[3] },
  noteCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#EEF2FB',
    borderWidth: 1,
    borderColor: '#D8E2F8',
    borderRadius: 11,
    padding: 13,
  },
  noteIcon: { flexShrink: 0 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16, fontFamily: 'Inter-Regular' },
  bold: { fontFamily: 'Inter-SemiBold' },
  fieldCard: { borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  fieldLabel: { fontSize: 10.5, fontFamily: 'Inter-Bold', letterSpacing: 0.4, marginBottom: 8 },
  fieldValue: { fontSize: 15, fontFamily: 'Inter-Medium', padding: 0 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  changeText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  placeholderText: { fontSize: 13.5, fontFamily: 'Inter-Regular', marginTop: 2 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 8 },
  assigneeAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  assigneeAvatarText: { fontSize: 13, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  assigneeInfo: { flex: 1, minWidth: 0 },
  assigneeName: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  assigneeDept: { fontSize: 11.5, fontFamily: 'Inter-Regular', marginTop: 1 },
  adminChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FB', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11 },
  adminChipText: { fontSize: 10, fontFamily: 'Inter-Bold' },
  rowGap: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  priorityTrack: { flexDirection: 'row', borderRadius: 9, padding: 3 },
  priorityPill: { flex: 1, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 11, fontFamily: 'Inter-Medium' },
  priorityTextActive: { fontFamily: 'Inter-Bold' },
  dueDateRow: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 28 },
  dueDateText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  descriptionInput: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter-Regular', minHeight: 60, padding: 0, textAlignVertical: 'top' },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  attachmentIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  attachmentInfo: { flex: 1, minWidth: 0 },
  attachmentName: { fontSize: 13, fontFamily: 'Inter-Medium' },
  attachmentMeta: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  attachmentDropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 6,
  },
  attachmentDropzoneText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  attachmentError: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 6 },
  footer: { padding: Spacing[4], borderTopWidth: 1 },
  submitBtn: { height: 50, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitText: { fontSize: 14.5, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: Spacing[4], maxHeight: '70%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: Spacing[3], marginBottom: Spacing[3] },
  sheetTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: Spacing[2] },
  adminRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
