/**
 * SuperAdminPeopleScreen — People tab (screens 55-56, §4.3 "People" nav).
 *
 * One screen, a Users / Departments toggle. Users view lists everyone
 * org-wide with role + status + staff ID; Departments view lists every
 * department with head, size and completion. The FAB pushes Create User or
 * Create Department depending on the active toggle.
 *
 * Replaces the old reuse of Admin's TeamDirectoryScreen (which only ever
 * showed Physics-dept employees for SA — see project_super_admin_dashboard
 * memory for the same "dedicated SA screen" precedent used for the Dashboard).
 */

import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import type { OrgUser } from '../data/orgDirectory.mock';
import type { OrgDepartmentWithStats, OrgUserFilter } from '../services/orgDirectory.service';
import { useOrgUsers, useOrgDepartments } from '../hooks/useOrgDirectory';
import { useColors } from '../constants/colors';
import { Layout, Spacing } from '../constants/spacing';
import { useDebounce } from '../hooks/useDebounce';
import { useRefreshControl } from '../hooks/useRefreshControl';

import { OrgUserCard } from '../components/people/OrgUserCard';
import { OrgDepartmentCard } from '../components/people/OrgDepartmentCard';
import { PeopleFilterChips } from '../components/people/PeopleFilterChips';
import { EmptyState } from '../components/ui/EmptyState';

type ViewMode = 'USERS' | 'DEPARTMENTS';

