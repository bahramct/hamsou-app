export interface HistoryFeedback {
  status: "DONE" | "NOT_DONE";
  note: string | null;
}

export interface HistoryItem {
  id: string;
  content: string;
  date: string;        // ISO string — برای cursor
  dateLabel: string;   // شمسی
  weekdayLabel: string;
  feedback: HistoryFeedback | null;
}

export interface HistoryPage {
  items: HistoryItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
