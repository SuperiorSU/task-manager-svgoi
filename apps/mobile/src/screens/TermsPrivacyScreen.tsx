/**
 * TermsPrivacyScreen — static Terms of Service + Privacy Policy content.
 * Reached two ways: pre-login from the Login screen footer (route
 * app/(auth)/terms.tsx) and post-login from every role's Profile → Settings
 * → "Terms & privacy" row (route app/(app)/profile/terms.tsx, via the shared
 * ProfileSettingsSection component). Same screen component, two thin route
 * wrappers — the (app) group redirects unauthenticated users to /login, so
 * a single (app)-only route wouldn't be reachable from the login footer.
 * Visual pattern (header bar + card sections) mirrors profile/help.tsx,
 * the only other static-content screen in the app.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../constants/colors';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Acceptance of terms',
    body:
      'TaskFlow SVGOI is provided for use by SVGOI staff for organizational task management. Accounts are issued by your administrator — by signing in, you agree to use the app only for its intended work purposes.',
  },
  {
    title: '2. Account & access',
    body:
      'There is no self-registration. Your Employee ID, role, department, and reporting manager are managed by your administrator or Super Admin. You are responsible for keeping your password confidential and for all activity under your account.',
  },
  {
    title: '3. Acceptable use',
    body:
      'Do not share login credentials, attempt to access data outside your assigned role or department, or use the app to store content unrelated to organizational tasks. Task content, comments, and attachments should relate to legitimate work activity.',
  },
  {
    title: '4. Data we collect',
    body:
      'We store the task, comment, attachment, and account data you and your organization create in the app, along with operational metadata (login times, IP address, device platform) needed for security and audit purposes.',
  },
  {
    title: '5. How your data is used',
    body:
      'Data is used to operate task assignment, tracking, and reporting features, and to maintain the immutable audit trail required for organizational accountability (FR-66). Admins and Super Admins can see data scoped to their role and department; Employees see only their own tasks.',
  },
  {
    title: '6. Data retention & security',
    body:
      'Passwords are stored hashed, never in plain text. Audit logs are never edited or deleted. Files are stored in access-controlled storage with time-limited download links. Deactivated accounts have their active sessions revoked immediately.',
  },
  {
    title: '7. Changes to this policy',
    body:
      'This policy may be updated as the app evolves. Continued use of TaskFlow SVGOI after an update means you accept the revised terms.',
  },
  {
    title: '8. Contact',
    body:
      'Questions about these terms or your data can be directed to your Super Admin or SVGOI IT support via the Help & Support screen.',
  },
];

export function TermsPrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Terms & Privacy</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.intro, { color: colors.text.secondary }]}>
          Terms of Service &amp; Privacy Policy for TaskFlow SVGOI. Last updated 2026.
        </Text>

        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          {SECTIONS.map((section, i) => (
            <View
              key={section.title}
              style={[s.section, i < SECTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.surface.border }]}
            >
              <Text style={[s.sectionTitle, { color: colors.text.primary }]}>{section.title}</Text>
              <Text style={[s.sectionBody, { color: colors.text.secondary }]}>{section.body}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  intro: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 19, marginBottom: 16 },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  section: { paddingHorizontal: 16, paddingVertical: 14 },
  sectionTitle: { fontSize: 13.5, fontFamily: 'Inter-SemiBold', marginBottom: 6 },
  sectionBody: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 19 },
});
