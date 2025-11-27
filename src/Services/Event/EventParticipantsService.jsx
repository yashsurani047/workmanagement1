import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrganizationUsers } from '../Project/FetchprojectUsers';

export const fetchEventParticipants = async () => {
  try {
    const userInfoRaw = await AsyncStorage.getItem('userInfo');
    const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
    const candidates = [
      await AsyncStorage.getItem('organization_id'),
      await AsyncStorage.getItem('selectedOrganizationId'),
      await AsyncStorage.getItem('orgId'),
      userInfo?.organization_id,
    ];
    const organizationId = (() => {
      const first = candidates.find(x => {
        const s = String(x ?? '').trim().toLowerCase();
        return !!s && s !== 'null' && s !== 'undefined';
      });
      return first ? String(first) : null;
    })();
    const finalOrgId = organizationId || 'one';
    if (!organizationId) { try { await AsyncStorage.setItem('organization_id', 'one'); } catch {} }
    const res = await getOrganizationUsers(finalOrgId);
    if (!res?.success) {
      console.error('fetchEventParticipants error:', res?.error || 'Failed to fetch users');
      return { success: false, error: res?.error || 'Failed to fetch users' };
    }
    const data = res.data;
    const users = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
    const list = users.map(u => ({
      id: String(u.user_id || u.id || ''),
      username: u.user_name || u.username || '',
      fullName: u.user_full_name || `${u.user_first_name || ''} ${u.user_last_name || ''}`.trim() || u.user_name || '',
      departments: Array.isArray(u.departments) ? u.departments : [],
    }));
    const deptMap = new Map();
    for (const u of list) {
      if (!u.departments || u.departments.length === 0) {
        const dKey = 'Unassigned';
        if (!deptMap.has(dKey)) deptMap.set(dKey, { name: dKey, id: 'unassigned', subs: new Map() });
        const dept = deptMap.get(dKey);
        const sKey = 'General';
        if (!dept.subs.has(sKey)) dept.subs.set(sKey, { name: sKey, id: 'general', users: [] });
        dept.subs.get(sKey).users.push(u);
        continue;
      }
      for (const d of u.departments) {
        const dName = d.department_name || 'Unknown';
        const sName = d.sub_department_name || 'General';
        const dId = String(d.department_id || d.departmentId || dName);
        const sId = String(d.sub_department_id ?? sName);
        if (!deptMap.has(dName)) deptMap.set(dName, { name: dName, id: dId, subs: new Map() });
        const dept = deptMap.get(dName);
        if (!dept.subs.has(sName)) dept.subs.set(sName, { name: sName, id: sId, users: [] });
        dept.subs.get(sName).users.push(u);
      }
    }
    const departments = Array.from(deptMap.values()).map(d => ({
      id: d.id,
      name: d.name,
      subDepartments: Array.from(d.subs.values()).map(s => ({ id: s.id, name: s.name, users: s.users })),
    }));
    return { success: true, users: list, departments };
  } catch (error) {
    console.error('fetchEventParticipants exception:', error?.message || error);
    return { success: false, error: error?.message || 'Failed to fetch users' };
  }
};
