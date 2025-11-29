import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

import dayjs from 'dayjs';
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

export default function DateSelector({ onDateChange, selectedDateId: externalSelectedId }) {
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

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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