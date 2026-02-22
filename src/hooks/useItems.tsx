import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ItemWithCategory {
  id: string;
  name: string;
  notes: string | null;
  category_id: string | null;
  room_id: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_end_date: string | null;
  warranty_file_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  categories: { id: string; name: string } | null;
  rooms: { id: string; name: string } | null;
}

export function useItems(categoryFilter?: string, search?: string, roomFilter?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["items", user?.id, categoryFilter, search, roomFilter],
    queryFn: async () => {
      let q = supabase
        .from("items")
        .select("*, categories(id, name), rooms(id, name)")
        .order("created_at", { ascending: false });

      if (categoryFilter) q = q.eq("category_id", categoryFilter);
      if (roomFilter) q = q.eq("room_id", roomFilter);
      if (search) q = q.ilike("name", `%${search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data as ItemWithCategory[];
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async (item: {
      name: string;
      category_id?: string | null;
      room_id?: string | null;
      notes?: string;
      purchase_date?: string | null;
      purchase_price?: number | null;
      warranty_end_date?: string | null;
      warranty_file_url?: string | null;
      phone?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("items")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      category_id?: string | null;
      room_id?: string | null;
      notes?: string;
      purchase_date?: string | null;
      purchase_price?: number | null;
      warranty_end_date?: string | null;
      warranty_file_url?: string | null;
      phone?: string | null;
    }) => {
      const { error } = await supabase.from("items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  return { ...query, addItem, updateItem, deleteItem };
}

export function useItem(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*, categories(id, name), rooms(id, name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as ItemWithCategory;
    },
    enabled: !!user && !!id,
  });
}
