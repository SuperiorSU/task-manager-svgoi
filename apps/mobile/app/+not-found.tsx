import React from 'react';
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { Colors } from '../src/constants/colors';
import { Typography } from '../src/constants/typography';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/(app)/(tabs)" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: Colors.surface.background },
  code: { ...Typography.displayLg, fontFamily: 'Inter-Bold', color: Colors.brand.primary },
  title: { ...Typography.h4, fontFamily: 'Inter-SemiBold', color: Colors.text.primary },
  link: { marginTop: 8 },
  linkText: { ...Typography.bodyMd, fontFamily: 'Inter-Medium', color: Colors.brand.primary },
});
