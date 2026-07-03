/**
 * OrgUserActivityTimeline — account-lifecycle ledger on the SA "User detail"
 * screen (68). Dot-and-line timeline, colored by event kind, with an
 * "Immutable" badge (mirrors the Audit module's read-only guarantee, FR-66).
 *
 * Distinct from TaskActivityTimeline (components/task/detail/) — that one
 * renders MockTask activity events (task-scoped), this renders
 * OrgUserActivityEvent (account-scoped). Different data shape, so a fork
 * rather than a shared component, same tradeoff as useGovernanceReviewActions.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import type { OrgUserActivityEvent } from '../../hooks/useOrgDirectory';
import { ORG_USER_ACTIVITY_META } from '../../hooks/useOrgDirectory';
import { useColors } from '../../constants/colors';

type Props = {
  events: OrgUserActivityEvent[];
};

function formatWhen(iso: string): string {
  const d = dayjs(iso);
  const hoursAgo = dayjs().diff(d, 'hour');
  if (hoursAgo < 24) return d.fromNow();
  return d.format('MMM D, h:mm A');
}

export const OrgUserActivityTimeline = React.memo(({ events }: Props) => {
  const colors = useColors();

  return (
    <View>
      <View style={s.headerRow}>
        <Text style={[s.headerLabel, { color: colors.text.tertiary }]}>Activity history</Text>
        <View style={[s.immutableBadge, { backgroundColor: '#F5F3FF' }]}>
          <Feather name="lock" size={10} color="#6D28D9" />
          <Text style={s.immutableText}>Immutable</Text>
        </View>
      </View>

      <View style={[s.card, { backgroundColor: colors.surface.card }]}>
        {events.length === 0 ? (
          <Text style={[s.emptyText, { color: colors.text.tertiary }]}>No recorded activity yet.</Text>
        ) : (
          <View style={s.list}>
            {events.map((event, idx) => {
              const meta = ORG_USER_ACTIVITY_META[event.kind];
              const isLast = idx === events.length - 1;
              return (
                <View key={event.id} style={s.row}>
                  <View style={s.lineCol}>
                    <View style={[s.dotRing, { backgroundColor: meta.ringColor }]}>
                      <View style={[s.dot, { backgroundColor: meta.dotColor }]} />
                    </View>
                    {!isLast && <View style={[s.line, { backgroundColor: colors.surface.border }]} />}
                  </View>
                  <View style={[s.content, isLast && s.contentLast]}>
                    <Text style={[s.description, { color: colors.text.secondary }]}>{event.description}</Text>
                    <Text style={[s.time, { color: colors.text.tertiary }]}>{formatWhen(event.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
});

OrgUserActivityTimeline.displayName = 'OrgUserActivityTimeline';

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginHorizontal: 20, marginBottom: 9 },
  headerLabel: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.4, textTransform: 'uppercase' },
  immutableBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  immutableText: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.3, color: '#6D28D9', textTransform: 'uppercase' },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 18,
    paddingLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyText: { fontSize: 12.5, fontFamily: 'Inter-Regular' },
  list: { gap: 0 },
  row: { flexDirection: 'row', gap: 10 },
  lineCol: { alignItems: 'center', width: 14 },
  dotRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, width: 1.5, marginVertical: 2, minHeight: 10 },
  content: { flex: 1, minWidth: 0, paddingBottom: 15 },
  contentLast: { paddingBottom: 0 },
  description: { fontSize: 12.5, fontFamily: 'Inter-Regular', lineHeight: 18 },
  time: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
});
