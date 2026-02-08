CREATE POLICY "Users can update own item files"
ON public.item_files FOR UPDATE
TO authenticated
USING (user_owns_item(item_id));