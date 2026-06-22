import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

import type { TaskStatus } from '@godigitify/types';

import { Colors } from '../../../src/constants/colors';
import { Typography } from '../../../src/constants/typography';
import { Spacing } from '../../../src/constants/spacing';
import { ScreenHeader } from '../../../src/components/layout/ScreenHeader';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { TaskCard } from '../../../src/components/task/TaskCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useTasks } from '../../../src/hooks/useTasks';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const { data } = useTasks({});

  const tasks = data as Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: string;
    assignee?: { name: string };
    department?: { name: string } | null;
  }> ?? [];

  const dueTodayTasks = tasks.filter((t) =>
    dayjs(t.dueDate).format('YYYY-MM-DD') === selectedDate
  );

  return (
    <SafeScreen>
      <ScreenHeader title="Calendar" />

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = dayjs().startOf('week').add(i, 'day');
          const iso = d.format('YYYY-MM-DD');
          const isSelected = iso === selectedDate;
          const isToday = iso === dayjs().format('YYYY-MM-DD');
          return (
            <View
              key={iso}
              style={[styles.dayCell, isSelected && styles.daySelected]}
              onTouchEnd={() => setSelectedDate(iso)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {d.format('ddd').toUpperCase()}
              </Text>
              <View style={[styles.dayNum, isToday && styles.dayNumToday]}>
                <Text style={[styles.dayNumText, isToday && styles.dayNumTextToday, isSelected && { color: Colors.text.inverse }]}>
                  {d.format('D')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <FlatList
        data={dueTodayTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
        ListHeaderComponent={
          <Text style={styles.dateLabel}>
            {dayjs(selectedDate).format('dddd, MMMM D')}
          </Text>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No tasks due"
            subtitle="Nothing scheduled for this day"
          />
        }
        renderItem={({ item }) => <TaskCard task={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface.border,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingVertical: 6,
  },
  daySelected: { backgroundColor: Colors.brand.primary },
  dayName: { ...Typography.caption, fontFamily: 'Inter-Medium', color: Colors.text.tertiary },
  dayNameSelected: { color: Colors.text.inverse },
  dayNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayNumToday: { backgroundColor: Colors.brand.primaryLight },
  dayNumText: { ...Typography.labelMd, fontFamily: 'Inter-SemiBold', color: Colors.text.primary },
  dayNumTextToday: { color: Colors.brand.primary },
  list: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[8] },
  dateLabel: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary, marginBottom: Spacing[2] },
});
