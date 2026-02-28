import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../Themes/ThemeContext';

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
  const { theme } = useTheme();
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