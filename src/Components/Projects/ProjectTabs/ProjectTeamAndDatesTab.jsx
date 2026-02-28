import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  Check,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowLeft,
} from "lucide-react-native";
import { useTheme } from "../../../Themes/ThemeContext";
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
  const { theme } = useTheme();
  const [deptTree, setDeptTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewLevel, setViewLevel] = useState("dept");
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
        const orgId =
          (await AsyncStorage.getItem("organization_id")) ||
          userInfo?.organization_id ||
          "one";
        const res = await getOrganizationUsers(orgId);
        if (!mounted) return;
        if (!res?.success) {
          setError(res?.error || "Failed to fetch users");
          setDeptTree([]);
          return;
        }
        const data = res.data;
        const users = Array.isArray(data?.users)
          ? data.users
          : Array.isArray(data)
            ? data
            : [];
        const deptMap = new Map();
        for (const u of users) {
          const uid = String(u.user_id || u.id || "");
          const uname = u.user_name || u.username || "";
          const full =
            u.user_full_name ||
            `${u.user_first_name || ""} ${u.user_last_name || ""}`.trim() ||
            u.user_name ||
            "";
          const deps = Array.isArray(u.departments) ? u.departments : [];
          if (deps.length === 0) {
            const dName = "Unassigned";
            if (!deptMap.has(dName))
              deptMap.set(dName, { id: "unassigned", name: dName, subs: new Map() });
            const dept = deptMap.get(dName);
            const sName = "General";
            if (!dept.subs.has(sName))
              dept.subs.set(sName, { id: "general", name: sName, users: [] });
            dept.subs
              .get(sName)
              .users.push({ user_id: uid, user_name: uname, user_full_name: full });
            continue;
          }
          for (const d of deps) {
            const dName = d.department_name || "Unknown";
            const dId = String(d.department_id || dName);
            const sName = d.sub_department_name || "General";
            const sId = String(d.sub_department_id ?? sName);
            if (!deptMap.has(dName))
              deptMap.set(dName, { id: dId, name: dName, subs: new Map() });
            const dept = deptMap.get(dName);
            if (!dept.subs.has(sName))
              dept.subs.set(sName, { id: sId, name: sName, users: [] });
            dept.subs
              .get(sName)
              .users.push({ user_id: uid, user_name: uname, user_full_name: full });
          }
        }
        const tree = Array.from(deptMap.values())
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
          .map((d) => ({
            id: d.id,
            name: d.name,
            subDepartments: Array.from(d.subs.values())
              .sort((a, b) => String(a.name).localeCompare(String(b.name)))
              .map((s) => ({
                ...s,
                users: (s.users || [])
                  .slice()
                  .sort((a, b) =>
                    String(a.user_full_name).localeCompare(String(b.user_full_name))
                  ),
              })),
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
    return () => {
      mounted = false;
    };
  }, [departments]);

  const renderDepartmentLocal = ({ item: dept }) => (
    <TouchableOpacity
      key={dept.id}
      onPress={() => {
        setSelectedDept(dept);
        setViewLevel("sub");
      }}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${theme.colors.primary}12`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Building2 size={18} color={theme.colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
        {dept.name}
      </Text>
      <ChevronRight size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderSubDepartmentLocal = ({ item: sub }) => (
    <TouchableOpacity
      key={sub.id}
      onPress={() => {
        setSelectedSub(sub);
        setViewLevel("users");
      }}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: `${theme.colors.secondary}12`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Users size={18} color={theme.colors.secondary} strokeWidth={1.8} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
        {sub.name}
      </Text>
      <ChevronRight size={18} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderUsersLocal = ({ item: u }) => {
    const selected = isUserSelected(u.user_id);
    return (
      <TouchableOpacity
        key={u.user_id}
        onPress={() => toggleUser(u)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: 14,
          backgroundColor: selected ? `${theme.colors.primary}08` : theme.colors.card,
          borderWidth: 1.5,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: selected ? theme.colors.primary : theme.colors.border,
            backgroundColor: selected ? theme.colors.primary : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {selected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
            {u.user_full_name}
          </Text>
          {!!u.user_name && (
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
              @{u.user_name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const useLocal = !renderDepartment || !Array.isArray(departments) || departments.length === 0;
  const dataSource = useLocal ? deptTree : departments;
  const renderer = useLocal
    ? viewLevel === "dept"
      ? renderDepartmentLocal
      : viewLevel === "sub"
        ? renderSubDepartmentLocal
        : renderUsersLocal
    : renderDepartment;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
    >
      <View style={styles.tabContent}>
        {/* ─── Section Header ─── */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: `${theme.colors.meeting}15`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Users size={16} color={theme.colors.meeting} strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>
            Assign Team Members
          </Text>
        </View>

        {/* ─── Search ─── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.muted100,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 4,
            marginBottom: 14,
          }}
        >
          <Search size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.text,
              paddingVertical: 10,
            }}
            placeholder="Search team members..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── List Area ─── */}
        <ScrollView nestedScrollEnabled style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}>
          {searchQuery ? (
            <>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: theme.colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Search Results ({searchedUsers.length})
              </Text>
              {searchedUsers.map((u) => {
                const selected = isUserSelected(u.user_id);
                return (
                  <TouchableOpacity
                    key={u.user_id}
                    onPress={() => toggleUser(u)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderRadius: 14,
                      backgroundColor: selected ? `${theme.colors.primary}08` : theme.colors.card,
                      borderWidth: 1.5,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        borderWidth: 2,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected ? theme.colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
                        {u.user_full_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                        @{u.user_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <>
              {/* ─── Breadcrumb + Back ─── */}
              {useLocal && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>
                    {viewLevel === "dept"
                      ? "Departments"
                      : viewLevel === "sub"
                        ? selectedDept?.name || "Sub-Departments"
                        : selectedSub?.name || "Users"}
                  </Text>
                  {viewLevel !== "dept" && (
                    <TouchableOpacity
                      onPress={() => {
                        if (viewLevel === "users") {
                          setViewLevel("sub");
                          setSelectedSub(null);
                        } else if (viewLevel === "sub") {
                          setViewLevel("dept");
                          setSelectedDept(null);
                        }
                      }}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: `${theme.colors.primary}12`,
                      }}
                    >
                      <ArrowLeft size={14} color={theme.colors.primary} strokeWidth={2} />
                      <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 13 }}>
                        Back
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {error ? (
                <View
                  style={{
                    padding: 20,
                    borderRadius: 14,
                    backgroundColor: `${theme.colors.error}10`,
                    borderWidth: 1,
                    borderColor: `${theme.colors.error}25`,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, color: theme.colors.error, fontWeight: "600" }}>
                    {error}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={
                    useLocal
                      ? viewLevel === "dept"
                        ? dataSource
                        : viewLevel === "sub"
                          ? selectedDept?.subDepartments || []
                          : selectedSub?.users || []
                      : dataSource
                  }
                  keyExtractor={(item) => String(item.id || item.user_id)}
                  renderItem={renderer}
                  ListEmptyComponent={
                    <View
                      style={{
                        padding: 20,
                        borderRadius: 14,
                        backgroundColor: theme.colors.muted100,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: "500" }}>
                        {loading ? "Loading..." : "No items"}
                      </Text>
                    </View>
                  }
                />
              )}
            </>
          )}
        </ScrollView>

        {/* ─── Selected Members ─── */}
        <View style={{ marginTop: 16 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: theme.colors.textSecondary,
              marginBottom: 10,
            }}
          >
            Selected ({formData.teamMembers.length})
          </Text>

          {formData.teamMembers.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                textAlign: "center",
                paddingVertical: 10,
                fontWeight: "500",
              }}
            >
              No members selected
            </Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {formData.teamMembers.map((m) => (
                <View
                  key={m.user_id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: `${theme.colors.primary}12`,
                    paddingLeft: 4,
                    paddingRight: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: `${theme.colors.primary}25`,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: theme.colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
                      {m.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.text }}>
                    {m.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      removeTeamMember ? removeTeamMember(m.user_id) : toggleUser(m)
                    }
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={14} color={theme.colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Footer Buttons ─── */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: "auto", paddingTop: 20 }}>
          <TouchableOpacity
            onPress={() => setActiveTab("details")}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card,
            }}
          >
            <ChevronLeft size={18} color={theme.colors.text} strokeWidth={2} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text }}>
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("attachments")}
            disabled={isSubmitting}
            activeOpacity={0.8}
            style={{
              flex: 1.5,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: theme.colors.primary,
              opacity: isSubmitting ? 0.5 : 1,
              shadowColor: theme.colors.primary,
              shadowOpacity: isSubmitting ? 0 : 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: isSubmitting ? 0 : 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.2 }}>
              Next: Attachments
            </Text>
            <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
