/**
 * AssignGovernanceTaskScreen — "Assign to admin" compose (HTML screen 61).
 * The Super Admin assigns a governance/administrative task directly to a
 * department admin. Distinct from the full Admin+ CreateTaskScreen
 * (app/(app)/tasks/create.tsx) — fewer fields (no department/category/
 * attachments/recurring), single admin-only assignee, and two
 * governance-specific toggles (proof required / SA approval required) that
 * don't exist on the regular task-creation flow, so it isn't reused as-is.
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
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';

import type { TaskPriority } from '@godigitify/types';
import type { OrgUser } from '../data/orgDirectory.mock';
import { GOVERNANCE_PRIORITY_OPTIONS } from '../data/superAdminTasks.mock';
import { useAssignableAdmins, useCreateGovernanceTask } from '../hooks/useSuperAdminTasks';
import { useColors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

const DUE_DATE_PRESETS = [
  { label: 'In 3 days', days: 3 },
  { label: 'In 1 week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
  { label: 'In 1 month', days: 30 },
];

export function AssignGovernanceTaskScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const adminsQuery = useAssignableAdmins();
  const createMutation = useCreateGovernanceTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState<OrgUser | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState(() => dayjs().add(7, 'day').toISOString());
  const [requireProof, setRequireProof] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [adminSheetVisible, setAdminSheetVisible] = useState(false);
  const [dateSheetVisible, setDateSheetVisible] = useState(false);

  const admins = adminsQuery.data ?? [];
  const canSubmit = title.trim().length > 0 && !!assignee && !createMutation.isPending;

  const handleSubmit = useCallback(async () => {
    if (!assignee) return;
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        assigneeId: assignee.id,
        priority,
        dueDate,
        requireProof,
        requireApproval,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not assign this task. Please try again.');
    }
  }, [assignee, createMutation, title, description, priority, dueDate, requireProof, requireApproval, router]);

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

        <View style={[s.toggleCard, { backgroundColor: colors.surface.card }]}>
          <ToggleRow
            icon="upload"
            label="Require proof on submit"
            value={requireProof}
            onChange={setRequireProof}
            withBorder
          />
          <ToggleRow icon="check-circle" label="Require my approval" value={requireApproval} onChange={setRequireApproval} />
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

      <Modal visible={dateSheetVisible} transparent animationType="slide" onRequestClose={() => setDateSheetVisible(false)}>
        <Pressable style={[s.backdrop, { backgroundColor: colors.surface.overlay }]} onPress={() => setDateSheetVisible(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface.card, paddingBottom: insets.bottom + Spacing[4] }]}>
            <View style={[s.handle, { backgroundColor: colors.surface.borderStrong }]} />
            <Text style={[s.sheetTitle, { color: colors.text.primary }]}>Due date</Text>
            {DUE_DATE_PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                onPress={() => {
                  setDueDate(dayjs().add(preset.days, 'day').toISOString());
                  setDateSheetVisible(false);
                }}
                style={({ pressed }) => [s.adminRow, pressed && s.pressed]}
                accessibilityRole="button"
              >
                <Text style={[s.assigneeName, { color: colors.text.primary, flex: 1 }]}>{preset.label}</Text>
                <Text style={[s.assigneeDept, { color: colors.text.tertiary }]}>
                  {dayjs().add(preset.days, 'day').format('MMM D')}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type ToggleRowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  withBorder?: boolean;
};

function ToggleRow({ icon, label, value, onChange, withBorder }: ToggleRowProps) {
  const colors = useColors();
  return (
    <View style={[s.toggleRow, withBorder && { borderBottomWidth: 1, borderBottomColor: colors.surface.background }]}>
      <Feather name={icon} size={18} color={colors.text.secondary} />
      <Text style={[s.toggleLabel, { color: colors.text.primary }]}>{label}</Text>
      <Pressable
        onPress={() => onChange(!value)}
        style={[s.switchTrack, { backgroundColor: value ? colors.brand.secondary : colors.surface.borderStrong }]}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
      >
        <View style={[s.switchKnob, value && s.switchKnobActive]} />
      </Pressable>
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
  toggleCard: { borderRadius: 12, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  toggleLabel: { flex: 1, fontSize: 13.5, fontFamily: 'Inter-Regular' },
  switchTrack: { width: 42, height: 25, borderRadius: 13, padding: 2.5, justifyContent: 'center' },
  switchKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  switchKnobActive: { alignSelf: 'flex-end' },
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
