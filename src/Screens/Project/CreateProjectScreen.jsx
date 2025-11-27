import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Alert, Dimensions, Animated, Platform, ScrollView } from "react-native";
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../Themes/Themes";
import ProjectStepper from "../../Components/Projects/ProjectTabs/ProjectStepper";
import ProjectDetailsTab from "../../Components/Projects/ProjectTabs/ProjectDetailsTab";
import ProjectTeamAndDatesTab from "../../Components/Projects/ProjectTabs/ProjectTeamAndDatesTab";
import ProjectAttachmentsTab from "../../Components/Projects/ProjectTabs/ProjectAttachmentsTab";
import { CircleDot, Calendar as CalendarIcon, Clock as ClockIcon, Rocket, Pause, Eye, Search, RefreshCw, XCircle, CheckCircle2, Flag, Archive, GitPullRequestDraft, AlertTriangle, Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createOrUpdateProject, addProjectAssignees, addProjectDocument, addProjectLink } from "../../Services/Project/createProject";
import { getProjectAssignedUsers } from "../../Services/Project/FetchprojectUsers";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const COLOR_PALETTE = [
  theme.colors.primary,
  theme.colors.secondary,
  theme.colors.project,
  theme.colors.task,
  theme.colors.meeting,
  theme.colors.event,
  theme.colors.timesheet,
  theme.colors.ticket,
  theme.colors.success,
  theme.colors.error,
  theme.colors.projectSoft,
  theme.colors.taskSoft,
  theme.colors.meetingSoft,
  theme.colors.eventSoft,
  theme.colors.sectionBg,
  theme.colors.muted100,
  theme.colors.muted200,
];

const STATUS_OPTIONS = [
  { label: "Not Started", value: "not_started" },
  { label: "Planned", value: "planned" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "On Hold", value: "on_hold" },
];

const getStatusIcon = (status, size = 16, color = "currentColor") => {
  const iconProps = { size, color, style: { marginRight: 8 } };
  const icons = {
    not_started: <CircleDot {...iconProps} />,
    planned: <CalendarIcon {...iconProps} />,
    scheduled: <ClockIcon {...iconProps} />,
    in_progress: <Rocket {...iconProps} />,
    on_hold: <Pause {...iconProps} />,
    awaiting_review: <Eye {...iconProps} />,
    in_review: <Search {...iconProps} />,
    reopened: <RefreshCw {...iconProps} />,
    rejected: <XCircle {...iconProps} />,
    approved: <CheckCircle2 {...iconProps} />,
    completed: <Flag {...iconProps} />,
    cancelled: <XCircle {...iconProps} />,
    archived: <Archive {...iconProps} />,
    deferred: <GitPullRequestDraft {...iconProps} />,
    failed: <AlertTriangle {...iconProps} />,
  };
  return icons[status] || <CircleDot {...iconProps} />;
};

const getStatusColor = (status) => {
  const colors = {
    not_started: theme.colors.textSecondary,
    planned: theme.colors.primary,
    scheduled: theme.colors.primary,
    in_progress: theme.colors.secondary,
    on_hold: theme.colors.textSecondary,
  };
  return colors[status] || theme.colors.textSecondary;
};

