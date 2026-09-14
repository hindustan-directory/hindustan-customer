import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { notificationsApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthProvider";

/**
 * Unread in-app notification count, refreshed whenever the calling screen
 * regains focus. Silently no-ops (count 0) when signed out or on error so it
 * never blocks a screen — the badge just hides.
 */
export function useUnreadNotifications() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    try {
      const data = await notificationsApi.unreadCount();
      setCount(data.count);
    } catch {
      // badge is best-effort; keep last known count on transient errors
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { count, refresh };
}
