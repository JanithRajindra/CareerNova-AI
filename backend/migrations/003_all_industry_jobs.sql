-- ============================================================================
-- CareerMatch AI - Database Migration 003: All-Industry Vacancy Support
-- ============================================================================

-- 1. Add industry category column to job_listings if not present
ALTER TABLE public.job_listings ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON public.job_listings(category);

-- 2. Add composite index on saved_jobs for fast user lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_listing ON public.saved_jobs(user_id, job_listing_id);

-- 3. Add composite index on job_matches for candidate recommendations lookup
CREATE INDEX IF NOT EXISTS idx_job_matches_user_resume ON public.job_matches(user_id, resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_user_job ON public.job_matches(user_id, job_listing_id);
