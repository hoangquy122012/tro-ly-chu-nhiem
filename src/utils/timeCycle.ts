// Utility for 35-week school year time cycle, month/semester mapping, and query parsing

export interface WeekCycleInfo {
  weekNumber: number;
  monthNumber: number;
  monthName: string;
  semester: 1 | 2;
  dateRange: string;
}

// 35 weeks mapping based on Vietnamese MOET standard school year
export const SCHOOL_YEAR_WEEKS: WeekCycleInfo[] = [
  // HỌC KỲ I (Tuần 1 -> 18)
  // Tháng 9
  { weekNumber: 1, monthNumber: 9, monthName: 'Tháng 9/2026', semester: 1, dateRange: '01/09/2026 - 05/09/2026' },
  { weekNumber: 2, monthNumber: 9, monthName: 'Tháng 9/2026', semester: 1, dateRange: '07/09/2026 - 12/09/2026' },
  { weekNumber: 3, monthNumber: 9, monthName: 'Tháng 9/2026', semester: 1, dateRange: '14/09/2026 - 19/09/2026' },
  { weekNumber: 4, monthNumber: 9, monthName: 'Tháng 9/2026', semester: 1, dateRange: '21/09/2026 - 26/09/2026' },
  // Tháng 10
  { weekNumber: 5, monthNumber: 10, monthName: 'Tháng 10/2026', semester: 1, dateRange: '28/09/2026 - 03/10/2026' },
  { weekNumber: 6, monthNumber: 10, monthName: 'Tháng 10/2026', semester: 1, dateRange: '05/10/2026 - 10/10/2026' },
  { weekNumber: 7, monthNumber: 10, monthName: 'Tháng 10/2026', semester: 1, dateRange: '12/10/2026 - 17/10/2026' },
  { weekNumber: 8, monthNumber: 10, monthName: 'Tháng 10/2026', semester: 1, dateRange: '19/10/2026 - 24/10/2026' },
  { weekNumber: 9, monthNumber: 10, monthName: 'Tháng 10/2026', semester: 1, dateRange: '26/10/2026 - 31/10/2026' },
  // Tháng 11
  { weekNumber: 10, monthNumber: 11, monthName: 'Tháng 11/2026', semester: 1, dateRange: '02/11/2026 - 07/11/2026' },
  { weekNumber: 11, monthNumber: 11, monthName: 'Tháng 11/2026', semester: 1, dateRange: '09/11/2026 - 14/11/2026' },
  { weekNumber: 12, monthNumber: 11, monthName: 'Tháng 11/2026', semester: 1, dateRange: '16/11/2026 - 21/11/2026' },
  { weekNumber: 13, monthNumber: 11, monthName: 'Tháng 11/2026', semester: 1, dateRange: '23/11/2026 - 28/11/2026' },
  // Tháng 12 & Kết thúc HK1
  { weekNumber: 14, monthNumber: 12, monthName: 'Tháng 12/2026', semester: 1, dateRange: '30/11/2026 - 05/12/2026' },
  { weekNumber: 15, monthNumber: 12, monthName: 'Tháng 12/2026', semester: 1, dateRange: '07/12/2026 - 12/12/2026' },
  { weekNumber: 16, monthNumber: 12, monthName: 'Tháng 12/2026', semester: 1, dateRange: '14/12/2026 - 19/12/2026' },
  { weekNumber: 17, monthNumber: 12, monthName: 'Tháng 12/2026', semester: 1, dateRange: '21/12/2026 - 26/12/2026' },
  { weekNumber: 18, monthNumber: 1, monthName: 'Tháng 1/2027', semester: 1, dateRange: '28/12/2026 - 02/01/2027' },

  // HỌC KỲ II (Tuần 19 -> 35)
  // Tháng 1 & 2
  { weekNumber: 19, monthNumber: 1, monthName: 'Tháng 1/2027', semester: 2, dateRange: '04/01/2027 - 09/01/2027' },
  { weekNumber: 20, monthNumber: 1, monthName: 'Tháng 1/2027', semester: 2, dateRange: '11/01/2027 - 16/01/2027' },
  { weekNumber: 21, monthNumber: 2, monthName: 'Tháng 2/2027', semester: 2, dateRange: '01/02/2027 - 06/02/2027' },
  { weekNumber: 22, monthNumber: 2, monthName: 'Tháng 2/2027', semester: 2, dateRange: '08/02/2027 - 13/02/2027' },
  // Tháng 3
  { weekNumber: 23, monthNumber: 3, monthName: 'Tháng 3/2027', semester: 2, dateRange: '01/03/2027 - 06/03/2027' },
  { weekNumber: 24, monthNumber: 3, monthName: 'Tháng 3/2027', semester: 2, dateRange: '08/03/2027 - 13/03/2027' },
  { weekNumber: 25, monthNumber: 3, monthName: 'Tháng 3/2027', semester: 2, dateRange: '15/03/2027 - 20/03/2027' },
  { weekNumber: 26, monthNumber: 3, monthName: 'Tháng 3/2027', semester: 2, dateRange: '22/03/2027 - 27/03/2027' },
  // Tháng 4
  { weekNumber: 27, monthNumber: 4, monthName: 'Tháng 4/2027', semester: 2, dateRange: '29/03/2027 - 03/04/2027' },
  { weekNumber: 28, monthNumber: 4, monthName: 'Tháng 4/2027', semester: 2, dateRange: '05/04/2027 - 10/04/2027' },
  { weekNumber: 29, monthNumber: 4, monthName: 'Tháng 4/2027', semester: 2, dateRange: '12/04/2027 - 17/04/2027' },
  { weekNumber: 30, monthNumber: 4, monthName: 'Tháng 4/2027', semester: 2, dateRange: '19/04/2027 - 24/04/2027' },
  // Tháng 5
  { weekNumber: 31, monthNumber: 5, monthName: 'Tháng 5/2027', semester: 2, dateRange: '26/04/2027 - 01/05/2027' },
  { weekNumber: 32, monthNumber: 5, monthName: 'Tháng 5/2027', semester: 2, dateRange: '03/05/2027 - 08/05/2027' },
  { weekNumber: 33, monthNumber: 5, monthName: 'Tháng 5/2027', semester: 2, dateRange: '10/05/2027 - 15/05/2027' },
  { weekNumber: 34, monthNumber: 5, monthName: 'Tháng 5/2027', semester: 2, dateRange: '17/05/2027 - 22/05/2027' },
  { weekNumber: 35, monthNumber: 5, monthName: 'Tháng 5/2027', semester: 2, dateRange: '24/05/2027 - 29/05/2027' },
];

