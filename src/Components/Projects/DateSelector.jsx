import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

import dayjs from 'dayjs';
<<<<<<< HEAD
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../Themes/ThemeContext';
=======
import theme from '../../Themes/Themes';
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 50;
const ITEM_HEIGHT = 50;
const ITEM_MARGIN = 4;
const DATE_FORMAT_ID = 'YYYY-MM-DD';

// Generate all dates in the month of the given date
const getMonthDates = (date) => {
  const monthStart = dayjs(date).startOf('month');
  const monthEnd = dayjs(date).endOf('month');
  const dates = [];

  for (let i = 0; i < monthEnd.date(); i++) {
    const d = monthStart.add(i, 'day');
    dates.push({
      id: d.format(DATE_FORMAT_ID),
      dateNumber: d.date(),
      dayAbbr: d.format('ddd').toUpperCase(),
    });
  }
  return dates;
};

<<<<<<< HEAD
export default function DateSelector({ onDateChange }) {
  const { theme } = useTheme();
=======
export default function DateSelector({ onDateChange, selectedDateId: externalSelectedId, onRequestPickDate }) {

>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2
  const todayId = dayjs().format(DATE_FORMAT_ID);
  const [selectedDateId, setSelectedDateId] = useState(externalSelectedId || todayId);
  const [dates, setDates] = useState([]);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    updateDates(dayjs(selectedDateId));
  }, []);

  // sync when parent changes selected date
  useEffect(() => {
    if (externalSelectedId && externalSelectedId !== selectedDateId) {
      setSelectedDateId(externalSelectedId);
      updateDates(dayjs(externalSelectedId));
    }
  }, [externalSelectedId]);

  const updateDates = (centerDate) => {
    const d = getMonthDates(centerDate);
    setDates(d);

    // Scroll to selected date
    const selectedIndex = d.findIndex(
      (x) => x.id === dayjs(centerDate).format(DATE_FORMAT_ID)
    );
    if (selectedIndex !== -1) {
      const total = ITEM_WIDTH + ITEM_MARGIN * 2;
      const offset = total * selectedIndex - SCREEN_WIDTH / 2 + total / 2;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: offset, animated: true });
      }, 100);
    }
  };

  const handleDatePress = (id) => {
    setSelectedDateId(id);
    if (typeof onDateChange === 'function') {
      onDateChange(id);
    }
  };

<<<<<<< HEAD
  const handlePickDate = (event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (!date) return;

    const picked = dayjs(date);
    const prevDay = dayjs(selectedDateId).date();
    const clampedDay = Math.min(prevDay || picked.date(), picked.daysInMonth());
    const next = picked.date(clampedDay);

    const nextId = next.format(DATE_FORMAT_ID);
    setSelectedDateId(nextId);
    updateDates(next);
    if (typeof onDateChange === 'function') {
      onDateChange(nextId);
    }
  };

  return (
    <View style={{ backgroundColor: theme.colors.background, paddingVertical: 5 }}>
=======
  return (
    <View style={styles.container}>
      {typeof onRequestPickDate === 'function' && (
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onRequestPickDate}
            activeOpacity={0.9}
            style={styles.pickButton}
          >
            <Text style={styles.pickText}>Select Date</Text>
          </TouchableOpacity>
        </View>
      )}
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 1, alignItems: 'center' }}
      >
        {/* Month Dates */}
        {dates.map((item) => {
          const selected = item.id === selectedDateId;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleDatePress(item.id)}
              activeOpacity={0.7}
              style={[
                {
                  width: ITEM_WIDTH,
                  height: ITEM_HEIGHT,
                  borderRadius: 14,
                  marginHorizontal: ITEM_MARGIN,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 3,
                  shadowColor: theme.colors.shadow,
                  shadowOpacity: 0.12,
                  shadowRadius: 4,
                },
                selected
                  ? { backgroundColor: theme.colors.primary, borderWidth: 0 }
                  : { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[
                { fontSize: 15, fontWeight: '700', color: theme.colors.text },
                selected && { color: theme.colors.white },
              ]}>
                {item.dateNumber}
              </Text>
              <Text style={[
                { marginTop: 2, fontSize: 11, fontWeight: '500', color: theme.colors.textSecondary },
                selected && { color: theme.colors.white },
              ]}>
                {item.dayAbbr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
<<<<<<< HEAD
}
=======
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: 5,
  },
  scrollContent: {
    paddingHorizontal: 1,
    alignItems: 'center',
  },
  headerRow: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  pickButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.white,
  },
  dateItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    marginHorizontal: ITEM_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  unselected: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.borderLight || theme.colors.border,
  },
  selected: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dayText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  selectedText: {
    color: theme.colors.white,
  },
});
>>>>>>> f012798c2d8a64d738e7f62bf4a0d13e0cf411e2
