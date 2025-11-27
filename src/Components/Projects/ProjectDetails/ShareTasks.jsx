import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsers } from '../../../Utils/apiUtils';
import theme from '../../../Themes/Themes';
import Toast from 'react-native-toast-message';

const ShareTasks = ({
  visible,
  onClose,
  onShareSuccess,
  taskId,
  organizationId,
  taskTitle = ''
}) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      let parsedInfo = null;
      try { 
        parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null; 
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
      
      const orgId = organizationId || String(parsedInfo?.organization_id || 'one');
      console.log('Fetching users for org:', orgId);
      
      const response = await getUsers(orgId);
      console.log('Users API response:', response);
      
      // Handle different response formats
      let usersData = [];
      if (Array.isArray(response)) {
        usersData = response; // Direct array response
      } else if (response && typeof response === 'object') {
        // Handle object response with data/items/users property
        usersData = response.data || response.items || response.users || [];
      }
      
      const userList = usersData.map(user => ({
        id: user.id || user.user_id || Math.random().toString(),
        name: user.user_full_name || user.name || user.full_name || user.username || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        username: user.username || user.email?.split('@')[0] || ''
      }));
      
      console.log('Processed user list:', userList);
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load users. Please try again.',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0 || !taskId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select at least one user to share with',
        position: 'bottom'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const storedUserId = await AsyncStorage.getItem('userId');
      let parsedInfo = null;
      try { 
        parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null; 
      } catch {}
      
      const sentBy = storedUserId || String(parsedInfo?.user_id || '');
      
      if (onShareSuccess) {
        // Call onShareSuccess for each selected user
        await Promise.all(selectedUsers.map(async (userId) => {
          await onShareSuccess({
            task_id: taskId,
            user_id: userId,
            sent_by_user_id: sentBy
          });
        }));
      }
      
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sharing task:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.modalOverlay} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalSheet}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Share Task</Text>
          
          {taskTitle ? (
            <Text style={[styles.taskTitle, { marginBottom: 16 }]} numberOfLines={2}>
              {taskTitle}
            </Text>
          ) : null}
          
          <Text style={styles.sectionTitle}>
            {selectedUsers.length > 0 
              ? `Selected ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`
              : 'Select users to share with:'
            }
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.id || Math.random())}
              renderItem={({ item }) => {
                const isSelected = selectedUsers.includes(item.id);
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[
                      styles.userItem,
                      isSelected && { backgroundColor: `${theme.colors.primary}10` }
                    ]}
                    onPress={() => toggleUserSelection(item.id)}
                  >
                    <View style={[
                      styles.radioOuter, 
                      { 
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: isSelected ? 'transparent' : 'transparent'
                      }
                    ]}>
                      {isSelected && (
                        <View style={[
                          styles.radioInner, 
                          { backgroundColor: theme.colors.primary }
                        ]} />
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {item.name || 'User'}
                        {item.email ? (
                          <Text style={styles.userEmail}>
                            {'\n'}{item.email}
                          </Text>
                        ) : null}
                      </Text>
                      {(item.username || item.email) && (
                        <Text style={styles.userDetail}>
                          {item.username || item.email?.split('@')[0]}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.userList}
            />
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary]} 
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={[styles.btnText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.btn, 
                styles.btnPrimary, 
                (selectedUsers.length === 0 || submitting) && { opacity: 0.7 }
              ]}
              disabled={selectedUsers.length === 0 || submitting}
              onPress={handleShare}
            >
              {submitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text style={[styles.btnText, { color: theme.colors.white }]}>
                    {selectedUsers.length > 1 ? 'Sharing with users...' : 'Sharing...'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.btnText, { color: theme.colors.white }]}>
                  {selectedUsers.length > 1 
                    ? `Share with ${selectedUsers.length} users` 
                    : 'Share Task'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  taskTitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    marginBottom: 12,
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20, 
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8, 
    color: theme.colors.textSecondary,
  },
  userList: {
    maxHeight: 280,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.colors.text, 
    fontWeight: '600',
  },
  userDetail: {
    color: theme.colors.textSecondary, 
    fontSize: 12, 
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  buttonContainer: {
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  btnSecondary: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submittingContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
  },
});

export default ShareTasks;