export interface MonthItem {
  monthNumber: number;
  monthName: string;
  semester: 1 | 2;
  weeks: number[];
}

export const MONTH_LIST: MonthItem[] = [
  { monthNumber: 9, monthName: 'Tháng 9', semester: 1, weeks: [1, 2, 3, 4] },
  { monthNumber: 10, monthName: 'Tháng 10', semester: 1, weeks: [5, 6, 7, 8, 9] },
  { monthNumber: 11, monthName: 'Tháng 11', semester: 1, weeks: [10, 11, 12, 13] },
  { monthNumber: 12, monthName: 'Tháng 12', semester: 1, weeks: [14, 15, 16, 17] },
  { monthNumber: 1, monthName: 'Tháng 1', semester: 2, weeks: [18, 19, 20] },
  { monthNumber: 2, monthName: 'Tháng 2', semester: 2, weeks: [21, 22] },
  { monthNumber: 3, monthName: 'Tháng 3', semester: 2, weeks: [23, 24, 25, 26] },
  { monthNumber: 4, monthName: 'Tháng 4', semester: 2, weeks: [27, 28, 29, 30] },
  { monthNumber: 5, monthName: 'Tháng 5', semester: 2, weeks: [31, 32, 33, 34, 35] },
];

export function getWeekCycleInfo(weekNum: number): WeekCycleInfo {
  const found = SCHOOL_YEAR_WEEKS.find((w) => w.weekNumber === weekNum);
  if (found) return found;
  // Fallback
  const semester: 1 | 2 = weekNum <= 18 ? 1 : 2;
  const monthNumber = weekNum <= 4 ? 9 : weekNum <= 9 ? 10 : weekNum <= 13 ? 11 : weekNum <= 18 ? 12 : weekNum <= 22 ? 2 : weekNum <= 26 ? 3 : weekNum <= 30 ? 4 : 5;
  return {
    weekNumber: weekNum,
    monthNumber,
    monthName: `Tháng ${monthNumber}`,
    semester,
    dateRange: `Tuần ${weekNum}`,
  };
}

/**
 * Scan raw text or dates array to detect week, month, and date range
 */
