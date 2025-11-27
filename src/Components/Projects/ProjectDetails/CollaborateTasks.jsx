import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUsers } from '../../../Utils/apiUtils';
import theme from '../../../Themes/Themes';
import Toast from 'react-native-toast-message';

const CollaborateTasks = ({
  visible,
  onClose,
  onCollaborateSuccess,
  taskId,
  organizationId
}) => {
  const [collaborateUsers, setCollaborateUsers] = useState([]);
  const [selectedCollaborateUser, setSelectedCollaborateUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchUsers();
    }
  }, [visible]);

  const fetchUsers = async () => {
    console.log('Starting to fetch users...');
    try {
      setLoading(true);
      
      // Get user info from AsyncStorage
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      console.log('Raw user info from storage:', userInfoRaw);
      
      let parsedInfo = null;
      try { 
        parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
        console.log('Parsed user info:', parsedInfo);
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
      
      // Get organization ID
      const orgId = organizationId || String(parsedInfo?.organization_id || 'one');
      console.log('Using organization ID:', orgId);
      
      // Fetch users from API
      console.log('Calling getUsers API...');
      const response = await getUsers(orgId);
      console.log('Raw API response:', response);
      
      // Handle different response formats
      let usersData = [];
      if (Array.isArray(response)) {
        console.log('Response is an array, using directly');
        usersData = response;
      } else if (response && typeof response === 'object') {
        console.log('Response is an object, checking for data/items/users');
        usersData = response.data || response.items || response.users || [];
        
        // If response has a success flag and data is in a different property
        if (response.success === true && response.data) {
          usersData = Array.isArray(response.data) ? response.data : [response.data];
        }
      }
      
      console.log('Extracted users data:', usersData);
      
      // Process user data
      const userList = usersData.map((user, index) => {
        const userId = user.id || user.user_id || `user-${index}`;
        const userName = user.user_full_name || user.name || user.full_name || user.username || user.email?.split('@')[0] || `User ${index + 1}`;
        const userEmail = user.email || '';
        const username = user.username || userEmail.split('@')[0] || '';
        
        console.log(`Processed user ${index + 1}:`, { id: userId, name: userName, email: userEmail, username });
        
        return {
          id: userId,
          name: userName,
          email: userEmail,
          username: username
        };
      });
      
      // Filter out the current user from the list
      const currentUserEmail = parsedInfo?.email || '';
      console.log('Current user email for filtering:', currentUserEmail);
      
      const filteredList = userList.filter(user => {
        const shouldKeep = !user.email || user.email.toLowerCase() !== currentUserEmail.toLowerCase();
        console.log(`User ${user.email} - ${shouldKeep ? 'Keeping' : 'Filtering out'}`);
        return shouldKeep;
      });
      
      console.log('Final filtered user list:', filteredList);
      setCollaborateUsers(filteredList);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      
      setCollaborateUsers([]);
      
      // Show detailed error toast
      Toast.show({
        type: 'error',
        text1: 'Error Loading Users',
        text2: error.response?.data?.message || error.message || 'Failed to load users. Please try again.',
        position: 'bottom',
        visibilityTime: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollaborate = async () => {
    if (!selectedCollaborateUser || !taskId) return;
    
    try {
      setSubmitting(true);
      const userInfoRaw = await AsyncStorage.getItem('userInfo');
      const storedUserId = await AsyncStorage.getItem('userId');
      let parsedInfo = null;
      try { 
        parsedInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null; 
      } catch {}
      
      const sentBy = storedUserId || String(parsedInfo?.user_id || '');
      
      // Call the onCollaborateSuccess callback with the necessary data
      // The actual API call will be handled in the parent component
      if (onCollaborateSuccess) {
        await onCollaborateSuccess({
          task_id: taskId,
          user_id: selectedCollaborateUser,
          sent_by_user_id: sentBy
        });
      }
      
      // Reset selection
      setSelectedCollaborateUser(null);
    } catch (error) {
      console.error('Error in collaboration:', error);
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
          <Text style={styles.modalTitle}>Collaborate on Task</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <FlatList
              data={collaborateUsers}
              keyExtractor={(item) => String(item.id || Math.random())}
              renderItem={({ item }) => {
                const isSelected = selectedCollaborateUser === item.id;
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[
                      styles.userItem,
                      isSelected && { backgroundColor: `${theme.colors.primary}10` }
                    ]}
                    onPress={() => setSelectedCollaborateUser(item.id)}
                  >
                    <View style={[
                      styles.radioOuter, 
                      { borderColor: isSelected ? theme.colors.primary : theme.colors.border }
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
                (!selectedCollaborateUser || submitting) && { opacity: 0.7 }
              ]}
              disabled={!selectedCollaborateUser || submitting}
              onPress={handleCollaborate}
            >
              {submitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.white} />
                  <Text style={[styles.btnText, { color: theme.colors.white }]}>
                    Adding...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.btnText, { color: theme.colors.white }]}>
                  Add Collaborator
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
    marginBottom: 20,
    textAlign: 'center',
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
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

export default CollaborateTasks;
