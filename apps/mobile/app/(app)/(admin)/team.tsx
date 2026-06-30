import { View, Text, StyleSheet } from 'react-native';

export default function AdminTeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Team</Text>
      <Text style={styles.sub}>Admin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  text: { fontSize: 40, fontFamily: 'Inter-Bold' },
  sub: { fontSize: 18, fontFamily: 'Inter-Regular', opacity: 0.4 },
});
