import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationPreferencesApi,
  type UpdatePreferenceInput,
} from "@/api/notifications.api";
import type { NotificationType } from "@/types";
import toast from "react-hot-toast";

/**
 * Get all notification preferences for current user
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const response = await notificationPreferencesApi.getPreferences();
      // Backend returns data as an array directly, not { preferences: [...] }
      return response.data ?? [];
    },
  });
}

/**
 * Update a single notification preference
 */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: NotificationType;
      data: UpdatePreferenceInput;
    }) => {
      const response = await notificationPreferencesApi.updatePreference(
        type,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Préférence mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
}
