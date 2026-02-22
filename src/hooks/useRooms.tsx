import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const DEFAULT_ROOMS = ["סלון", "מטבח", "חדר שינה", "חדר אמבטיה", "חדר עבודה", "חדר ילדים", "מרפסת", "מחסן", "גינה"];

export function useRooms() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["rooms", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const ensureDefaults = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { data: existing } = await supabase.from("rooms").select("name");
      const existingNames = new Set(existing?.map((r) => r.name));
      const missing = DEFAULT_ROOMS.filter((n) => !existingNames.has(n));
      if (missing.length > 0) {
        const { error } = await supabase
          .from("rooms")
          .insert(missing.map((name) => ({ name, user_id: user.id })));
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  const addRoom = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("rooms").insert({ name, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  return { ...query, ensureDefaults, addRoom };
}
