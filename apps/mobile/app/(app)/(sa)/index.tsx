import { View, Text, StyleSheet } from 'react-native';

export default function SuperAdminDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Dashboard</Text>
      <Text style={styles.sub}>Super Admin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  text: { fontSize: 40, fontFamily: 'Inter-Bold' },
  sub: { fontSize: 18, fontFamily: 'Inter-Regular', opacity: 0.4 },
});
