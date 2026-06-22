import React, { useState } from 'react';
import { FlatList, View, StyleSheet, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import type { TaskStatus } from '@godigitify/types';

import { Colors } from '../../../src/constants/colors';
import { Spacing, Layout } from '../../../src/constants/spacing';
import { Typography } from '../../../src/constants/typography';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { TaskCard } from '../../../src/components/task/TaskCard';
import { TaskFilterBar } from '../../../src/components/task/TaskFilterBar';
import { TaskCardSkeleton } from '../../../src/components/ui/Skeleton';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useTasks } from '../../../src/hooks/useTasks';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useRefreshControl } from '../../../src/hooks/useRefreshControl';
import { usePermissions } from '../../../src/hooks/usePermissions';

export default function TasksScreen() {
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, refetch } = useTasks({
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const { refreshing, onRefresh } = useRefreshControl(refetch);

  const tasks = data as Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string;
    assignee?: { name: string };
    department?: { name: string } | null;
  }> ?? [];

  return (
    <SafeScreen>
      <ScreenHeader
        title="Tasks"
        rightAction={
          isAdmin
            ? { icon: 'plus', label: 'Create task', onPress: () => router.push('/(app)/tasks/create') }
            : undefined
        }
      />

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={16} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={Colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color={Colors.text.tertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <TaskFilterBar active={statusFilter} onChange={setStatusFilter} />

      <FlatList
        data={isLoading ? [] : tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingList}>
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </View>
          ) : (
            <EmptyState
              icon="check-square"
              title={debouncedSearch ? 'No tasks found' : 'No tasks yet'}
              subtitle={debouncedSearch ? 'Try a different search' : 'Tasks assigned to you will appear here'}
            />
          )
        }
        renderItem={({ item }) => <TaskCard task={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.surface.background,
    borderRadius: 10,
    paddingHorizontal: Spacing[3],
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontFamily: 'Inter-Regular',
    color: Colors.text.primary,
  },
  list: {
    padding: Spacing[4],
    paddingBottom: Spacing[8],
  },
  loadingList: { gap: Spacing[3] },
});
