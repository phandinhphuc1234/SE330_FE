export function formatDate(value?: string | null, locale: "en" | "vi" = "en") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function money(value?: number | null, locale: "en" | "vi" = "en") {
  return typeof value === "number"
    ? `${value.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} VND`
    : "-";
}

export function recordId(record: { id?: number; borrowId?: number; holdId?: number; fineId?: number }) {
  return String(record.id ?? record.borrowId ?? record.holdId ?? record.fineId ?? "");
}

export function titleOf(record: { title?: string; bookTitle?: string }) {
  return record.bookTitle ?? record.title ?? "Untitled";
}

export function statusLabel(status?: string | null, locale: "en" | "vi" = "en") {
  if (!status) return "-";

  const normalizedStatus = status.trim().toUpperCase();
  const labels: Record<"en" | "vi", Record<string, string>> = {
    en: {
      BORROWED: "Borrowed",
      OVERDUE: "Overdue",
      RETURNED: "Returned",
      LOST: "Lost",
      ACTIVE: "Active",
      REVOKED: "Revoked",
      WAITING: "Waiting",
      NOTIFIED: "Notified",
      READY_FOR_PICKUP: "Ready for pickup",
      FULFILLED: "Fulfilled",
      EXPIRED: "Expired",
      CANCELLED: "Cancelled",
      CANCELED: "Cancelled",
      PAID: "Paid",
      UNPAID: "Unpaid",
      WAIVED: "Waived",
    },
    vi: {
      BORROWED: "Đang mượn",
      OVERDUE: "Quá hạn",
      RETURNED: "Đã trả",
      LOST: "Đã mất",
      ACTIVE: "Đang hiệu lực",
      REVOKED: "Đã thu hồi",
      WAITING: "Đang chờ",
      NOTIFIED: "Đã thông báo",
      READY_FOR_PICKUP: "Sẵn sàng nhận",
      FULFILLED: "Đã nhận",
      EXPIRED: "Đã hết hạn",
      CANCELLED: "Đã hủy",
      CANCELED: "Đã hủy",
      PAID: "Đã thanh toán",
      UNPAID: "Chưa thanh toán",
      WAIVED: "Đã miễn",
    },
  };

  return labels[locale][normalizedStatus] ?? status;
}
