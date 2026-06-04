// شکل سریالایزشدهٔ اعلان برای انتقال به client (DECISION-046)
export interface SerializedNotification {
  id: string;
  type: string;
  data: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}
