-- ==============================================================================
-- MIGRATION: ADD TEKNISI ROLE & TEKNIK DEPARTMENTS
-- Menambahkan role 'teknisi' ke enum app_role dan master data departemen
-- Format: TEKNIK | TEKNIK1201 | TEKNISI CENTRAL KITCHEN & TES GROUND
-- ==============================================================================

-- 1. Tambahkan nilai 'teknisi' ke public.app_role jika belum ada
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teknisi';

-- 2. Tambahkan departemen TEKNIK (TEKNIK1201) & TES GROUND (TES1201) ke tabel public.departments
INSERT INTO public.departments (name, code, description)
VALUES 
  ('TEKNIK', 'TEKNIK1201', 'TEKNISI CENTRAL KITCHEN / TES GROUND'),
  ('TES GROUND', 'TES1201', 'TEKNISI TES GROUND')
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  description = EXCLUDED.description;
