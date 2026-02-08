import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const DEFAULT_CATEGORIES = ["סלון", "מטבח", "חדר שינה", "חדר אמבטיה", "חדר עבודה", "אלקטרוניקה", "ריהוט", "אחר"];

export function useCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const ensureDefaults = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { data: existing } = await supabase.from("categories").select("name");
      const existingNames = new Set(existing?.map((c) => c.name));
      const missing = DEFAULT_CATEGORIES.filter((n) => !existingNames.has(n));
      if (missing.length > 0) {
        const { error } = await supabase
          .from("categories")
          .insert(missing.map((name) => ({ name, user_id: user.id })));
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const addCategory = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("categories").insert({ name, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  return { ...query, ensureDefaults, addCategory };
}
