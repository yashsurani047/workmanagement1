// src/Components/CreateTaskWizard/StepAssignment.jsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../Themes/ThemeContext';
import { fetchProjectAssignees } from '../../../Services/Project/FetchProjectAssignee';
import { Users, Check, ChevronRight, UserCheck, AlertCircle } from 'lucide-react-native';

const AV_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#14B8A6'];

const Avatar = ({ name, color, size = 38 }) => {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: '700', color: '#FFF' }}>{initials}</Text>
    </View>
  );
};

export default function StepAssignment({ projectId, selectedAssignees, onChangeAssignees, onNext, onBack }) {
  const { theme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!projectId) { setLoading(false); return; }
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
    const exists = selectedAssignees.find(u => u.id === user.id);
    onChangeAssignees(exists ? selectedAssignees.filter(u => u.id !== user.id) : [...selectedAssignees, user]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 4 }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
            <Users size={16} color={theme.colors.primary} strokeWidth={2} />
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.colors.text }}>Assign Team Members</Text>
            <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 1 }}>
              {selectedAssignees.length > 0 ? `${selectedAssignees.length} selected` : 'Select who will work on this task'}
            </Text>
          </View>
        </View>

        {/* Content */}
        {!projectId ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <AlertCircle size={36} color={theme.colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' }}>Select a project first</Text>
          </View>
        ) : loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Loading team members…</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${theme.colors.primary}12`, alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={24} color={theme.colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>No Members Found</Text>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>No users available for this project</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const active = selectedAssignees.some(u => u.id === item.id);
              const color = AV_COLORS[index % AV_COLORS.length];
              return (
                <TouchableOpacity
                  onPress={() => toggle(item)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 11, paddingHorizontal: 14,
                    borderRadius: 14, borderWidth: 1.5,
                    borderColor: active ? `${color}60` : theme.colors.border,
                    backgroundColor: active ? `${color}0E` : theme.colors.card,
                  }}
                >
                  <Avatar name={item.name} color={color} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: active ? color : theme.colors.text }}>{item.name}</Text>
                    <Text style={{ fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' }}>Team Member</Text>
                  </View>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12,
                    borderWidth: 1.5, borderColor: active ? color : theme.colors.border,
                    backgroundColor: active ? color : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <Check size={13} color="#FFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Footer */}
        <View style={{ flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.8}
            style={{ flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary }}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} activeOpacity={0.8}
            style={{
              flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 14, backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5
            }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 }}>Next: Extras</Text>
            <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
