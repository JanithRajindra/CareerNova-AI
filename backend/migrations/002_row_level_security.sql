-- ============================================================================
-- CareerMatch AI - Database Migration 002: Row Level Security (RLS)
-- ============================================================================

-- 1. Enable RLS on all user tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Resumes Policies (Strict Isolation)
CREATE POLICY "Users can only select their own resumes"
    ON public.resumes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own resumes"
    ON public.resumes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own resumes"
    ON public.resumes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own resumes"
    ON public.resumes FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Resume Analyses Policies
CREATE POLICY "Users can only view their own analyses"
    ON public.resume_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own analyses"
    ON public.resume_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own analyses"
    ON public.resume_analyses FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Resume Suggestions Policies
CREATE POLICY "Users can only view their own suggestions"
    ON public.resume_suggestions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own suggestions"
    ON public.resume_suggestions FOR UPDATE
    USING (auth.uid() = user_id);

-- 6. Job Listings Policies (Public Read)
CREATE POLICY "Anyone can view active job listings"
    ON public.job_listings FOR SELECT
    USING (true);

-- 7. Job Matches Policies
CREATE POLICY "Users can only view their own job matches"
    ON public.job_matches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job matches"
    ON public.job_matches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 8. Saved Jobs Policies
CREATE POLICY "Users can only view their own saved jobs"
    ON public.saved_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs"
    ON public.saved_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove saved jobs"
    ON public.saved_jobs FOR DELETE
    USING (auth.uid() = user_id);

-- 9. Job Applications Policies
CREATE POLICY "Users can only view their own applications"
    ON public.job_applications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert applications"
    ON public.job_applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
    ON public.job_applications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
    ON public.job_applications FOR DELETE
    USING (auth.uid() = user_id);

-- 10. User Preferences Policies
CREATE POLICY "Users can manage their preferences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- Supabase Storage Configuration (Private Resumes Bucket)
-- ============================================================================
-- Note: Create bucket 'resumes' set to private (public = false) in Supabase.
-- Storage RLS policies:
-- INSERT: (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
-- SELECT: (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
-- DELETE: (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
