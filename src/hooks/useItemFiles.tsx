import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useItemFiles(itemId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["item_files", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_files")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!itemId,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const filePath = `${user.id}/${itemId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("item-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("item_files").insert({
        item_id: itemId,
        file_name: file.name,
        file_path: filePath,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["item_files", itemId] }),
  });

  const deleteFile = useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      await supabase.storage.from("item-files").remove([file_path]);
      const { error } = await supabase.from("item_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["item_files", itemId] }),
  });

  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from("item-files").createSignedUrl(filePath, 3600);
    return data;
  };

  return { ...query, uploadFile, deleteFile, getFileUrl };
}
