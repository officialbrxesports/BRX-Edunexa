const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "ANNOUNCEMENT" | "REMINDER" | "SUCCESS" | "WARNING" | "ALERT";
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string | null;
    role: string;
  } | null;
};

export type NotificationResponse = {
  items: NotificationItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

async function request<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function getNotifications(
  token: string,
  params?: {
    search?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  },
) {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";

  return request<NotificationResponse>(
    `/notifications${suffix}`,
    token,
  );
}

export function getUnreadCount(token: string) {
  return request<{ unread: number }>(
    "/notifications/unread-count",
    token,
  );
}

export function markNotification(
  token: string,
  notificationId: string,
  isRead: boolean,
) {
  return request<{
    id: string;
    isRead: boolean;
    readAt: string | null;
  }>(
    `/notifications/${notificationId}/read`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ isRead }),
    },
  );
}

export function markAllNotificationsRead(token: string) {
  return request<{ updated: number }>(
    "/notifications/read-all",
    token,
    {
      method: "PATCH",
    },
  );
}

export function deleteNotification(
  token: string,
  notificationId: string,
) {
  return request<{ success: boolean; id: string }>(
    `/notifications/${notificationId}`,
    token,
    {
      method: "DELETE",
    },
  );
}
