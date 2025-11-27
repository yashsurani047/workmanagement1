import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../Themes/Themes';
import { getDepartments, getSubDepartments, getMembersBySubDept, getOrganizationUsers } from '../../Services/Project/FetchprojectUsers';

export default function MeetingParticipants({ value, onChange }) {
  const [selected, setSelected] = useState(Array.isArray(value.selected) ? value.selected : []);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState('one');
  const [departments, setDepartments] = useState([]); // { id,name, membersCount }
  const [orgUsers, setOrgUsers] = useState([]); // [{user_id, username, email}]
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const org = (await AsyncStorage.getItem('organization_id')) || 'one';
        setOrganizationId(org);
        const [deptRes, usersRes] = await Promise.all([
          getDepartments(org),
          getOrganizationUsers(org),
        ]);

        const deptList = Array.isArray(deptRes?.data?.departments) ? deptRes.data.departments : (deptRes?.data || []);
        const mapped = deptList.map((d) => ({ id: d.department_id || d.id || d.pk || String(d.name), name: d.name || d.department_name || 'Department', membersCount: d.members_count || 0 }));
        setDepartments(mapped);

        // Normalize org users
        const rawUsers = usersRes?.data || [];
        const ulist = Array.isArray(rawUsers?.users) ? rawUsers.users : Array.isArray(rawUsers) ? rawUsers : [];
        const normalized = ulist.map((u) => ({
          user_id: String(u.user_id || u.id || u.userId || ''),
          username: u.username || u.user_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          email: u.email || u.user_primary_email_id || '',
        })).filter(u => u.user_id);
        setOrgUsers(normalized);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleMember = (userId) => {
    const id = String(userId);
    const exists = selected.includes(id);
    const next = exists ? selected.filter(x => x !== id) : [...selected, id];
    setSelected(next);
    onChange({ ...value, selected: next });
  };

  const selectEntireOrg = () => {
    const allIds = orgUsers.map(u => String(u.user_id));
    setSelected(allIds);
    onChange({ ...value, selected: allIds });
  };

  const clearSelections = () => {
    setSelected([]);
    onChange({ ...value, selected: [] });
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return orgUsers.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      String(u.user_id).includes(q)
    ).slice(0, 20);
  }, [search, orgUsers]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Participants</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Departments grid */}
        <View style={styles.grid}>
          {departments.map((d) => (
            <View key={d.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.cardTitle}>{d.name}</Text>
                <Text style={styles.badge}>{d.membersCount} members</Text>
              </View>
              <TouchableOpacity
                style={[styles.member, selected.length > 0 && styles.memberHint]}
                onPress={async () => {
                  // Lazy fetch subdepartments -> members, then add their user_ids
                  try {
                    const sub = await getSubDepartments(d.id);
                    const subList = Array.isArray(sub?.data?.subdepartments) ? sub.data.subdepartments : (sub?.data || []);
                    let ids = [];
                    for (const s of subList) {
                      try {
                        const mem = await getMembersBySubDept(s.sub_department_id || s.id || s.pk);
                        const arr = Array.isArray(mem?.data?.users) ? mem.data.users : (mem?.data || []);
                        ids.push(...arr.map(u => String(u.user_id || u.id || u.userId || '')));
                      } catch {}
                    }
                    ids = Array.from(new Set(ids.filter(Boolean)));
                    const merged = Array.from(new Set([ ...selected, ...ids ]));
                    setSelected(merged);
                    onChange({ ...value, selected: merged });
                  } catch {}
                }}
              >
                <Text style={styles.memberText}>Select all members in {d.name}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={selectEntireOrg}>
            <Text style={styles.primaryBtnText}>Select Entire Organization</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={clearSelections}>
            <Text style={styles.ghostBtnText}>Clear All Selections</Text>
          </TouchableOpacity>
        </View>

        {/* Individual add */}
        <View style={styles.individualBlock}>
          <Text style={styles.cardTitle}>Add Individual Members</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {filteredUsers.map((u) => (
            <TouchableOpacity key={u.user_id} style={styles.userRow} onPress={() => toggleMember(u.user_id)}>
              <Text style={styles.userName}>{u.username || 'User'}</Text>
              <Text style={styles.userEmail}>{u.email || ''}</Text>
              <Text style={[styles.addTag, selected.includes(String(u.user_id)) && { color: theme.colors.primary }]}> {selected.includes(String(u.user_id)) ? 'Selected' : 'Add'} </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectedWrap}>
          <Text style={styles.selectedTitle}>Selected Members ({selected.length})</Text>
          {selected.map((id)=> (
            <Text key={id} style={styles.selectedItem}>{id}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '48%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 12 },
  cardTitle: { fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  badge: { color: theme.colors.textSecondary, fontSize: 12, backgroundColor: theme.colors.primary+"15", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  member: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border, marginTop: 6 },
  memberHint: { backgroundColor: theme.colors.sectionBg },
  memberText: { color: theme.colors.text },
  selectedWrap: { marginTop: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 12 },
  selectedTitle: { fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  selectedItem: { color: theme.colors.textSecondary, marginVertical: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  primaryBtnText: { color: theme.colors.background, fontWeight: '700' },
  ghostBtn: { borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  ghostBtnText: { color: theme.colors.text },
  individualBlock: { marginTop: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, backgroundColor: theme.colors.background, padding: 12 },
  searchInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 8, color: theme.colors.text },
  userRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  userName: { color: theme.colors.text, fontWeight: '600' },
  userEmail: { color: theme.colors.textSecondary, fontSize: 12 },
  addTag: { marginTop: 2, fontSize: 12, color: theme.colors.textSecondary },
});
