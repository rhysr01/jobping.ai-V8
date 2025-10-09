-- Clear all users and related data from the database
-- Run this in Supabase SQL Editor to start fresh for testing

-- Delete all matches first (foreign key constraint)
DELETE FROM public.matches;

-- Delete all users
DELETE FROM public.users;

-- Delete promo pending entries
DELETE FROM public.promo_pending;

-- Verify deletion
SELECT 'Users deleted' as status, COUNT(*) as remaining_users FROM public.users;
SELECT 'Matches deleted' as status, COUNT(*) as remaining_matches FROM public.matches;
SELECT 'Promo pending deleted' as status, COUNT(*) as remaining_promos FROM public.promo_pending;

