import React, { useState } from 'react';
import { View, Text, Pressable, SectionList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { AuditEvent } from '../data/audit.mock';
import { AUDIT_QUICK_CATEGORIES } from '../data/audit.mock';
import { useAuditActors, useAuditFilterState, useFilteredAuditEvents } from '../hooks/useAudit';
import { useColors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing } from '../constants/spacing';

import { TaskSearchBar } from '../components/task/TaskSearchBar';
import { AuditCategoryChips } from '../components/audit/AuditCategoryChips';
import { AuditEventRow } from '../components/audit/AuditEventRow';
import { AuditFilterSheet } from '../components/audit/AuditFilterSheet';
import { ListSkeleton } from '../components/dashboard/ListSkeleton';
import { EmptyState } from '../components/ui/EmptyState';

const SectionLabel = React.memo(({ title }: { title: string }) => {
  const colors = useColors();
  return <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>{title.toUpperCase()}</Text>;
});
SectionLabel.displayName = 'SectionLabel';

export function AuditLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { filters, setCategory, setSearch, applySheet, hasActiveFilters } = useAuditFilterState();
  const { groups, count, isLoading, refetch } = useFilteredAuditEvents(filters);
  const { data: actors = [] } = useAuditActors();

  const sections = groups.map((g) => ({ title: g.label, data: g.events }));

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerBtn}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Audit log</Text>
          <View style={styles.headerSubRow}>
            <Feather name="lock" size={11} color={colors.text.tertiary} />
            <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>
              Org-wide · immutable record
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={[styles.filterBtn, { borderColor: colors.surface.border, backgroundColor: colors.surface.card }]}
          accessibilityLabel="Filter audit log"
        >
          <Feather name="filter" size={17} color={colors.text.secondary} />
          {hasActiveFilters && <View style={[styles.filterDot, { backgroundColor: colors.brand.primary, borderColor: colors.surface.card }]} />}
        </Pressable>
      </View>

      {/* Search + quick chips */}
      <TaskSearchBar value={filters.search} onChangeText={setSearch} placeholder="Search actor, target or ID" />
      <View style={[styles.chipsWrap, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <AuditCategoryChips options={AUDIT_QUICK_CATEGORIES} active={filters.category} onChange={setCategory} />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ListSkeleton rows={5} />
        </View>
      ) : count === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="shield"
            title={hasActiveFilters || filters.search ? 'No matching events' : 'No audit events yet'}
            subtitle={
              hasActiveFilters || filters.search
                ? 'Try adjusting your filters or search terms'
                : 'Org-wide activity will appear here as it happens'
            }
          />
        </View>
      ) : (
        <SectionList<AuditEvent>
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => <SectionLabel title={section.title} />}
          renderItem={({ item, index, section }) => (
            <AuditEventRow
              event={item}
              onPress={() => router.push(`/(app)/audit/${item.id}` as never)}
              showDivider={index < section.data.length - 1}
            />
          )}
          renderSectionFooter={() => <View style={styles.sectionFooter} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing[6] }]}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} colors={[colors.brand.primary]} />
          }
        />
      )}

      <AuditFilterSheet
        visible={filterSheetVisible}
        current={filters}
        actors={actors}
        onApply={applySheet}
        onClose={() => setFilterSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3] + 2,
    paddingTop: Spacing[1] + 2,
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
  },
  headerBtn: { width: 38, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  headerTitleBlock: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  headerSubtitle: { fontSize: 11, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  chipsWrap: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  loadingWrap: { flex: 1, paddingHorizontal: Spacing[4], paddingTop: Spacing[4] },
  emptyWrap: { flex: 1, paddingHorizontal: Spacing[4], paddingTop: Spacing[8] },
  listContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4] },
  sectionLabel: {
    ...Typography.labelSm,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing[2] + 1,
    marginTop: Spacing[1],
  },
  sectionFooter: { height: Spacing[4] },
});
