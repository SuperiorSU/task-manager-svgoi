import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../../src/constants/colors';

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How do I accept a task assigned to me?',
    a: 'Open the task from your Tasks list and tap "Accept". The status will update to Accepted and your manager will be notified.',
  },
  {
    q: 'How do I mark a task as completed?',
    a: 'On the task detail screen, tap the status button and select "Submit for Review". Your reporting manager reviews and marks it complete.',
  },
  {
    q: 'Why is a task showing as overdue?',
    a: 'A task is overdue when its due date has passed and it hasn\'t been marked complete. Contact your manager to get the deadline extended.',
  },
  {
    q: 'Can I change my employee ID or department?',
    a: 'No. Employee ID, department, role, and reporting manager are managed by your admin. Contact HR or your system administrator to make changes.',
  },
  {
    q: 'How do I turn off email notifications?',
    a: 'Go to Profile → Notification Preferences and toggle off "Email" under Delivery Method.',
  },
  {
    q: 'I forgot my password. How do I reset it?',
    a: 'On the login screen, tap "Forgot password?" and enter your registered email. You\'ll receive a reset link within a few minutes.',
  },
];

const CONTACT = [
  { icon: 'mail' as const, label: 'Email support', value: 'support@svgoi.edu.in' },
  { icon: 'phone' as const, label: 'Call helpdesk', value: '+91 261 000 0000' },
];

// ─── FAQ item ─────────────────────────────────────────────────────────────────

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  const colors = useColors();

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={[s.faqRow, { borderBottomColor: colors.surface.border }]}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={s.faqTop}>
        <Text style={[s.faqQ, { color: colors.text.primary }]}>{q}</Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.tertiary}
        />
      </View>
      {open && <Text style={[s.faqA, { color: colors.text.secondary }]}>{a}</Text>}
    </Pressable>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[s.screen, { paddingTop: insets.top, backgroundColor: colors.surface.background }]}>
      {/* Header */}
      <View style={[s.headerBar, { backgroundColor: colors.surface.card, borderBottomColor: colors.surface.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="chevron-left" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.text.primary }]}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[s.hero, { backgroundColor: colors.brand.primary }]}>
          <View style={s.heroIcon}>
            <Feather name="life-buoy" size={28} color={colors.brand.primary} />
          </View>
          <Text style={s.heroTitle}>How can we help?</Text>
          <Text style={s.heroSub}>Browse FAQs or reach out to our support team</Text>
        </View>

        {/* FAQs */}
        <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Frequently asked questions</Text>
        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </View>

        {/* Contact */}
        <Text style={[s.sectionLabel, { color: colors.text.tertiary }]}>Contact us</Text>
        <View style={[s.card, { backgroundColor: colors.surface.card }]}>
          {CONTACT.map((c, i) => (
            <React.Fragment key={c.label}>
              <Pressable
                onPress={() =>
                  c.icon === 'mail'
                    ? Linking.openURL(`mailto:${c.value}`)
                    : Linking.openURL(`tel:${c.value}`)
                }
                style={({ pressed }) => [s.contactRow, pressed && { opacity: 0.7 }]}
              >
                <View style={[s.contactIcon, { backgroundColor: colors.brand.primaryLight }]}>
                  <Feather name={c.icon} size={17} color={colors.brand.primary} />
                </View>
                <View style={s.contactText}>
                  <Text style={[s.contactLabel, { color: colors.text.secondary }]}>{c.label}</Text>
                  <Text style={[s.contactValue, { color: colors.brand.primary }]}>{c.value}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.surface.borderStrong} />
              </Pressable>
              {i < CONTACT.length - 1 && (
                <View style={[s.divider, { backgroundColor: colors.surface.border, marginLeft: 62 }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Version note */}
        <Text style={[s.version, { color: colors.text.tertiary }]}>TaskFlow SVGOI · v1.0</Text>
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
  scroll: { paddingHorizontal: 16, paddingTop: 0 },
  hero: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 13, fontFamily: 'Inter-Regular', color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 2,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  faqTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: 'Inter-SemiBold', lineHeight: 20 },
  faqA: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 20, marginTop: 10 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  contactIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 11, fontFamily: 'Inter-Regular' },
  contactValue: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginTop: 1 },
  divider: { height: 1, marginRight: 16 },
  version: { fontSize: 11, fontFamily: 'Inter-Regular', textAlign: 'center', marginTop: 4 },
});
