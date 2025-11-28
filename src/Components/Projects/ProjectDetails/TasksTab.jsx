import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../../Themes/Themes';
import {
  fetchTasksByProject,
  updateTaskStatus,
  shareTask,
  forwardTask,
  collaborateTask,
} from '../../../Services/Project/FetchProjectTask';
import CollaborateTasks from './CollaborateTasks';
import ShareTasks from './ShareTasks';
import ForwardTasks from './ForwardTasks';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  PauseCircle,
  X as XIcon,
  UserMinus,
  UserCheck,
  ArrowLeft,
  ChevronLeft,
  Eye,
  FileText,
  Share2,
  CornerUpRight,
  UserPlus,
  Plus,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { fetchProjectTaskLogs } from '../../../Utils/apiUtils';

const statusColors = {
  in_progress: theme.colors.secondary,
  approved: theme.colors.success,
  completed: theme.colors.primary,
  pending: theme.colors.task,
  on_hold: theme.colors.textSecondary,
  cancelled: theme.colors.error,
  untaken: theme.colors.textSecondary,
  taken: theme.colors.primary,
};
const getStatusColor = (status = '') => {
  const key = String(status).toLowerCase();
  return statusColors[key] || theme.colors.primary;
};

function TaskItem({ item, onPress }) {
  const statusColor = getStatusColor(item.status);
  return (
    <TouchableOpacity
      style={[styles.projectCard, styles.shadow]}
      activeOpacity={0.9}
      onPress={() => onPress?.(item)}
    >
      <View style={[styles.leftStripe, { backgroundColor: statusColor }]} />
      <View style={styles.cardBody}>
        {!!item.title && (
          <View style={styles.topRow}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add"
              style={styles.itemPlusButton}
              onPress={() => {
                try {
                  Toast.show({
                    type: 'custom_success',
                    text1: 'Add action',
                    text2: 'Implement item add handler',
                    position: 'bottom',
                    visibilityTime: 1000,
                  });
                } catch {}
              }}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Plus size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        {!!item.project_name && (
          <Text style={styles.metaText} numberOfLines={1}>
            {item.project_name}
          </Text>
        )}
        {!!item.creator_full_name && (
          <Text style={styles.metaText} numberOfLines={1}>
            Created by{' '}
            <Text style={styles.boldText}>{item.creator_full_name}</Text>
          </Text>
        )}
        {!!item.assignee_names && (
          <Text style={styles.metaText} numberOfLines={1}>
            Assignees: {item.assignee_names}
          </Text>
        )}
        <View style={styles.bottomRow}>
          <View />
          <View
            style={[
              styles.statusSoft,
              { backgroundColor: `${statusColor}20` },
            ]}
          >
            <Text style={[styles.statusSoftText, { color: statusColor }]}>
              {String(item.status || '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TasksTab({ organizationId: orgIdProp, projectId }) {
  const route = useRoute();
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(true);
  const [tasks, setTasks] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [debug, setDebug] = React.useState({
    organizationId: '',
    projectId: '',
    userId: '',
    total: 0,
  });
  const [orgId, setOrgId] = React.useState('');
  const [statusModalOpen, setStatusModalOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [remarks, setRemarks] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [logsModalOpen, setLogsModalOpen] = React.useState(false);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [logs, setLogs] = React.useState([]);
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [forwardOpen, setForwardOpen] = React.useState(false);
  const [collaborateOpen, setCollaborateOpen] = React.useState(false);

  const statusOptions = React.useMemo(
    () => [
      { label: 'Not Started', value: 'not_started' },
      { label: 'In Progress', value: 'in_progress' },
      { label: 'Completed', value: 'completed' },
      { label: 'Pending', value: 'pending' },
      { label: 'On Hold', value: 'on_hold', Icon: PauseCircle },
      { label: 'Cancelled', value: 'cancelled', Icon: XIcon },
      { label: 'Untaken', value: 'untaken', Icon: UserMinus },
      { label: 'Taken', value: 'taken', Icon: UserCheck },
    ],
    [],
  );

  const openStatusModal = task => {
    setSelectedTask(task);
    const current = String(task?.status || '').toLowerCase();
    setSelectedStatus(current);
    setRemarks('');
    setStatusModalOpen(true);
  };

  const openActions = task => {
    setSelectedTask(task);
    setActionsOpen(true);
  };

  const openLogs = async task => {
    try {
      setSelectedTask(task);
      setLogsModalOpen(true);
      setLogsLoading(true);
      const pid = task?.project_id;
      if (pid) {
        const data = await fetchProjectTaskLogs(pid);
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.logs)
          ? data.logs
          : [];
        setLogs(arr);
      } else {
        setLogs([]);
      }
    } catch (e) {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const load = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const storedUserId = (await AsyncStorage.getItem('userId')) || '';
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      let parsedInfo = null;
      try {
        parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
      } catch {}

      const userId = storedUserId || String(parsedInfo?.user_id || '');
      const organizationId =
        orgIdProp || String(parsedInfo?.organization_id || 'one');
      setOrgId(organizationId);

      const effectiveProjectId =
        projectId ||
        route?.params?.projectId ||
        route?.params?.project?.project_id ||
        route?.params?.project?.id;

      const projectList = await fetchTasksByProject(
        organizationId,
        effectiveProjectId,
      );
      setDebug({
        organizationId,
        projectId: String(effectiveProjectId || ''),
        userId: String(userId || ''),
        total: Array.isArray(projectList) ? projectList.length : 0,
      });

      if (!userId) {
        setTasks([]);
      } else {
        const uid = String(userId).trim();
        const filtered = (Array.isArray(projectList) ? projectList : []).filter(
          t => {
            const assignees = (t.assignee_ids || '')
              .toString()
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            return assignees.includes(uid);
          },
        );
        setTasks(filtered);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [orgIdProp, projectId, route?.params?.projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Back Button and Title */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {!!route?.params?.project?.project_name && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {route.params.project.project_name}
              </Text>
            )}
          </View>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={item =>
            String(item.task_id || item.id || item._id)
          }
          renderItem={({ item }) => (
            <TaskItem
              item={item}
              onPress={openActions}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {loading
                  ? 'Loading tasks...'
                  : error
                  ? error
                  : 'Task not found.'}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                try {
                  setRefreshing(true);
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={[
            tasks.length === 0 ? { flex: 1 } : {},
            { paddingHorizontal: 12, paddingBottom: 60, paddingTop: 8 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          style={{ flex: 1 }}
        />

        {/* Status Update Modal */}
        <Modal
          visible={statusModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setStatusModalOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalSheet}
            >
              <View style={styles.modalHandle} />
              {!!selectedTask?.title && (
                <Text style={styles.modalTaskTitle} numberOfLines={1}>
                  {selectedTask.title}
                </Text>
              )}
              <Text style={styles.modalTitle}>New Status</Text>

              <View style={{ gap: 10 }}>
                {statusOptions.map(opt => {
                  const active = selectedStatus === opt.value;
                  const color = getStatusColor(opt.value);
                  const Icon = opt.Icon;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.statusRow,
                        active && {
                          borderColor: color,
                          backgroundColor: `${color}10`,
                        },
                      ]}
                      onPress={() => setSelectedStatus(opt.value)}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: active
                              ? color
                              : theme.colors.border,
                          },
                        ]}
                      >
                        {active ? (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: color },
                            ]}
                          />
                        ) : null}
                      </View>
                      {Icon ? (
                        <Icon size={16} color={color} />
                      ) : null}
                      <Text
                        style={[
                          styles.statusLabel,
                          { color },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[styles.modalTitle, { marginTop: 16 }]}
              >
                Remarks (Optional)
              </Text>
              <TextInput
                style={styles.remarksInput}
                placeholder="Add any remarks about this status update..."
                placeholderTextColor={theme.colors.textSecondary}
                value={remarks}
                onChangeText={setRemarks}
                multiline
              />

              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => setStatusModalOpen(false)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={async () => {
                    if (!selectedTask || !selectedStatus) {
                      setStatusModalOpen(false);
                      return;
                    }
                    try {
                      setSubmitting(true);
                      const taskId =
                        selectedTask.task_id ||
                        selectedTask.id ||
                        selectedTask._id;
                      const payload = {
                        status: selectedStatus,
                        remarks,
                      };
                      setTasks(prev =>
                        prev.map(t => {
                          const id =
                            t.task_id || t.id || t._id;
                          return String(id) === String(taskId)
                            ? { ...t, status: selectedStatus }
                            : t;
                        }),
                      );
                      await updateTaskStatus(
                        orgId || 'one',
                        taskId,
                        payload,
                      );
                      await load();
                      setStatusModalOpen(false);
                      Toast.show({
                        type: 'custom_success',
                        text1: 'Status updated',
                        position: 'bottom',
                        visibilityTime: 1500,
                      });
                    } catch (e) {
                      try {
                        await load();
                      } catch {}
                      setError(
                        e?.message || 'Failed to update status',
                      );
                      Toast.show({
                        type: 'custom_error',
                        text1:
                          e?.message ||
                          'Failed to update status',
                        position: 'bottom',
                        visibilityTime: 2000,
                      });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.white}
                      />
                      <Text
                        style={[
                          styles.btnText,
                          { color: theme.colors.white },
                        ]}
                      >
                        Updating...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.btnText,
                        { color: theme.colors.white },
                      ]}
                    >
                      Update Status
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Collaborate Task Modal */}
        <CollaborateTasks
          visible={collaborateOpen}
          onClose={() => setCollaborateOpen(false)}
          onCollaborateSuccess={async collaborateData => {
            try {
              await collaborateTask(collaborateData);
              Toast.show({
                type: 'custom_success',
                text1: 'Collaborator added',
                position: 'bottom',
                visibilityTime: 1500,
              });
              setCollaborateOpen(false);
            } catch (e) {
              Toast.show({
                type: 'custom_error',
                text1:
                  e?.message || 'Failed to add collaborator',
                position: 'bottom',
                visibilityTime: 2000,
              });
              throw e;
            }
          }}
          taskId={
            selectedTask
              ? selectedTask.task_id ||
                selectedTask.id ||
                selectedTask._id
              : null
          }
          organizationId={orgId}
        />

        {/* Share Task Modal */}
        <ShareTasks
          visible={shareOpen}
          onClose={() => setShareOpen(false)}
          onShareSuccess={async shareData => {
            try {
              await shareTask(shareData);
              Toast.show({
                type: 'custom_success',
                text1: 'Task shared',
                position: 'bottom',
                visibilityTime: 1500,
              });
              setShareOpen(false);
            } catch (e) {
              Toast.show({
                type: 'custom_error',
                text1:
                  e?.message || 'Failed to share task',
                position: 'bottom',
                visibilityTime: 2000,
              });
              throw e;
            }
          }}
          taskId={
            selectedTask
              ? selectedTask.task_id ||
                selectedTask.id ||
                selectedTask._id
              : null
          }
          organizationId={orgId}
          taskTitle={selectedTask?.title}
        />

        {/* Forward Task Modal */}
        <ForwardTasks
          visible={forwardOpen}
          onClose={() => setForwardOpen(false)}
          onForwardSuccess={async forwardData => {
            try {
              await forwardTask(forwardData);
              Toast.show({
                type: 'custom_success',
                text1: 'Task forwarded',
                position: 'bottom',
                visibilityTime: 1500,
              });
              setForwardOpen(false);
            } catch (e) {
              Toast.show({
                type: 'custom_error',
                text1:
                  e?.message || 'Failed to forward task',
                position: 'bottom',
                visibilityTime: 2000,
              });
              throw e;
            }
          }}
          taskId={
            selectedTask
              ? selectedTask.task_id ||
                selectedTask.id ||
                selectedTask._id
              : null
          }
          organizationId={orgId}
        />

        {/* Logs Modal */}
        <Modal
          visible={logsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setLogsModalOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setLogsModalOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalSheet}
            >
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setLogsModalOpen(false)}
                >
                  <ChevronLeft
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Task Logs</Text>
                <View style={{ width: 24 }} />
              </View>
              {logsLoading ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator
                    color={theme.colors.primary}
                  />
                </View>
              ) : logs.length === 0 ? (
                <View style={{ paddingVertical: 16 }}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                    }}
                  >
                    No logs found.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={logs}
                  keyExtractor={(it, idx) =>
                    String(it.id || idx)
                  }
                  renderItem={({ item }) => (
                    <View style={{ paddingVertical: 10 }}>
                      <Text
                        style={{
                          color: theme.colors.text,
                          fontWeight: '600',
                        }}
                      >
                        {item.title ||
                          item.action ||
                          'Log'}
                      </Text>
                      {!!item.message && (
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {item.message}
                        </Text>
                      )}
                      {!!item.timestamp && (
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                          }}
                        >
                          {String(item.timestamp)}
                        </Text>
                      )}
                    </View>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={{ height: 8 }} />
                  )}
                  style={{ maxHeight: 260 }}
                />
              )}
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => setLogsModalOpen(false)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Actions Bottom Sheet with separate buttons */}
        <Modal
          visible={actionsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setActionsOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setActionsOpen(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalSheet}
            >
              <View style={styles.modalHandle} />
              {!!selectedTask?.title && (
                <Text
                  style={styles.modalTaskTitle}
                  numberOfLines={2}
                >
                  {selectedTask.title}
                </Text>
              )}
              <Text style={styles.modalTitle}>Actions</Text>

              <View style={{ marginTop: 8 }}>
                {/* View Status */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    setActionsOpen(false);
                    const task = selectedTask;
                    navigation.navigate('TaskStatusChange', {
                      task,
                      orgId,
                    });
                  }}
                >
                  <View style={styles.actionLeft}>
                    <Eye
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View>
                      <Text style={styles.actionTextPrimary}>
                        View Status
                      </Text>
                      <Text
                        style={styles.actionTextSecondary}
                      >
                        See the full status history
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* View Logs */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    setActionsOpen(false);
                    if (selectedTask) {
                      const task = selectedTask;
                      const taskId =
                        task.task_id ||
                        task.id ||
                        task._id;
                      navigation.navigate(
                        'TaskStatusLogs',
                        {
                          orgId,
                          taskId,
                          taskTitle:
                            task.title ||
                            'Task Logs',
                        },
                      );
                    }
                  }}
                >
                  <View style={styles.actionLeft}>
                    <FileText
                      size={20}
                      color={theme.colors.meeting}
                    />
                    <View>
                      <Text style={styles.actionTextPrimary}>
                        View Logs
                      </Text>
                      <Text
                        style={styles.actionTextSecondary}
                      >
                        Check all activity on this task
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Share Task */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    setActionsOpen(false);
                    setShareOpen(true);
                  }}
                >
                  <View style={styles.actionLeft}>
                    <Share2
                      size={20}
                      color={theme.colors.secondary}
                    />
                    <View>
                      <Text style={styles.actionTextPrimary}>
                        Share Task
                      </Text>
                      <Text
                        style={styles.actionTextSecondary}
                      >
                        Share with other team members
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Forward Task */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    setActionsOpen(false);
                    setForwardOpen(true);
                  }}
                >
                  <View style={styles.actionLeft}>
                    <CornerUpRight
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View>
                      <Text style={styles.actionTextPrimary}>
                        Forward Task
                      </Text>
                      <Text
                        style={styles.actionTextSecondary}
                      >
                        Assign to another person
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Add Collaborator */}
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    setActionsOpen(false);
                    setCollaborateOpen(true);
                  }}
                >
                  <View style={styles.actionLeft}>
                    <UserPlus
                      size={20}
                      color={theme.colors.success}
                    />
                    <View>
                      <Text style={styles.actionTextPrimary}>
                        Add Collaborator
                      </Text>
                      <Text
                        style={styles.actionTextSecondary}
                      >
                        Work together on this task
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Separate bottom button under popup: Close */}
              <View style={{ marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={() => setActionsOpen(false)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      { color: theme.colors.text },
                    ]}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 1,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  headerRightButton: {
    padding: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card styles
  projectCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card || theme.colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shadow: {
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  leftStripe: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPlusButton: {
    width: 28,
    height: 28,
    borderRadius: 20,
    borderWidth:1.5,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: theme.colors.card || theme.colors.background,
  },
  projectTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  metaText: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statusSoft: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusSoftText: {
    fontWeight: '600',
    fontSize: 12.5,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: { color: theme.colors.text },

  // Modal base
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.background,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },

  // Status modal
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontWeight: '600' },
  remarksInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    padding: 12,
    color: theme.colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Buttons
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: theme.colors.muted100,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnText: { fontSize: 16, fontWeight: '700' },

  // Action rows in bottom sheet
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
    backgroundColor: theme.colors.card || theme.colors.background,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionTextSecondary: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
});
