// Services/createProject.js

import {
  addProjectAssignees as addProjectAssigneesAPI,
  addProjectDocument as addProjectDocumentAPI,
  addProjectLink as addProjectLinkAPI,
  shareProject as shareProjectAPI,
} from "../../Utils/apiUtils";
import { updateProjectApi as updateProjectAPI, removeProjectAssignee as removeProjectAssigneeAPI } from "./projectService";
import { createProjectApi } from "./FetchprojectUsers";
import { getProjectAssignedUsers } from "./FetchprojectUsers";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Creates or updates a project by sending all form data to the backend.
 * 
 * @param {Object} formData - All form fields from ProjectScreen
 * @param {string} organizationId - Current organization ID
 * @param {string} currentUserId - Current logged-in user ID
 * @param {string} [projectId] - Project ID if editing (optional)
 * @returns {Promise<{success: boolean, data?: any, message?: string}>}
 */
export const createOrUpdateProject = async (
  formData,
  organizationId,
  currentUserId,
  projectId = null
) => {
  const isEditMode = !!projectId;

  // Validate required fields
  if (!formData.projectName?.trim()) {
    console.warn("Validation failed: Project name is required");
    return { success: false, message: "Project name is required" };
  }

  // Require explicit user selection for dates and time
  if (!formData.startDate || !formData.endDate) {
    console.warn("Validation failed: Start and end dates are required");
    return { success: false, message: "Please select start and end dates" };
  }
  if (!formData.dueTime) {
    console.warn("Validation failed: Due time is required");
    return { success: false, message: "Please select due time" };
  }

  if (formData.startDate > formData.endDate) {
    console.warn("Validation failed: End date cannot be before start date");
    return { success: false, message: "End date cannot be before start date" };
  }

  // Format helpers
  const toYmd = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${da}`;
  };

  // Map UI statuses to DB allowed enum: planned, in_progress, completed, cancelled
  const mapStatusForApi = (s) => {
    const v = String(s || "").toLowerCase();
    const toCompleted = new Set([
      "completed",
      "approved",
      "in_review",
      "awaiting_review",
    ]);
    const toCancelled = new Set([
      "cancelled",
      "rejected",
      "failed",
    ]);
    const toInProgress = new Set([
      "in_progress",
      "scheduled",
      "reopened",
      "deferred",
      "blocked",
      "on_hold",
      "pending",
    ]);
    if (toCompleted.has(v)) return "completed";
    if (toCancelled.has(v)) return "cancelled";
    if (toInProgress.has(v)) return "in_progress";
    return "planned"; // default for not_started/planned/others
  };
  const toHms = (d) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  // Prepare payload exactly as backend expects
  const mapPriorityForApi = (p) => {
    const v = String(p || "").toLowerCase();
    const map = {
      urgent_important: "urgent & important",
      urgent_not_important: "urgent & not important",
      not_urgent_important: "not urgent & important",
      not_urgent_not_important: "not urgent & not important",
    };
    return map[v] || v;
  };

  // Derive assigned_by fields (backend requires assigned_by to reference user_data.user_name)
  let assignedByUserId = currentUserId || null;
  let assignedByName = null;
  try {
    const userInfoString = await AsyncStorage.getItem("userInfo");
    const parsed = userInfoString ? JSON.parse(userInfoString) : null;
    const storedUserId1 = await AsyncStorage.getItem("userId");
    const storedUserId2 = await AsyncStorage.getItem("user_id");
    assignedByUserId = assignedByUserId || storedUserId2 || storedUserId1 || parsed?.user_id || null;
    assignedByName = parsed?.username || parsed?.user_name || null;
  } catch (e) {
    // ignore storage errors; fallback handled below
  }
  // Require a valid username for assigned_by (FK enforces user_name)
  if (!assignedByName) {
    return {
      success: false,
      message: "Unable to resolve your username (user_name) for assigned_by. Please re-login and try again.",
    };
  }
  // created_by must be a valid backend user_id
  if (!assignedByUserId) {
    return {
      success: false,
      message: "Unable to resolve your user_id (created_by). Please re-login and try again.",
    };
  }

  const cleanAssignees = Array.isArray(formData.teamMembers)
    ? formData.teamMembers
        .map((m) => m?.user_id || m?.id || null)
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
    : [];

  // Project-level department/sub-department if all selected members share same values
  const deptIds = Array.isArray(formData.teamMembers)
    ? formData.teamMembers.map((m) => m?.department_id).filter(Boolean)
    : [];
  const subDeptIds = Array.isArray(formData.teamMembers)
    ? formData.teamMembers.map((m) => m?.sub_department_id).filter(Boolean)
    : [];
  const uniqueDept = new Set(deptIds);
  const uniqueSub = new Set(subDeptIds);
  let projectDepartmentId = uniqueDept.size === 1 && deptIds.length > 0 ? String(deptIds[0]) : null;
  let projectSubDepartmentId = uniqueSub.size === 1 && subDeptIds.length > 0 ? String(subDeptIds[0]) : null;
  // If mixed, default to the first selected values to avoid nulls
  if (!projectDepartmentId && deptIds.length > 0) projectDepartmentId = String(deptIds[0]);
  if (!projectSubDepartmentId && subDeptIds.length > 0) projectSubDepartmentId = String(subDeptIds[0]);

  console.log("[createProject] resolved identifiers:", { assignedByUserId, assignedByName, organizationId });

  const payload = {
    name: formData.projectName.trim(),
    description: formData.description?.trim() || "",
    status: mapStatusForApi(formData.status),
    priority: mapPriorityForApi(formData.priority),
    color: formData.projectColor,
    start_date: toYmd(formData.startDate),
    end_date: toYmd(formData.endDate),
    due_time: toHms(formData.dueTime),
    // Some backends expect due_date as a separate field
    due_date: toYmd(formData.endDate),
    remarks: formData.remarks?.trim() || "",
    organization_id: organizationId,
    created_by: assignedByUserId,
    // Some backends expect user_id in request context; include explicitly
    user_id: assignedByUserId,
    assigned_by: assignedByName,
    // Force NULL to avoid FK violations if local user_id is not guaranteed to exist in backend
    assigned_by_user_id: null,

    // Arrays – will be stringified in saveProject()
    assignees: cleanAssignees,
    // Some backends expect `assigned_users` instead of `assignees`
    assigned_users: cleanAssignees,
    links: formData.links,
    documents: formData.attachments, // raw file objects from image picker
    // Project-level department ids if consistent
    department_id: projectDepartmentId,
    sub_department_id: projectSubDepartmentId,
  };

  // Alias fields commonly expected by backend
  payload.title = payload.title || payload.name;
  payload.project_title = payload.project_title || payload.name;
  payload.project_name = payload.project_name || payload.name;
  payload.project_description = payload.project_description || payload.description;

  // Add project_id only if editing
  if (isEditMode) {
    payload.project_id = projectId;
  }

  console.log(`Sending project ${isEditMode ? "update" : "create"} payload:`, payload);

  try {
    const result = isEditMode
      ? await updateProjectAPI(String(projectId), payload)
      : await createProjectApi(payload, false);

    if (result.success) {
      console.log(`Project ${isEditMode ? "updated" : "created"} successfully:`, result.data);
      // When editing, sync assignees to match current selection (add new, remove deselected)
      if (isEditMode) {
        try {
          const current = await getProjectAssignedUsers(String(projectId));
          const serverIds = new Set(
            (Array.isArray(current?.data) ? current.data : []).map(u => String(u.user_id || u.id || ""))
          );
          const selectedIds = new Set((formData.teamMembers || []).map(m => String(m.user_id)).filter(Boolean));

          const toAdd = Array.from(selectedIds).filter(id => !serverIds.has(id));
          const toRemove = Array.from(serverIds).filter(id => !selectedIds.has(id));

          if (toAdd.length > 0 && currentUserId) {
            try { await addProjectAssigneesAPI(String(projectId), toAdd, String(currentUserId)); } catch (e) { console.warn("addProjectAssignees (diff) failed", e?.message || e); }
          }
          for (const rid of toRemove) {
            try { await removeProjectAssigneeAPI(String(projectId), String(rid)); } catch (e) { console.warn("removeProjectAssignee failed", e?.message || e); }
          }
        } catch (e) {
          console.warn("Assignee sync failed", e?.message || e);
        }
      }
      return {
        success: true,
        data: result.data,
        message: result.message || `Project ${isEditMode ? "updated" : "created"} successfully!`,
      };
    } else {
      console.error("API returned failure:", result);
      return {
        success: false,
        message: result.message || "Failed to save project",
      };
    }
  } catch (error) {
    console.error("Unexpected error in createOrUpdateProject:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
  }
};

// ──────────────────────────────────────────────────────────────
// Re-export helpers so screens can import from a single place
// ──────────────────────────────────────────────────────────────
export const addProjectAssignees = addProjectAssigneesAPI;
export const addProjectDocument = addProjectDocumentAPI;
export const addProjectLink = addProjectLinkAPI;
export const shareProject = shareProjectAPI;