export function detectWeekFromScannedContent(text: string, events: Array<{ date?: string }>): {
  detectedWeek: number;
  detectedMonth: number;
  detectedSemester: 1 | 2;
  detectedDateRange: string;
  startDateStr: string;
  endDateStr: string;
} {
  // Try to find explicit week mentions e.g. "Tuần 3", "Tuần 04", "Tuần: 4"
  const weekMatch = text.match(/tuần\s*[:#\-]?\s*(\d{1,2})/i);
  if (weekMatch) {
    const wNum = parseInt(weekMatch[1], 10);
    if (wNum >= 1 && wNum <= 35) {
      const info = getWeekCycleInfo(wNum);
      return {
        detectedWeek: wNum,
        detectedMonth: info.monthNumber,
        detectedSemester: info.semester,
        detectedDateRange: info.dateRange,
        startDateStr: info.dateRange.split('-')[0]?.trim() || '',
        endDateStr: info.dateRange.split('-')[1]?.trim() || '',
      };
    }
  }

  // Look for dates like 14/09, 15/09/2026, 21/09
  const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/g;
  const foundDates: { day: number; month: number }[] = [];
  
  let match;
  while ((match = dateRegex.exec(text)) !== null) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      foundDates.push({ day, month });
    }
  }

  // Also check events dates
  if (Array.isArray(events)) {
    for (const ev of events) {
      if (ev.date) {
        const dMatch = ev.date.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
        if (dMatch) {
          foundDates.push({ day: parseInt(dMatch[1], 10), month: parseInt(dMatch[2], 10) });
        }
      }
    }
  }

  if (foundDates.length > 0) {
    // Pick the most common month and median day
    const firstDate = foundDates[0];
    const lastDate = foundDates[foundDates.length - 1];
    const month = firstDate.month;
    const day = firstDate.day;

    // Check which week of SCHOOL_YEAR_WEEKS matches this date best
    for (const w of SCHOOL_YEAR_WEEKS) {
      if (w.monthNumber === month) {
        // Parse week dateRange e.g. "14/09/2026 - 19/09/2026"
        const parts = w.dateRange.split('-');
        if (parts.length === 2) {
          const startDayMatch = parts[0].match(/(\d{1,2})/);
          const endDayMatch = parts[1].match(/(\d{1,2})/);
          if (startDayMatch && endDayMatch) {
            const startDay = parseInt(startDayMatch[1], 10);
            const endDay = parseInt(endDayMatch[1], 10);
            if (day >= startDay && day <= endDay + 2) {
              return {
                detectedWeek: w.weekNumber,
                detectedMonth: w.monthNumber,
                detectedSemester: w.semester,
                detectedDateRange: w.dateRange,
                startDateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
                endDateStr: `${String(lastDate.day).padStart(2, '0')}/${String(lastDate.month).padStart(2, '0')}`,
              };
            }
          }
        }
      }
    }

    // Fallback: estimate from month
    const monthObj = MONTH_LIST.find((m) => m.monthNumber === month) || MONTH_LIST[0];
    const estimatedWeek = monthObj.weeks[0] || 1;
    const info = getWeekCycleInfo(estimatedWeek);
    return {
      detectedWeek: estimatedWeek,
      detectedMonth: month,
      detectedSemester: monthObj.semester,
      detectedDateRange: info.dateRange,
      startDateStr: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
      endDateStr: `${String(lastDate.day).padStart(2, '0')}/${String(lastDate.month).padStart(2, '0')}`,
    };
  }

  // Default fallback if no date found
  const defInfo = getWeekCycleInfo(3);
  return {
    detectedWeek: 3,
    detectedMonth: 9,
    detectedSemester: 1,
    detectedDateRange: defInfo.dateRange,
    startDateStr: '14/09',
    endDateStr: '19/09',
  };
}

export type TimeFilterMode = 'week' | 'month' | 'semester' | 'year';

export interface TimeQueryParsed {
  mode: TimeFilterMode;
  weekNumber?: number;
  monthNumber?: number;
  semester?: 1 | 2;
  queryText: string;
}

/**
 * Parse queries like "Xem Tuần 3", "Xem Tháng 9", "Tổng kết Tháng 10", "Xem Học kỳ 1", "Xem Cả năm"
 */
export function parseTimeQuery(input: string): TimeQueryParsed | null {
  const text = input.trim().toLowerCase();

  // Xem Cả năm / Tổng kết cả năm
  if (text.includes('cả năm') || text.includes('toàn bộ năm') || text.includes('35 tuần')) {
    return { mode: 'year', queryText: input };
  }

  // Xem Học kỳ
  const semMatch = text.match(/(?:học\s*kỳ|hk)\s*([12iI]{1,2})/i);
  if (semMatch) {
    const rawVal = semMatch[1].toUpperCase();
    const sem: 1 | 2 = rawVal === '2' || rawVal === 'II' ? 2 : 1;
    return { mode: 'semester', semester: sem, queryText: input };
  }

  // Xem Tháng
  const monthMatch = text.match(/(?:tháng|thg|t)\s*([1-9]|1[0-2])/i);
  if (monthMatch) {
    const mNum = parseInt(monthMatch[1], 10);
    return { mode: 'month', monthNumber: mNum, queryText: input };
  }

  // Xem Tuần
  const weekMatch = text.match(/(?:tuần|w|t)\s*(\d{1,2})/i);
  if (weekMatch) {
    const wNum = parseInt(weekMatch[1], 10);
    if (wNum >= 1 && wNum <= 35) {
      return { mode: 'week', weekNumber: wNum, queryText: input };
    }
  }

  return null;
}