export function SuperAdminPeopleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [view, setView] = useState<ViewMode>('USERS');
  const [userFilter, setUserFilter] = useState<OrgUserFilter>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  const debouncedUserSearch = useDebounce(userSearch, 300);
  const debouncedDeptSearch = useDebounce(deptSearch, 300);

  const usersQuery = useOrgUsers(userFilter, debouncedUserSearch);
  const deptsQuery = useOrgDepartments(debouncedDeptSearch);

  const activeQuery = view === 'USERS' ? usersQuery : deptsQuery;
  const { refreshing, onRefresh } = useRefreshControl(activeQuery.refetch);

  const handleAdd = useCallback(() => {
    router.push(
      (view === 'USERS' ? '/(app)/people/create-user' : '/(app)/people/create-department') as Parameters<
        typeof router.push
      >[0]
    );
  }, [router, view]);

  const renderUser = useCallback(({ item }: { item: OrgUser }) => <OrgUserCard user={item} />, []);
  const renderDept = useCallback(
    ({ item }: { item: OrgDepartmentWithStats }) => <OrgDepartmentCard department={item} />,
    []
  );

  const totalUsers = usersQuery.data?.total ?? 0;
  const totalDepts = deptsQuery.data?.total ?? 0;

  const userEmpty = usersQuery.isLoading
    ? null
    : (
      <EmptyState
        icon="users"
        title={debouncedUserSearch ? `No results for "${debouncedUserSearch}"` : 'No users found'}
        {...(!debouncedUserSearch && userFilter === 'ALL'
          ? { subtitle: 'Add your first user using the button below.' }
          : {})}
      />
    );

  const deptEmpty = deptsQuery.isLoading
    ? null
    : (
      <EmptyState
        icon="briefcase"
        title={debouncedDeptSearch ? `No departments matching "${debouncedDeptSearch}"` : 'No departments yet'}
        {...(!debouncedDeptSearch ? { subtitle: 'Add your first department using the button below.' } : {})}
      />
    );

  return (
    <View style={[s.screen, { backgroundColor: colors.surface.background }]}>
      {/* ── Header + toggle ─────────────────────────────────────────────── */}
      <View style={[s.header, { backgroundColor: colors.surface.card, paddingTop: insets.top + 6, borderBottomColor: colors.surface.border }]}>
        <View style={s.titleRow}>
          <Text style={[s.title, { color: colors.text.primary }]}>People</Text>
          <Text style={[s.countText, { color: colors.text.tertiary }]}>
            {totalUsers} users · {totalDepts} depts
          </Text>
        </View>

        <View style={[s.toggleTrack, { backgroundColor: colors.surface.background }]}>
          <Pressable
            onPress={() => setView('USERS')}
            style={[s.toggleBtn, view === 'USERS' && { backgroundColor: colors.surface.card, ...s.toggleActiveShadow }]}
            accessibilityRole="button"
            accessibilityState={{ selected: view === 'USERS' }}
          >
            <Feather name="users" size={16} color={view === 'USERS' ? colors.brand.primary : colors.text.tertiary} />
            <Text style={[s.toggleText, { color: view === 'USERS' ? colors.brand.primary : colors.text.tertiary }]}>
              Users
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setView('DEPARTMENTS')}
            style={[s.toggleBtn, view === 'DEPARTMENTS' && { backgroundColor: colors.surface.card, ...s.toggleActiveShadow }]}
            accessibilityRole="button"
            accessibilityState={{ selected: view === 'DEPARTMENTS' }}
          >
            <Feather name="briefcase" size={16} color={view === 'DEPARTMENTS' ? colors.brand.primary : colors.text.tertiary} />
            <Text style={[s.toggleText, { color: view === 'DEPARTMENTS' ? colors.brand.primary : colors.text.tertiary }]}>
              Departments
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Search + filters ────────────────────────────────────────────── */}
      <View style={[s.searchSection, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <View style={[s.searchBar, { backgroundColor: colors.surface.background }]}>
          <Feather name="search" size={17} color={colors.text.tertiary} />
          <TextInput
            style={[s.searchInput, { color: colors.text.primary }]}
            placeholder={view === 'USERS' ? 'Search name or staff ID' : 'Search department'}
            placeholderTextColor={colors.text.tertiary}
            value={view === 'USERS' ? userSearch : deptSearch}
            onChangeText={view === 'USERS' ? setUserSearch : setDeptSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {(view === 'USERS' ? userSearch : deptSearch).length > 0 && (
            <Pressable onPress={() => (view === 'USERS' ? setUserSearch('') : setDeptSearch(''))} hitSlop={8}>
              <Feather name="x" size={16} color={colors.text.tertiary} />
            </Pressable>
          )}
        </View>

        {view === 'USERS' && (
          <View style={s.chipsWrap}>
            <PeopleFilterChips active={userFilter} onChange={setUserFilter} />
          </View>
        )}
      </View>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {view === 'USERS' ? (
        <FlatList
          data={usersQuery.isLoading ? [] : usersQuery.data?.users ?? []}
          keyExtractor={(u) => u.id}
          renderItem={renderUser}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={userEmpty}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Layout.tabBarHeight + 96 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} colors={[colors.brand.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={deptsQuery.isLoading ? [] : deptsQuery.data?.departments ?? []}
          keyExtractor={(d) => d.id}
          renderItem={renderDept}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={deptEmpty}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + Layout.tabBarHeight + 96 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} colors={[colors.brand.primary]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────── */}
      <Pressable
        onPress={handleAdd}
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + Layout.tabBarHeight + 16 },
          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={view === 'USERS' ? 'Add user' : 'Add department'}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <Text style={s.fabText}>{view === 'USERS' ? 'Add user' : 'Add department'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontFamily: 'Inter-SemiBold', letterSpacing: -0.3 },
  countText: { fontSize: 12, fontFamily: 'Inter-Regular' },
  toggleTrack: { flexDirection: 'row', borderRadius: 11, padding: 4, marginTop: 14 },
  toggleBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  toggleActiveShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.09,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', letterSpacing: 0 },
  searchSection: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[3], borderBottomWidth: 1 },
  searchBar: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 11,
    marginTop: 12,
  },
  searchInput: { flex: 1, fontSize: 13.5, fontFamily: 'Inter-Regular', letterSpacing: 0 },
  chipsWrap: { marginTop: 11 },
  list: { paddingHorizontal: Spacing[4], paddingTop: 14 },
  fab: {
    position: 'absolute',
    right: 18,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A5CF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    shadowColor: 'rgba(26,92,248,0.38)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  fabText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#FFFFFF', letterSpacing: 0 },
});
