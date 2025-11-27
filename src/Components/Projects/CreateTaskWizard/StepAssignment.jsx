// src/Components/CreateTaskWizard/StepAssignment.jsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import theme from '../../../Themes/Themes';
import { fetchProjectAssignees } from '../../../Services/Project/FetchProjectAssignee';

export default function StepAssignment({ projectId, selectedAssignees, onChangeAssignees, onNext, onBack }) {
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!projectId) return;
        const list = await fetchProjectAssignees(projectId);
        const mapped = Array.isArray(list) ? list.map(u => ({ id: u.user_id, name: u.user_name })) : [];
        if (mounted) setUsers(mapped);
      } catch (_) {
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [projectId]);

  const toggle = (user) => {
    const exists = selectedAssignees.find((u) => u.id === user.id);
    if (exists) {
      onChangeAssignees(selectedAssignees.filter((u) => u.id !== user.id));
    } else {
      onChangeAssignees([...selectedAssignees, user]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Assign To</Text>
      {!projectId ? (
        <Text style={styles.muted}>Select a project first.</Text>
      ) : loading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : users.length === 0 ? (
        <Text style={styles.muted}>No users available for this project</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const active = selectedAssignees.some((u) => u.id === item.id);
            return (
              <TouchableOpacity
                style={[styles.item, active && styles.itemActive]}
                onPress={() => toggle(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.ghostBtn]} onPress={onBack}>
          <Text style={styles.ghostBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  muted: { color: theme.colors.textSecondary },
  item: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.colors.background },
  itemActive: { borderWidth: 1, borderColor: theme.colors.primary + '55' },
  itemText: { color: theme.colors.text },
  itemTextActive: { color: theme.colors.primary, fontWeight: '600' },
  sep: { height: 8 },
  footer: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  ghostBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  ghostBtnText: { color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryBtnText: { color: theme.colors.white, fontWeight: '700' },
});
