import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import theme from '../../Themes/Themes';
import { fetchEventParticipants } from '../../Services/Event/EventParticipantsService';

export default function EventParticipants({ value, onChange, type }) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(Array.isArray(value?.members) ? value.members.map(v=>String(v)) : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [expandedDept, setExpandedDept] = useState(null);
  const [expandedSub, setExpandedSub] = useState({});

  const [contacts, setContacts] = useState(Array.isArray(value?.external) ? value.external : []);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setError('');
        setLoading(true);
        if (type === 'external') {
          if (mounted) setLoading(false);
          return;
        }
        const res = await fetchEventParticipants();
        if (!mounted) return;
        if (!res?.success) {
          console.error('EventParticipants load error:', res?.error || 'Failed to load participants');
          setError(res?.error || 'Failed to load participants');
          setDepartments([]);
        } else {
          setDepartments(res.departments || []);
        }
      } catch (e) {
        if (!mounted) return;
        console.error('EventParticipants load exception:', e?.message || e);
        setError(e?.message || 'Failed to load participants');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [type]);

  useEffect(() => {
    // keep local state in sync when parent value changes only
  }, []);

  useEffect(() => {
    setSelectedIds(Array.isArray(value?.members) ? value.members.map((v)=>String(v)) : []);
    setContacts(Array.isArray(value?.external) ? value.external : []);
  }, [value?.members, value?.external]);

  const toggleUser = (id) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id];
      try { onChange({ ...value, members: next }); } catch {}
      return next;
    });
  };

  const setSubExpanded = (deptId, subId, v) => {
    setExpandedSub((prev) => ({ ...prev, [deptId]: { ...(prev[deptId]||{}), [subId]: v } }));
  };

  const addAll = (deptId, subId) => {
    const dept = departments.find(d=>String(d.id)===String(deptId));
    const sub = dept?.subDepartments?.find(s=>String(s.id)===String(subId));
    if (!sub) return;
    const ids = sub.users.map(u=>String(u.id));
    setSelectedIds((prev)=>{
      const next = Array.from(new Set([...prev, ...ids]));
      try { onChange({ ...value, members: next }); } catch {}
      return next;
    });
  };
  const removeAll = (deptId, subId) => {
    const dept = departments.find(d=>String(d.id)===String(deptId));
    const sub = dept?.subDepartments?.find(s=>String(s.id)===String(subId));
    if (!sub) return;
    const ids = new Set(sub.users.map(u=>String(u.id)));
    setSelectedIds((prev)=>{
      const next = prev.filter(id=>!ids.has(String(id)));
      try { onChange({ ...value, members: next }); } catch {}
      return next;
    });
  };

  const filteredDepartments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.map(d=>({
      ...d,
      subDepartments: (d.subDepartments||[]).map(s=>({
        ...s,
        users: (s.users||[]).filter(u=>
          String(u.fullName||'').toLowerCase().includes(q) || String(u.username||'').toLowerCase().includes(q)
        )
      })).filter(s=>s.users.length>0)
    })).filter(d=>d.subDepartments.length>0);
  }, [departments, query]);

  const idToUser = useMemo(() => {
    const map = new Map();
    try {
      for (const d of departments || []) {
        for (const s of d?.subDepartments || []) {
          for (const u of s?.users || []) {
            map.set(String(u.id), u);
          }
        }
      }
    } catch {}
    return map;
  }, [departments]);

  const addContact = () => {
    const name = String(cName || '').trim();
    const email = String(cEmail || '').trim();
    const phone = String(cPhone || '').trim();
    if (!email) return;
    setContacts(prev => {
      const next = [...prev, { name, email, phone }];
      try { onChange({ ...value, external: next }); } catch {}
      return next;
    });
    setCName(''); setCEmail(''); setCPhone('');
  };
  const removeContact = (idx) => {
    setContacts(prev => {
      const next = prev.filter((_, i) => i !== idx);
      try { onChange({ ...value, external: next }); } catch {}
      return next;
    });
  };

  if (type === 'external') {
    return (
      <View>
        <Text style={styles.sectionLabel}>External Contacts</Text>
        <View style={styles.extBox}>
          <Text style={styles.extTitle}>Add New Contact</Text>
          <View style={styles.row3}>
            <View style={styles.col3}><Text style={styles.label}>Name</Text><TextInput style={styles.input} placeholder="Name" value={cName} onChangeText={setCName} /></View>
            <View style={styles.col3}><Text style={styles.label}>Email*</Text><TextInput style={styles.input} placeholder="Email" value={cEmail} onChangeText={setCEmail} keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={styles.col3}><Text style={styles.label}>Phone</Text><TextInput style={styles.input} placeholder="Phone" value={cPhone} onChangeText={setCPhone} keyboardType="phone-pad" /></View>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={addContact}>
            <Text style={styles.addBtnText}>Add Contact</Text>
          </TouchableOpacity>
        </View>

        {Array.isArray(contacts) && contacts.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {contacts.map((c, idx) => (
              <View key={`${c.email}-${idx}`} style={styles.contactRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactText}>{c.name || '—'}</Text>
                  <Text style={styles.contactSub}>{c.email}</Text>
                  {!!c.phone && <Text style={styles.contactSub}>{c.phone}</Text>}
                </View>
                <TouchableOpacity style={styles.removeChip} onPress={() => removeContact(idx)}>
                  <Text style={styles.removeChipText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.section}>Team Members</Text>
      <TextInput
        style={styles.search}
        placeholder="Search team members..."
        value={query}
        onChangeText={setQuery}
      />

      {error ? (
        <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{error}</Text>
      ) : null}

      {loading ? (
        <Text style={{ color: theme.colors.textSecondary }}>Loading...</Text>
      ) : (
        <View>
          <View style={styles.deptGrid}>
            {filteredDepartments.map((dept) => (
              <View key={dept.id} style={styles.deptCard}>
                <TouchableOpacity style={styles.deptHeader} onPress={() => setExpandedDept(expandedDept === dept.id ? null : dept.id)}>
                  <Text style={styles.deptTitle}>{dept.name}</Text>
                  <Text style={styles.deptToggle}>{expandedDept === dept.id ? '−' : '+'}</Text>
                </TouchableOpacity>
                {expandedDept === dept.id && (
                  <View>
                    {(dept.subDepartments||[]).map((sub) => (
                      <View key={sub.id} style={styles.subCard}>
                        <TouchableOpacity style={styles.subHeader} onPress={() => setSubExpanded(dept.id, sub.id, !(expandedSub?.[dept.id]?.[sub.id]))}>
                          <Text style={styles.subTitle}>{sub.name}</Text>
                          <View style={{ flexDirection:'row', alignItems:'center', gap: 12 }}>
                            <TouchableOpacity onPress={() => addAll(dept.id, sub.id)}>
                              <Text style={styles.addAll}>Add All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeAll(dept.id, sub.id)}>
                              <Text style={styles.removeAll}>Remove All</Text>
                            </TouchableOpacity>
                            <Text style={styles.deptToggle}>{expandedSub?.[dept.id]?.[sub.id] ? '▾' : '▸'}</Text>
                          </View>
                        </TouchableOpacity>
                        {expandedSub?.[dept.id]?.[sub.id] && (
                          <View style={styles.userList}>
                            {(sub.users||[]).map((u) => {
                              const checked = selectedIds.includes(String(u.id));
                              return (
                                <TouchableOpacity key={`${dept.id}-${sub.id}-${u.id}`} style={styles.userRow} onPress={() => toggleUser(String(u.id))}>
                                  <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
                                  <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{u.fullName || u.username}</Text>
                                    {!!u.username && <Text style={styles.userHandle}>@{u.username}</Text>}
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <Text style={[styles.section,{ marginTop: 16 }]}>Selected Team Members ({selectedIds.length})</Text>
          <View style={styles.selectedBox}>
            {selectedIds.length === 0 ? (
              <Text style={styles.placeholder}>No team members selected yet</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedIds.map((id)=> {
                  const u = idToUser.get(String(id));
                  const label = u ? (u.fullName || u.username || String(id)) : String(id);
                  return (
                    <View key={id} style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: theme.colors.text, fontWeight: '700', marginBottom: 8 },
  search: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, marginBottom: 12 },
  deptGrid: { gap: 12 },
  deptCard: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 12 },
  deptHeader: { paddingHorizontal: 12, paddingVertical: 10, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  deptTitle: { color: theme.colors.text, fontWeight:'700' },
  deptToggle: { color: theme.colors.textSecondary, fontSize: 16 },
  subCard: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  subHeader: { paddingHorizontal: 12, paddingVertical: 8, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  subTitle: { color: theme.colors.text, fontWeight:'600' },
  addAll: { color: theme.colors.success, fontWeight:'700' },
  removeAll: { color: theme.colors.error, fontWeight:'700' },
  userList: { paddingHorizontal: 12, paddingBottom: 8 },
  userRow: { flexDirection:'row', alignItems:'center', paddingVertical: 8, gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  userInfo: { flex: 1 },
  userName: { color: theme.colors.text, fontWeight:'600' },
  userHandle: { color: theme.colors.textSecondary, fontSize: 12 },
  selectedBox: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  placeholder: { color: theme.colors.text },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: theme.colors.primary+"15", marginRight: 8 },
  chipText: { color: theme.colors.primary, fontWeight: '700' },
  sectionLabel: { color: theme.colors.text, fontWeight: '700', marginBottom: 8, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8 },
  extBox: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.sectionBg, borderRadius: 12, padding: 12 },
  extTitle: { color: theme.colors.textSecondary, fontWeight: '700', marginBottom: 8 },
  row3: { flexDirection: 'row', gap: 10 },
  col3: { flex: 1 },
  label: { color: theme.colors.text, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background, borderRadius: 8, padding: 10, color: theme.colors.text },
  addBtn: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: theme.colors.secondary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: theme.colors.white, fontWeight: '700' },
  contactRow: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: theme.colors.background, flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactText: { color: theme.colors.text, fontWeight: '700' },
  contactSub: { color: theme.colors.textSecondary },
  removeChip: { borderWidth: 1, borderColor: theme.colors.error, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  removeChipText: { color: theme.colors.error, fontWeight: '700' },
});
