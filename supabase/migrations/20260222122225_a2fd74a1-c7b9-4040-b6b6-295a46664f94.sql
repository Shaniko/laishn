ALTER TABLE public.items
  ADD COLUMN purchase_date date,
  ADD COLUMN purchase_price numeric,
  ADD COLUMN warranty_end_date date,
  ADD COLUMN warranty_file_url text,
  ADD COLUMN phone text;