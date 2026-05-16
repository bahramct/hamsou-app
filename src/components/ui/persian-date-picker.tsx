'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toJalaali, toGregorian } from 'jalaali-js';
import { toPersianNumber, toPersianText } from '@/lib/utils/persian';

interface PersianDatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: string; // ISO date string - minimum selectable date
  maxDate?: string; // ISO date string - maximum selectable date
}

const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function PersianDatePicker({
  label,
  value,
  onChange,
  placeholder = 'روز/ماه/سال',
  required = false,
  minDate,
  maxDate,
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  // Convert current date to Jalaali for initial state
  const getCurrentJalaali = () => {
    const now = new Date();
    return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  };

  const currentJalaali = getCurrentJalaali();
  const [selectedYear, setSelectedYear] = useState(currentJalaali.jy);
  const [selectedMonth, setSelectedMonth] = useState(currentJalaali.jm - 1); // 0-indexed for array

  // Generate year options (current year ± 10)
  const yearOptions = [];
  for (let i = currentJalaali.jy - 5; i <= currentJalaali.jy + 5; i++) {
    yearOptions.push(i);
  }

  // Convert ISO date to Persian date
  const getJalaaliFromDate = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const jalaali = toJalaali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    return jalaali;
  };

  // Convert Persian date to ISO date
  const getGregorianFromJalaali = (jy: number, jm: number, jd: number) => {
    const gregorian = toGregorian(jy, jm, jd);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).toISOString().split('T')[0];
  };

  const jalaaliDate = getJalaaliFromDate(value);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedMonth((prev) => {
        if (prev === 0) {
          setSelectedYear((y) => y - 1);
          return 11;
        }
        return prev - 1;
      });
    } else {
      setSelectedMonth((prev) => {
        if (prev === 11) {
          setSelectedYear((y) => y + 1);
          return 0;
        }
        return prev + 1;
      });
    }
  };

  const handleDateSelect = (day: number) => {
    const isoDate = getGregorianFromJalaali(selectedYear, selectedMonth + 1, day);
    onChange(isoDate);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse Persian date format: dd/mm/yyyy
    const value = e.target.value;
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (match) {
      const [, d, m, y] = match.map((v) => parseInt(v, 10));
      const isoDate = getGregorianFromJalaali(y, m, d);

      // Check if the date is within valid range
      if (minDate && isoDate < minDate) {
        // Invalid date (before minDate)
        onChange('');
        return;
      }

      if (maxDate && isoDate > maxDate) {
        // Invalid date (after maxDate)
        onChange('');
        return;
      }

      onChange(isoDate);
    } else {
      onChange('');
    }
  };

  const formatPersianDate = (dateStr: string) => {
    if (!dateStr) return '';
    const jalaali = getJalaaliFromDate(dateStr);
    if (!jalaali) return '';
    return `${toPersianNumber(jalaali.jd)}/${toPersianNumber(jalaali.jm)}/${toPersianNumber(jalaali.jy)}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    const isLeap = (y: number) => {
      const jy = y - 979;
      const d = (jy % 33 * 8 + 21) % 33;
      return d < 10;
    };

    if (month < 6) return 31;
    if (month < 11) return 30;
    return isLeap(year) ? 30 : 29;
  };

  // Check if a date is selectable (within minDate and maxDate)
  const isDateSelectable = (jy: number, jm: number, jd: number): boolean => {
    const isoDate = getGregorianFromJalaali(jy, jm, jd);

    if (minDate && isoDate < minDate) {
      return false;
    }

    if (maxDate && isoDate > maxDate) {
      return false;
    }

    return true;
  };

  // Get the starting day of the week for the month (0 = Saturday, 6 = Friday)
  const getMonthStartDay = (year: number, month: number) => {
    // Convert Jalaali month start to Gregorian
    const gregorian = toGregorian(year, month + 1, 1);
    const date = new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We need 0 for Saturday, 6 for Friday
    const day = date.getDay();
    return (day + 1) % 7; // Convert to 0=Saturday, 6=Friday
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth + 1);
    const startDay = getMonthStartDay(selectedYear, selectedMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-9 h-9" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        jalaaliDate &&
        jalaaliDate.jy === selectedYear &&
        jalaaliDate.jm === selectedMonth + 1 &&
        jalaaliDate.jd === day;

      const isSelectable = isDateSelectable(selectedYear, selectedMonth + 1, day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => isSelectable && handleDateSelect(day)}
          disabled={!isSelectable}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
            ${isSelected
              ? 'bg-primary text-primary-foreground'
              : isSelectable
              ? 'hover:bg-muted'
              : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
        >
          {toPersianNumber(day)}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative">
      {label && (
        <Label htmlFor={label} className="block mb-2">
          {label}
          {required && <span className="text-destructive mr-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          id={label}
          type="text"
          value={formatPersianDate(value)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10"
          dir="ltr"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-background border rounded-lg shadow-lg w-72">
          {/* Month/Year Selector */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange('prev')}
            >
              {'<'}
            </Button>
            <div
              className="text-center cursor-pointer hover:underline"
              onClick={() => setShowYearSelector(!showYearSelector)}
            >
              <div className="font-semibold text-sm">
                {persianMonths[selectedMonth]} {toPersianNumber(selectedYear)}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange('next')}
            >
              {'>'}
            </Button>
          </div>

          {/* Year Selector */}
          {showYearSelector && (
            <div className="mb-4 p-3 border rounded-lg bg-muted">
              <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearSelector(false);
                    }}
                    className={`text-sm p-2 rounded transition-colors
                      ${year === selectedYear
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted-foreground/10'
                      }`}
                  >
                    {toPersianNumber(year)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
}
