-- ============================================================================
-- CareerMatch AI - Database Migration 001: Initial Schema
-- PostgreSQL / Supabase Compatible
-- ============================================================================

-- Enable pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles (linked to auth.users in Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    country TEXT,
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_job_titles TEXT[] DEFAULT '{}',
    experience_level TEXT,
    employment_preferences TEXT[] DEFAULT '{}',
    remote_preference TEXT,
    preferred_industries TEXT[] DEFAULT '{}',
    salary_range JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Resumes
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_path TEXT,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    extracted_text TEXT,
    parsed_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    processing_status TEXT NOT NULL DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

-- 3. Resume Analyses
CREATE TABLE IF NOT EXISTS public.resume_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    scoring_version TEXT NOT NULL DEFAULT '1.0.0',
    category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    analysis_completeness INTEGER NOT NULL DEFAULT 100,
    target_job_title TEXT,
    target_job_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON public.resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_resume_id ON public.resume_analyses(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at ON public.resume_analyses(created_at DESC);

-- 4. Resume Suggestions (AI & Rule-based Improvements)
CREATE TABLE IF NOT EXISTS public.resume_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.resume_analyses(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    original_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    explanation TEXT NOT NULL,
    suggestion_type TEXT NOT NULL DEFAULT 'improvement',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_resume_suggestions_user_id ON public.resume_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_suggestions_resume_id ON public.resume_suggestions(resume_id);

-- 5. Job Listings
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL,
    external_job_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    country TEXT NOT NULL,
    employment_type TEXT,
    workplace_type TEXT,
    description TEXT NOT NULL,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience_requirements TEXT,
    education_requirements TEXT,
    salary_information TEXT,
    posting_date TIMESTAMPTZ,
    closing_date TIMESTAMPTZ,
    last_verified_at TIMESTAMPTZ,
    source_status TEXT NOT NULL DEFAULT 'verified' CHECK (source_status IN ('verified', 'unverified', 'stale', 'demo')),
    application_url TEXT NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_provider_external_id UNIQUE (provider_name, external_job_id)
);

CREATE INDEX IF NOT EXISTS idx_job_listings_country ON public.job_listings(country);
CREATE INDEX IF NOT EXISTS idx_job_listings_posting_date ON public.job_listings(posting_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_listings_title ON public.job_listings(title);

-- 6. Job Matches
CREATE TABLE IF NOT EXISTS public.job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
    matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanations JSONB NOT NULL DEFAULT '[]'::jsonb,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    scoring_version TEXT NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_resume_job UNIQUE (user_id, resume_id, job_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_resume_id ON public.job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON public.job_matches(match_score DESC);

-- 7. Saved Jobs
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_saved_job UNIQUE (user_id, job_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

-- 8. Job Applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'saved', 'preparing', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
    applied_at TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_job_application UNIQUE (user_id, job_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- 9. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_job_titles TEXT[] DEFAULT '{}',
    preferred_employment_types TEXT[] DEFAULT '{}',
    remote_preference TEXT,
    salary_preferences JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
