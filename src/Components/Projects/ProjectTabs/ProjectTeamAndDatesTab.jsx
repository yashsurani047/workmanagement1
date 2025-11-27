import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList } from "react-native";
import { X, Check } from "lucide-react-native";
import theme from "../../../Themes/Themes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOrganizationUsers } from "../../../Services/Project/FetchprojectUsers";

export default function ProjectTeamAndDatesTab({
  styles,
  SCREEN_HEIGHT,
  searchQuery,
  setSearchQuery,
  searchedUsers,
  toggleUser,
  isUserSelected,
  removeTeamMember,
  departments,
  renderDepartment,
  formData,
  setActiveTab,
  isSubmitting,
}) {
  const [deptTree, setDeptTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewLevel, setViewLevel] = useState('dept');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (Array.isArray(departments) && departments.length > 0) return;
        setError("");
        setLoading(true);
        const userInfoRaw = await AsyncStorage.getItem("userInfo");
        const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
        const orgId = (await AsyncStorage.getItem("organization_id")) || userInfo?.organization_id || "one";
        const res = await getOrganizationUsers(orgId);
        if (!mounted) return;
        if (!res?.success) {
          setError(res?.error || "Failed to fetch users");
          setDeptTree([]);
          return;
        }
        const data = res.data;
        const users = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
        const deptMap = new Map();
        for (const u of users) {
          const uid = String(u.user_id || u.id || "");
          const uname = u.user_name || u.username || "";
          const full = u.user_full_name || `${u.user_first_name || ""} ${u.user_last_name || ""}`.trim() || u.user_name || "";
          const deps = Array.isArray(u.departments) ? u.departments : [];
          if (deps.length === 0) {
            const dName = "Unassigned";
            if (!deptMap.has(dName)) deptMap.set(dName, { id: "unassigned", name: dName, subs: new Map() });
            const dept = deptMap.get(dName);
            const sName = "General";
            if (!dept.subs.has(sName)) dept.subs.set(sName, { id: "general", name: sName, users: [] });
            dept.subs.get(sName).users.push({ user_id: uid, user_name: uname, user_full_name: full });
            continue;
          }
          for (const d of deps) {
            const dName = d.department_name || "Unknown";
            const dId = String(d.department_id || dName);
            const sName = d.sub_department_name || "General";
            const sId = String(d.sub_department_id ?? sName);
            if (!deptMap.has(dName)) deptMap.set(dName, { id: dId, name: dName, subs: new Map() });
            const dept = deptMap.get(dName);
            if (!dept.subs.has(sName)) dept.subs.set(sName, { id: sId, name: sName, users: [] });
            dept.subs.get(sName).users.push({ user_id: uid, user_name: uname, user_full_name: full });
          }
        }
        const tree = Array.from(deptMap.values())
          .sort((a,b)=>String(a.name).localeCompare(String(b.name)))
          .map(d => ({
            id: d.id,
            name: d.name,
            subDepartments: Array.from(d.subs.values())
              .sort((a,b)=>String(a.name).localeCompare(String(b.name)))
              .map(s=>({
                ...s,
                users: (s.users||[]).slice().sort((a,b)=>String(a.user_full_name).localeCompare(String(b.user_full_name)))
              }))
          }));
        setDeptTree(tree);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Failed to fetch users");
        setDeptTree([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [departments]);

  const renderDepartmentLocal = ({ item: dept }) => (
    <TouchableOpacity key={dept.id} style={styles.deptCard} onPress={() => { setSelectedDept(dept); setViewLevel('sub'); }}>
      <View style={styles.deptHeader}>
        <Text style={styles.deptTitle}>{dept.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSubDepartmentLocal = ({ item: sub }) => (
    <TouchableOpacity key={sub.id} style={styles.subCard} onPress={() => { setSelectedSub(sub); setViewLevel('users'); }}>
      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>{sub.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUsersLocal = ({ item: u }) => (
    <TouchableOpacity key={u.user_id} style={styles.memberRow} onPress={() => toggleUser(u)}>
      <View style={[styles.checkbox, isUserSelected(u.user_id) && styles.checkboxSelected]}>
        {isUserSelected(u.user_id) && <Check size={16} color={theme.colors.white} />}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{u.user_full_name}</Text>
        {!!u.user_name && <Text style={styles.memberSubText}>@{u.user_name}</Text>}
      </View>
    </TouchableOpacity>
  );

  const useLocal = !renderDepartment || !Array.isArray(departments) || departments.length === 0;
  const dataSource = useLocal ? deptTree : departments;
  const renderer = useLocal ? (viewLevel === 'dept' ? renderDepartmentLocal : viewLevel === 'sub' ? renderSubDepartmentLocal : renderUsersLocal) : renderDepartment;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Assign Team Members</Text>
      <TextInput style={styles.searchInput} placeholder="Search team members..." value={searchQuery} onChangeText={setSearchQuery} />
      <ScrollView nestedScrollEnabled style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}>
        {searchQuery ? (
          <>
            <Text style={styles.sectionTitle}>Search Results ({searchedUsers.length})</Text>
            {searchedUsers.map(u => (
              <TouchableOpacity key={u.user_id} style={styles.memberRow} onPress={() => toggleUser(u)}>
                <View style={[styles.checkbox, isUserSelected(u.user_id) && styles.checkboxSelected]}>
                  {isUserSelected(u.user_id) && <Check size={16} color={theme.colors.white} />}
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{u.user_full_name}</Text>
                  <Text style={styles.memberSubText}>@{u.user_name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Departments</Text>
            {error ? (
              <Text style={styles.noMembersText}>{error}</Text>
            ) : (
              <>
                {useLocal && (
                  <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: 4 }}>
                    <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>
                      {viewLevel === 'dept' ? 'Departments' : viewLevel === 'sub' ? (selectedDept?.name || 'Sub-Departments') : (selectedSub?.name || 'Users')}
                    </Text>
                    {viewLevel !== 'dept' && (
                      <TouchableOpacity onPress={() => {
                        if (viewLevel === 'users') { setViewLevel('sub'); setSelectedSub(null); }
                        else if (viewLevel === 'sub') { setViewLevel('dept'); setSelectedDept(null); }
                      }}>
                        <Text style={{ color: theme.colors.primary, fontWeight:'700' }}>Back</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <FlatList
                  data={useLocal ? (viewLevel === 'dept' ? dataSource : viewLevel === 'sub' ? (selectedDept?.subDepartments||[]) : (selectedSub?.users||[])) : dataSource}
                  keyExtractor={item => String(item.id || item.user_id)}
                  renderItem={renderer}
                  ListEmptyComponent={<Text style={styles.noMembersText}>{loading ? 'Loading...' : 'No items'}</Text>}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      <Text style={styles.sectionTitle}>Selected ({formData.teamMembers.length})</Text>
      <View style={styles.selectedMembersContainer}>
        {formData.teamMembers.length === 0 ? (
          <Text style={styles.noMembersText}>No members selected</Text>
        ) : (
          formData.teamMembers.map(m => (
            <View key={m.user_id} style={styles.selectedMemberChip}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{m.name.split(" ").map(n => n[0]).join("").toUpperCase()}</Text>
              </View>
              <Text style={styles.selectedMemberName}>{m.name}</Text>
              <TouchableOpacity onPress={() => (removeTeamMember ? removeTeamMember(m.user_id) : toggleUser(m))}>
                <X size={14} color={theme.colors.meeting} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setActiveTab("details")}>
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Back to Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, isSubmitting && styles.disabledButton]} onPress={() => setActiveTab("attachments")}>
          <Text style={styles.buttonText}>Next: Attachments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
