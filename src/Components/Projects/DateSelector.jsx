import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import theme from '../../Themes/Themes';

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

export default function DateSelector({ onDateChange }) {
  const todayId = dayjs().format(DATE_FORMAT_ID);
  const [selectedDateId, setSelectedDateId] = useState(todayId);
  const [dates, setDates] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    updateDates(dayjs(selectedDateId));
  }, []);

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

  const handlePickDate = (event, date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); // Android picker closes automatically
    }
    if (!date) return;

    const picked = dayjs(date);
    // Keep the previously selected day index but clamp to the days in the picked month
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
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* View All Button (clears date filtering) */}
        <TouchableOpacity
          style={[styles.dateItem, styles.viewAllButton]}
          onPress={() => {
            setSelectedDateId("");
            if (typeof onDateChange === 'function') onDateChange(null);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>

        {/* Pick Date Button */}
        <TouchableOpacity
          style={[styles.dateItem, styles.pickButton]}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.pickText}>Pick Date</Text>
        </TouchableOpacity>

        {/* Month Dates */}
        {dates.map((item) => {
          const selected = item.id === selectedDateId;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleDatePress(item.id)}
              activeOpacity={0.7}
              style={[styles.dateItem, selected ? styles.selected : styles.unselected]}
            >
              <Text style={[styles.dateNumber, selected && styles.selectedText]}>
                {item.dateNumber}
              </Text>
              <Text style={[styles.dayText, selected && styles.selectedText]}>
                {item.dayAbbr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={new Date(selectedDateId)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickDate}
        />
      )}
    </View>
  );
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
  pickButton: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
    width: 90,
    height: ITEM_HEIGHT,
    borderRadius: 14,
  },
  viewAllButton: {
    backgroundColor: theme.colors.muted100,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 90,
    height: ITEM_HEIGHT,
    borderRadius: 14,
  },
  pickText: {
    color: theme.colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  viewAllText: {
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
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