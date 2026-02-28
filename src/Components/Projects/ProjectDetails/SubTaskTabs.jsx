import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import theme from '../../../Themes/Themes';
import { fetchSubtasks } from '../../../Services/Project/FetchSubTask';
import { ChevronDown, ChevronUp, Circle, CheckCircle, Clock, AlertCircle, MoreVertical } from 'lucide-react-native';
import ActionSheet from 'react-native-actions-sheet';
import { deleteSubtask } from '../../../Services/Project/FetchSubTask';

const SubTaskTabs = ({ taskId, visible, onToggle }) => {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const actionSheetRef = React.useRef(null);

  // Load subtasks when component becomes visible
  useEffect(() => {
    if (visible && taskId) {
      loadSubtasks();
    }
  }, [visible, taskId]);

  const loadSubtasks = async () => {
    if (!taskId) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSubtasks(taskId);
      
      if (result.success) {
        setSubtasks(result.subtasks || []);
      } else {
        setError(result.error || 'Failed to load subtasks');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteSubtask = async () => {
    if (!selectedSubtask || !taskId) return;
    
    try {
      setLoading(true);
      const response = await deleteSubtask(taskId, selectedSubtask.subtask_id);
      
      if (response.success) {
        // Remove the deleted subtask from the list
        setSubtasks(subtasks.filter(subtask => subtask.subtask_id !== selectedSubtask.subtask_id));
      } else {
        setError(response.error || 'Failed to delete subtask');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while deleting the subtask');
    } finally {
      setLoading(false);
      setSelectedSubtask(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubtasks();
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: theme.colors.textSecondary,
      in_progress: theme.colors.secondary,
      completed: theme.colors.success,
      pending: theme.colors.task,
      on_hold: theme.colors.textSecondary,
      cancelled: theme.colors.error,
    };
    return colors[status] || theme.colors.textSecondary;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} color={getStatusColor(status)} />;
      case 'in_progress':
        return <Clock size={14} color={getStatusColor(status)} />;
      case 'cancelled':
        return <AlertCircle size={14} color={getStatusColor(status)} />;
      default:
        return <Circle size={14} color={getStatusColor(status)} />;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent_important: theme.colors.error,
      urgent_not_important: theme.colors.secondary,
      not_urgent_important: theme.colors.primary,
      not_urgent_not_important: theme.colors.textSecondary,
      medium: theme.colors.task,
    };
    return colors[priority] || theme.colors.textSecondary;
  };

  const showActionSheet = (subtask) => {
    setSelectedSubtask(subtask);
    actionSheetRef.current?.show();
  };

  const renderSubtaskItem = ({ item }) => (
    <View style={styles.subtaskItem}>
      <View style={styles.subtaskContent}>
        <View style={styles.subtaskHeader}>
          <View style={styles.titleRow}>
            {getStatusIcon(item.status)}
            <Text
              style={[
                styles.subtaskTitle,
                { color: theme.colors.text },
                item.status === 'completed' && styles.completedTitle,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
          
          {/* Priority Badge */}
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority?.replace('_', ' ') || 'medium'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        {/* Meta Information */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
            {item.due_date && `Due: ${item.due_date}`}
          </Text>
          {item.assigned_users && item.assigned_users.length > 0 && (
            <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
              {item.assigned_users.length} assigned
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity 
        onPress={() => showActionSheet(item)}
        style={styles.moreButton}
      >
        <MoreVertical size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No subtasks found for this task
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Text style={[styles.errorText, { color: theme.colors.error }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[styles.retryButton, { borderColor: theme.colors.primary }]}
        onPress={loadSubtasks}
      >
        <Text style={[styles.retryButtonText, { color: theme.colors.primary }]}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!visible) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Subtasks Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Subtasks ({subtasks.length})
        </Text>
        <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
          {visible ? (
            <ChevronUp size={20} color={theme.colors.primary} />
          ) : (
            <ChevronDown size={20} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>
      
      {visible && (
        <View style={styles.content}>
          {loading && !refreshing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : error ? (
            renderError()
          ) : subtasks.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={subtasks}
              renderItem={renderSubtaskItem}
              keyExtractor={(item) => item.subtask_id}
              style={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
            />
          )}
        </View>
      )}
      
      <ActionSheet
        ref={actionSheetRef}
        title="Subtask Actions"
        options={['Delete', 'Cancel']}
        cancelButtonIndex={1}
        destructiveButtonIndex={0}
        onPress={(index) => {
          if (index === 0) {
            handleDeleteSubtask();
          }
        }}
        theme="ios"
      />
    </View>
  )
};
    
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: theme.colors.muted100,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 4,
  },
  content: {
    padding: 8,
  },
  list: {
    // No additional styles needed
  },
  subtaskItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  subtaskContent: {
    // No additional styles needed
  },
  subtaskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  subtaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  separator: {
    height: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  errorState: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SubTaskTabs;