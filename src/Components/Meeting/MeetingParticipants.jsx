import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../Themes/ThemeContext';
import {
  getDepartments,
  getSubDepartments,
  getMembersBySubDept,
  getOrganizationUsers,
} from '../../Services/Project/FetchprojectUsers';
import {
  Users,
  Search,
  Building2,
  Check,
  X,
  UserPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Mail,
  User,
  Factory,
} from 'lucide-react-native';

export default function MeetingParticipants({ value, onChange, scope = 'Both' }) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState(Array.isArray(value.selected) ? value.selected : []);
  const [external, setExternal] = useState(Array.isArray(value.external) ? value.external : []);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState('one');
  const [departments, setDepartments] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [search, setSearch] = useState('');

  const [showInternal, setShowInternal] = useState(true);
  const [showExternal, setShowExternal] = useState(true);

  // External Form State
  const [extEmail, setExtEmail] = useState('');
  const [extName, setExtName] = useState('');
  const [extCompany, setExtCompany] = useState('');
  const [extRole, setExtRole] = useState('Guest (View & comment)');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles = [
    'Guest (View & comment)',
    'Client (View & edit)',
    'Vendor (View only)'
  ];

  useEffect(() => {
    (async () => {
      try {
        const org = (await AsyncStorage.getItem('organization_id')) || 'one';
        setOrganizationId(org);
        const [deptRes, usersRes] = await Promise.all([
          getDepartments(org),
          getOrganizationUsers(org),
        ]);

        const deptList = Array.isArray(deptRes?.data?.departments)
          ? deptRes.data.departments
          : deptRes?.data || [];
        const mapped = deptList.map((d) => ({
          id: d.department_id || d.id || d.pk || String(d.name),
          name: d.name || d.department_name || 'Department',
          membersCount: d.members_count || 0,
        }));
        setDepartments(mapped);

        const rawUsers = usersRes?.data || [];
        const ulist = Array.isArray(rawUsers?.users)
          ? rawUsers.users
          : Array.isArray(rawUsers)
            ? rawUsers
            : [];
        const normalized = ulist
          .map((u) => ({
            user_id: String(u.user_id || u.id || u.userId || ''),
            username:
              u.username ||
              u.user_name ||
              `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            email: u.email || u.user_primary_email_id || '',
          }))
          .filter((u) => u.user_id);
        setOrgUsers(normalized);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleMember = (userId) => {
    const id = String(userId);
    const exists = selected.includes(id);
    const next = exists ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    onChange({ ...value, selected: next });
  };

  const selectEntireOrg = () => {
    const allIds = orgUsers.map((u) => String(u.user_id));
    setSelected(allIds);
    onChange({ ...value, selected: allIds });
  };

  const clearSelections = () => {
    setSelected([]);
    onChange({ ...value, selected: [] });
  };

  const addExternal = () => {
    if (!extEmail.trim()) {
      return;
    }
    const newExt = {
      id: Date.now().toString(),
      email: extEmail.trim(),
      name: extName.trim(),
      company: extCompany.trim(),
      role: extRole,
    };
    const next = [...external, newExt];
    setExternal(next);
    onChange({ ...value, external: next });
    setExtEmail('');
    setExtName('');
    setExtCompany('');
    setExtRole('Guest (View & comment)');
  };

  const removeExternal = (id) => {
    const next = external.filter(x => x.id !== id);
    setExternal(next);
    onChange({ ...value, external: next });
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return orgUsers
      .filter(
        (u) =>
          (u.username || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          String(u.user_id).includes(q)
      )
      .slice(0, 20);
  }, [search, orgUsers]);

  const showInternalSection = scope === 'Internal' || scope === 'Both';
  const showExternalSection = scope === 'External' || scope === 'Both';

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>

        {/* ─── Internal Participants ─── */}
        {showInternalSection && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>
                  Internal Participants
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginLeft: 8 }}>
                  ({selected.length} selected)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowInternal(!showInternal)}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.primary }}>
                  {showInternal ? 'Hide Team' : 'Show Team'}
                </Text>
              </TouchableOpacity>
            </View>

            {showInternal && (
              <View>
                {/* Search Bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.muted100,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    marginBottom: 16,
                  }}
                >
                  <Search size={16} color={theme.colors.textSecondary} strokeWidth={2} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: theme.colors.text, paddingVertical: 12 }}
                    placeholder="Search team members..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                {/* Team Content */}
                {search.trim() ? (
                  <View style={{ marginBottom: 16 }}>
                    {filteredUsers.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12 }}>
                        <Text style={{ color: theme.colors.textSecondary }}>No team members found</Text>
                      </View>
                    ) : (
                      filteredUsers.map((u) => {
                        const sel = selected.includes(String(u.user_id));
                        return (
                          <TouchableOpacity
                            key={u.user_id}
                            onPress={() => toggleMember(u.user_id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 10,
                              borderBottomWidth: 1,
                              borderBottomColor: theme.colors.borderMuted
                            }}
                          >
                            <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: sel ? theme.colors.primary : theme.colors.border, backgroundColor: sel ? theme.colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                              {sel && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                            </View>
                            <Text style={{ color: theme.colors.text, fontWeight: '500' }}>{u.username}</Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    {departments.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        onPress={async () => {
                          // ... department logic ...
                          try {
                            const sub = await getSubDepartments(d.id);
                            const subList = Array.isArray(sub?.data?.subdepartments) ? sub.data.subdepartments : sub?.data || [];
                            let ids = [];
                            for (const s of subList) {
                              const mem = await getMembersBySubDept(s.sub_department_id || s.id || s.pk);
                              const arr = Array.isArray(mem?.data?.users) ? mem.data.users : mem?.data || [];
                              ids.push(...arr.map((u) => String(u.user_id || u.id || u.userId || '')));
                            }
                            ids = Array.from(new Set(ids.filter(Boolean)));
                            const merged = Array.from(new Set([...selected, ...ids]));
                            setSelected(merged);
                            onChange({ ...value, selected: merged });
                          } catch { }
                        }}
                        style={{ width: '48%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.card, padding: 12 }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>{d.name}</Text>
                        <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 }}>{d.membersCount} members</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {selected.map(id => {
                    const u = orgUsers.find(x => String(x.user_id) === id);
                    return (
                      <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.primary }}>{u?.username || 'User'}</Text>
                        <TouchableOpacity onPress={() => toggleMember(id)}>
                          <X size={14} color={theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ─── External ParticipantsSection ─── */}
        {showExternalSection && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.colors.text }}>
                  External Participants
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginLeft: 8 }}>
                  ({external.length} selected)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowExternal(!showExternal)}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.primary }}>
                  {showExternal ? 'Hide Add' : 'Show Add'}
                </Text>
              </TouchableOpacity>
            </View>

            {showExternal && (
              <View>
                {/* Form Wrapper */}
                <View
                  style={{
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                  }}
                >
                  {/* Email Field */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Mail size={14} color={theme.colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Email Address *</Text>
                    </View>
                    <TextInput
                      style={{
                        borderWidth: 1.5,
                        borderColor: extEmail ? theme.colors.primary : theme.colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        height: 50,
                        backgroundColor: theme.colors.muted100,
                        color: theme.colors.text,
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                      placeholder="e.g. guest@example.com"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={extEmail}
                      onChangeText={setExtEmail}
                      keyboardType="email-address"
                    />
                  </View>

                  {/* Name Field */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <User size={14} color={theme.colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Full Name</Text>
                    </View>
                    <TextInput
                      style={{
                        borderWidth: 1.5,
                        borderColor: theme.colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        height: 50,
                        backgroundColor: theme.colors.muted100,
                        color: theme.colors.text,
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                      placeholder="Enter guest name (optional)"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={extName}
                      onChangeText={setExtName}
                    />
                  </View>

                  {/* Company Field */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Factory size={14} color={theme.colors.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text }}>Company</Text>
                    </View>
                    <TextInput
                      style={{
                        borderWidth: 1.5,
                        borderColor: theme.colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        height: 50,
                        backgroundColor: theme.colors.muted100,
                        color: theme.colors.text,
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                      placeholder="Enter company name (optional)"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={extCompany}
                      onChangeText={setExtCompany}
                    />
                  </View>

                  {/* Role Selection */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: '600' }}>Access Role:</Text>
                    <TouchableOpacity
                      onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderWidth: 1.5,
                        borderColor: theme.colors.border,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        height: 50,
                        backgroundColor: theme.colors.card,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: theme.colors.text, fontWeight: '600' }}>{extRole}</Text>
                      <ChevronDown
                        size={18}
                        color={theme.colors.textSecondary}
                        style={{ transform: [{ rotate: showRoleDropdown ? '180deg' : '0deg' }] }}
                      />
                    </TouchableOpacity>

                    {showRoleDropdown && (
                      <View
                        style={{
                          marginTop: 8,
                          backgroundColor: theme.colors.muted100,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          overflow: 'hidden',
                        }}
                      >
                        {roles.map((r, idx) => (
                          <TouchableOpacity
                            key={r}
                            onPress={() => {
                              setExtRole(r);
                              setShowRoleDropdown(false);
                            }}
                            style={{
                              padding: 14,
                              backgroundColor: extRole === r ? `${theme.colors.primary}10` : 'transparent',
                              borderBottomWidth: idx === roles.length - 1 ? 0 : 1,
                              borderBottomColor: theme.colors.borderMuted,
                            }}
                          >
                            <Text
                              style={{
                                color: extRole === r ? theme.colors.primary : theme.colors.text,
                                fontWeight: extRole === r ? '700' : '500',
                                fontSize: 14,
                              }}
                            >
                              {r}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Add Button */}
                  <TouchableOpacity
                    onPress={addExternal}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: theme.colors.primary,
                      height: 54,
                      borderRadius: 14,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      shadowColor: theme.colors.primary,
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 4,
                    }}
                  >
                    <UserPlus size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>Add External Guest</Text>
                  </TouchableOpacity>
                </View>

                {/* List of Added External */}
                {external.length > 0 && (
                  <View style={{ gap: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginLeft: 4 }}>
                      Guests Invited ({external.length})
                    </Text>
                    {external.map((ex) => (
                      <View
                        key={ex.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: theme.colors.card,
                          padding: 16,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text }}>
                              {ex.name || 'Guest'}
                            </Text>
                            <View style={{ backgroundColor: `${theme.colors.primary}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: theme.colors.primary, textTransform: 'uppercase' }}>
                                {ex.role.split(' ')[0]}
                              </Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>{ex.email}</Text>
                          {ex.company ? (
                            <Text style={{ fontSize: 12, color: theme.colors.primary, marginTop: 2, fontWeight: '600' }}>
                              {ex.company}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => removeExternal(ex.id)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: `${theme.colors.error}10`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