export default function CreateProjectScreen({ navigation, route }) {
  const [step, setStep] = useState(1); // 1: Details, 2: Team, 3: Attachments
  const isMounted = useRef(true);

  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    status: "not_started",
    priority: "not_urgent_not_important",
    projectColor: theme.colors.primary,
    startDate: null,
    endDate: null,
    dueTime: null,
    remarks: "",
    teamMembers: [],
    links: [],
    attachments: [],
    linkUrl: "",
    linkTitle: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);

  // UI state reused by tabs
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => () => { isMounted.current = false; }, []);

  // Initialize from route params if in edit mode
  useEffect(() => {
    try {
      const params = route?.params || {};
      const mode = params?.mode;
      const project = params?.project || null;
      const projectId = params?.projectId || project?.id || project?._id || project?.project_id || project?.projectId || null;
      const isEdit = String(mode || '').toLowerCase() === 'edit' && !!projectId;
      setIsEditMode(isEdit);
      setEditProjectId(isEdit ? String(projectId) : null);
      if (isEdit && project) {
        const parseDate = (v) => {
          if (!v) return null;
          try {
            const d = new Date(v);
            return isNaN(d.getTime()) ? null : d;
          } catch { return null; }
        };
        const parseTime = (t) => {
          if (!t || typeof t !== 'string') return null;
          const m = t.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
          if (!m) return null;
          const hh = parseInt(m[1], 10) || 0;
          const mm = parseInt(m[2], 10) || 0;
          const ss = parseInt(m[3] || '0', 10) || 0;
          const base = new Date();
          base.setHours(hh, mm, ss, 0);
          return base;
        };
        setFormData((prev) => ({
          ...prev,
          projectName: project.name || project.title || '',
          description: project.description || '',
          status: String(project.status || 'planned').toLowerCase(),
          priority: String(project.priority || 'not_urgent_not_important').toLowerCase().replace(/\s*&\s*/g, '_').replace(/\s+/g, '_'),
          projectColor: project.color || prev.projectColor,
          startDate: parseDate(project.start_date || project.startDate || project.created_at) || prev.startDate,
          endDate: parseDate(project.end_date || project.endDate) || prev.endDate,
          dueTime: parseTime(project.due_time || project.dueTime),
          remarks: project.remarks || '',
        }));

        // Fetch and prefill team members (assignees)
        (async () => {
          try {
            const res = await getProjectAssignedUsers(String(projectId));
            if (res?.success && Array.isArray(res.data)) {
              const mapped = res.data.map((u) => ({
                user_id: String(u.user_id || u.id || ''),
                user_name: u.user_name || u.username || '',
                name:
                  u.user_full_name ||
                  `${u.user_first_name || ''} ${u.user_last_name || ''}`.trim() ||
                  u.user_name ||
                  '',
                department_id: u.department_id ?? null,
                sub_department_id: u.sub_department_id ?? null,
              })).filter(m => m.user_id);
              setFormData((prev2) => ({ ...prev2, teamMembers: mapped }));
            }
          } catch (_) {
            // ignore
          }
        })();
      }
    } catch {}
  }, [route?.params]);

  const toggleColorPicker = () => {
    if (showColorPicker) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }),
      ]).start(() => setShowColorPicker(false));
    } else {
      setShowColorPicker(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
  };

  // Team tab minimal plumbing
  const [searchQuery, setSearchQuery] = useState("");
  const searchedUsers = useMemo(() => [], []);
  const departments = useMemo(() => [], []);
  const isUserSelected = (userId) => formData.teamMembers.some(u => String(u.user_id) === String(userId));
  const toggleUser = (user) => {
    const norm = {
      user_id: String(user.user_id || user.id || ""),
      user_name: user.user_name || user.username || "",
      name: user.user_full_name || `${user.user_first_name || ""} ${user.user_last_name || ""}`.trim() || user.user_name || "",
      department_id: user.department_id,
      sub_department_id: user.sub_department_id,
    };
    setFormData(prev => {
      const exists = prev.teamMembers.some(u => String(u.user_id) === String(norm.user_id));
      if (exists) {
        return { ...prev, teamMembers: prev.teamMembers.filter(u => String(u.user_id) !== String(norm.user_id)) };
      }
      return { ...prev, teamMembers: [...prev.teamMembers, norm] };
    });
  };
  const removeTeamMember = (userId) => {
    setFormData(prev => ({ ...prev, teamMembers: prev.teamMembers.filter(u => String(u.user_id) !== String(userId)) }));
  };
  const renderDepartment = () => null; // placeholder; can be wired to your org data later

  // Attachments tab minimal handlers
  const addLink = () => {
    const rawUrl = (formData.linkUrl || "").trim();
    const title = (formData.linkTitle || "").trim();
    if (!rawUrl || !title) return Alert.alert("Error", "URL and Title required");
    let url = rawUrl;
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url)) url = `https://${url}`;
    setFormData(prev => ({ ...prev, links: [...prev.links, { id: Date.now().toString(), url, title }], linkUrl: "", linkTitle: "" }));
  };
  const removeLink = (i) => setFormData(prev => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }));
  const removeAttachment = (i) => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, idx) => idx !== i) }));
  const onAddImagesPress = () => {
    // Show friendly modal first (already implemented in ProjectAttachmentsTab)
    setShowPermissionModal(true);
  };
  const handleFilePick = () => {
    try {
      launchImageLibrary({ mediaType: 'mixed', selectionLimit: 0 }, (response) => {
        if (response?.didCancel || response?.errorCode) return;
        const picked = (response?.assets || []).map((a) => ({
          id: String(Date.now()) + Math.random(),
          name: a.fileName || 'file',
          uri: a.uri,
          type: a.type || 'application/octet-stream',
          size: a.fileSize || 0,
        }));
        if (picked.length > 0) {
          setFormData((prev) => ({ ...prev, attachments: [ ...(prev.attachments || []), ...picked ] }));
        }
      });
    } catch (e) {
      Alert.alert('Attachment Error', e?.message || 'Failed to pick files');
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const userInfoRaw = await AsyncStorage.getItem("userInfo");
      const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      const organizationId = (await AsyncStorage.getItem("organization_id")) || userInfo?.organization_id || "one";
      const storedUid1 = await AsyncStorage.getItem("user_id");
      const storedUid2 = await AsyncStorage.getItem("userId");
      const currentUserId = storedUid1 || storedUid2 || userInfo?.user_id || null;
      const assignedBy = userInfo?.username || userInfo?.user_name || null;

      // 1) Create or Update project
      const result = await createOrUpdateProject(formData, organizationId, currentUserId, isEditMode ? editProjectId : null);
      if (!result?.success) throw new Error(result?.message || "Failed to save project");

      // Extract projectId from response (fallback to existing id in edit mode)
      const resData = result.data || {};
      let projectId = resData?.project_id || resData?.id || resData?.data?.project_id || resData?.data?.id;
      if (!projectId && isEditMode && editProjectId) {
        projectId = String(editProjectId);
      }
      if (!projectId) throw new Error("Project created but id not returned by API");

      // 2) Assign users (if any) — backend expects assigned_by to reference user_id (FK)
      const userIds = (formData.teamMembers || []).map(m => String(m.user_id)).filter(Boolean);
      if (userIds.length > 0 && currentUserId) {
        const assignRes = await addProjectAssignees(String(projectId), userIds, String(currentUserId));
        if (!assignRes?.success) {
          console.warn("Assign users failed:", assignRes?.error || assignRes);
        }
      } else if (userIds.length > 0) {
        console.warn("Skipping assignee API due to missing currentUserId (assigned_by)");
      }

      // 3) Upload attachments (if any)
      if (Array.isArray(formData.attachments) && currentUserId) {
        for (const file of formData.attachments) {
          try { await addProjectDocument(String(projectId), file, String(currentUserId || "")); } catch (e) { console.warn("addProjectDocument failed", e?.message || e); }
        }
      } else if (Array.isArray(formData.attachments) && !currentUserId) {
        console.warn("Skipping document upload due to missing user_id");
      }

      // 4) Add links (if any)
      if (Array.isArray(formData.links) && currentUserId) {
        for (const link of formData.links) {
          try { await addProjectLink(String(projectId), link?.title || link?.link_title || "", link?.url || link?.link_url || "", String(currentUserId || "")); } catch (e) { console.warn("addProjectLink failed", e?.message || e); }
        }
      } else if (Array.isArray(formData.links) && !currentUserId) {
        console.warn("Skipping link add due to missing user_id");
      }

      Alert.alert("Success", isEditMode ? "Project updated successfully" : "Project created successfully");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.message || (isEditMode ? "Failed to update project" : "Failed to create project"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = useMemo(() => createStyles(), []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ProjectStepper currentStep={step} title={isEditMode ? "Edit Project" : "Create New Project"} />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {step === 1 && (
          <ProjectDetailsTab
            styles={styles}
            formData={formData}
            setFormData={setFormData}
            statusOpen={statusOpen}
            setStatusOpen={setStatusOpen}
            STATUS_OPTIONS={STATUS_OPTIONS}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            showColorPicker={showColorPicker}
            toggleColorPicker={toggleColorPicker}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            CheckIcon={Check}
            COLOR_PALETTE={COLOR_PALETTE}
            priorityOpen={priorityOpen}
            setPriorityOpen={setPriorityOpen}
            showStartDatePicker={showStartDatePicker}
            setShowStartDatePicker={setShowStartDatePicker}
            showEndDatePicker={showEndDatePicker}
            setShowEndDatePicker={setShowEndDatePicker}
            showDueTimePicker={showDueTimePicker}
            setShowDueTimePicker={setShowDueTimePicker}
            isMounted={isMounted}
            setActiveTab={() => setStep(2)}
            isSubmitting={isSubmitting}
            navigation={navigation}
          />
        )}
        {step === 2 && (
          <ProjectTeamAndDatesTab
            styles={styles}
            SCREEN_HEIGHT={SCREEN_HEIGHT}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchedUsers={searchedUsers}
            toggleUser={toggleUser}
            isUserSelected={isUserSelected}
            removeTeamMember={removeTeamMember}
            departments={departments}
            renderDepartment={renderDepartment}
            formData={formData}
            setActiveTab={(tab) => {
              if (tab === 'details') setStep(1);
              else if (tab === 'attachments') setStep(3);
              else setStep(2);
            }}
            isSubmitting={isSubmitting}
          />
        )}
        {step === 3 && (
          <ProjectAttachmentsTab
            styles={styles}
            formData={formData}
            setFormData={setFormData}
            addLink={addLink}
            removeLink={removeLink}
            removeAttachment={removeAttachment}
            onAddImagesPress={onAddImagesPress}
            showPermissionModal={showPermissionModal}
            setShowPermissionModal={setShowPermissionModal}
            handleFilePick={handleFilePick}
            handleSave={handleSave}
            isSubmitting={isSubmitting}
            isEditMode={isEditMode}
            setActiveTab={() => setStep(2)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles() {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    body: { flex: 1 },
    bodyContent: { padding: 16, paddingBottom: 24 },
    // Shared styles expected by tabs (subset)
    tabContent: { paddingTop: 8 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: theme.colors.text },
    input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.colors.background },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", marginBottom: 16 },
    dropdown: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12 },
    colorPickerButton: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12 },
    selectedColorPreview: { width: 24, height: 24, borderRadius: 12, marginRight: 12 },
    colorPickerText: { flex: 1, fontSize: 15 },
    modalOverlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: "center", alignItems: "center" },
    colorPickerContainer: { width: "90%", backgroundColor: theme.colors.background, borderRadius: 12, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 16 },
    dateInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12 },
    dateText: { marginLeft: 8, fontSize: 16 },
    timeInput: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12 },
    timeText: { marginLeft: 8, fontSize: 16 },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
    cancelButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.colors.muted100, alignItems: "center", marginRight: 8 },
    nextButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: "center", marginLeft: 8 },
    backButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.colors.muted100, alignItems: "center", marginRight: 8 },
    createButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.colors.primary, alignItems: "center", marginLeft: 8 },
    disabledButton: { opacity: 0.6 },
    buttonText: { color: theme.colors.white, fontWeight: "600" },
    sectionTitle: { fontSize: 16, fontWeight: "600", marginVertical: 12, color: theme.colors.text },
    searchInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: theme.colors.background },
    noMembersText: { textAlign: "center", color: theme.colors.textSecondary, padding: 10 },
    selectedMembersContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
    selectedMemberChip: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.sectionBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
    memberAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center", marginRight: 8 },
    memberAvatarText: { color: theme.colors.white, fontSize: 10, fontWeight: "bold" },
    selectedMemberName: { fontSize: 14, color: theme.colors.text },
    linkItem: { flexDirection: "row", padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, marginBottom: 8 },
    linkInfo: { flex: 1 },
    linkTitle: { fontWeight: "600" },
    linkUrl: { fontSize: 12, color: theme.colors.textSecondary },
    linkInputRow: { flexDirection: "row", marginBottom: 12 },
    addLinkButton: { padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 16, backgroundColor: theme.colors.project },
    addLinkText: { color: theme.colors.white, fontWeight: "600" },
    attachmentsContainer: { marginBottom: 16 },
    attachmentItem: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, marginBottom: 8, backgroundColor: theme.colors.background },
    attachmentInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
    attachmentThumbnail: { width: 40, height: 40, borderRadius: 6, marginLeft: 8 },
    attachmentName: { marginLeft: 8, flex: 1 },
    addFilesButton: { flexDirection: "row", padding: 12, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 32, backgroundColor: theme.colors.primary },
    addFilesText: { color: theme.colors.white, marginLeft: 8, fontWeight: "600" },
  });
}

