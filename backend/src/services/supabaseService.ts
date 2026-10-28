import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { ParsedResume, JobApplication, UserProfile, ATSScore } from '../types';

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
  if (!config.supabase.url || !key) return null;

  supabaseAdminInstance = createClient(config.supabase.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseAdminInstance;
}

// ============================================================================
// Supabase Private Storage Operations
// ============================================================================

export async function uploadResumeToStorage(
  userId: string,
  resumeId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${resumeId}-${cleanFilename}`;

    const { error } = await supabase.storage
      .from(config.storage.bucket)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('[Storage] Supabase storage upload warning:', error.message);
      return null;
    }

    return storagePath;
  } catch (err) {
    console.warn('[Storage] Upload error:', (err as Error).message);
    return null;
  }
}

export async function getSignedResumeUrl(storagePath: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !storagePath) return null;

  try {
    const { data, error } = await supabase.storage
      .from(config.storage.bucket)
      .createSignedUrl(storagePath, 300); // 5 minutes

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function deleteResumeFromStorage(storagePath: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !storagePath) return false;

  try {
    const { error } = await supabase.storage
      .from(config.storage.bucket)
      .remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// Supabase Database CRUD Operations
// ============================================================================

export async function dbSaveResume(data: {
  id: string;
  userId: string;
  originalFilename: string;
  storagePath?: string | null;
  fileType: string;
  fileSize: number;
  extractedText: string;
  parsedContent: ParsedResume;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('resumes').insert({
      id: data.id,
      user_id: data.userId,
      original_filename: data.originalFilename,
      storage_path: data.storagePath || null,
      file_type: data.fileType,
      file_size: data.fileSize,
      extracted_text: data.extractedText,
      parsed_content: data.parsedContent,
      processing_status: 'completed',
    });
    return !error;
  } catch {
    return false;
  }
}

export async function dbGetUserResumes(userId: string): Promise<any[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      originalFilename: r.original_filename,
      storagePath: r.storage_path,
      fileType: r.file_type,
      fileSize: r.file_size,
      parsedContent: r.parsed_content,
      processingStatus: r.processing_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      nameDetected: r.parsed_content?.fullName,
    }));
  } catch {
    return null;
  }
}

export async function dbGetResumeById(id: string, userId: string): Promise<any | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      originalFilename: data.original_filename,
      storagePath: data.storage_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      extractedText: data.extracted_text,
      parsedContent: data.parsed_content,
      processingStatus: data.processing_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

export async function dbDeleteResume(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

export async function dbSaveAnalysis(data: {
  id: string;
  userId: string;
  resumeId: string;
  score: ATSScore;
  targetJobTitle?: string;
  targetJobDescription?: string;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('resume_analyses').insert({
      id: data.id,
      user_id: data.userId,
      resume_id: data.resumeId,
      overall_score: data.score.overall,
      scoring_version: data.score.analysisVersion || '1.0.0',
      category_scores: data.score.categories,
      findings: data.score.findings,
      recommendations: data.score.recommendations,
      analysis_completeness: data.score.completeness,
      target_job_title: data.targetJobTitle || null,
      target_job_description: data.targetJobDescription || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function dbGetUserAnalyses(userId: string): Promise<any[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return null;
    return data.map((a: any) => ({
      id: a.id,
      resumeId: a.resume_id,
      overallScore: a.overall_score,
      band: a.overall_score >= 90 ? 'strong' : a.overall_score >= 75 ? 'good' : a.overall_score >= 60 ? 'fair' : 'needs_improvement',
      bandLabel: a.overall_score >= 90 ? 'Strong ATS Readiness' : a.overall_score >= 75 ? 'Good Readiness' : a.overall_score >= 60 ? 'Fair' : 'Needs Improvement',
      targetJobTitle: a.target_job_title,
      createdAt: a.created_at,
    }));
  } catch {
    return null;
  }
}

export async function dbSaveApplication(app: JobApplication): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('job_applications').insert({
      id: app.id,
      user_id: app.userId,
      job_listing_id: app.jobListingId,
      resume_id: app.resumeId || null,
      status: app.status,
      applied_at: app.appliedAt || null,
      notes: app.notes || '',
      follow_up_at: app.followUpAt || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function dbGetUserApplications(userId: string, status?: string): Promise<JobApplication[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    let query = supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((a: any): JobApplication => ({
      id: a.id,
      userId: a.user_id,
      jobListingId: a.job_listing_id,
      resumeId: a.resume_id || undefined,
      status: a.status,
      appliedAt: a.applied_at || undefined,
      notes: a.notes || '',
      followUpAt: a.follow_up_at || undefined,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  } catch {
    return null;
  }
}

export async function dbDeleteAccountData(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    // Cascade deletes in PostgreSQL handle related records automatically
    await supabase.from('profiles').delete().eq('id', userId);
    await supabase.from('user_preferences').delete().eq('user_id', userId);
    await supabase.from('resumes').delete().eq('user_id', userId);
    await supabase.from('saved_jobs').delete().eq('user_id', userId);
    await supabase.from('job_applications').delete().eq('user_id', userId);
    return true;
  } catch {
    return false;
  }
}

export async function dbGetProfileAndPreferences(userId: string): Promise<Partial<UserProfile> | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const [profileRes, prefRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const profileData = profileRes.data;
    const prefData = prefRes.data;

    if (!profileData && !prefData) return null;

    return {
      id: userId,
      fullName: profileData?.full_name || undefined,
      country: profileData?.country || undefined,
      experienceLevel: profileData?.experience_level || undefined,
      preferredIndustries: profileData?.preferred_industries || [],
      preferredJobTitles: prefData?.preferred_job_titles || profileData?.preferred_job_titles || [],
      preferredLocations: prefData?.preferred_locations || profileData?.preferred_locations || [],
      employmentPreferences: prefData?.preferred_employment_types || profileData?.employment_preferences || [],
      remotePreference: prefData?.remote_preference || profileData?.remote_preference || undefined,
      salaryRange: prefData?.salary_preferences || profileData?.salary_range || undefined,
      updatedAt: profileData?.updated_at || prefData?.updated_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function dbSaveProfileAndPreferences(
  userId: string,
  profile: Partial<UserProfile>
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  const now = new Date().toISOString();

  try {
    // 1. Save personal profile fields to profiles table
    const profilePayload: Record<string, any> = {
      id: userId,
      updated_at: now,
    };
    if (profile.fullName !== undefined) profilePayload.full_name = profile.fullName;
    if (profile.country !== undefined) profilePayload.country = profile.country;
    if (profile.experienceLevel !== undefined) profilePayload.experience_level = profile.experienceLevel;
    if (profile.preferredIndustries !== undefined) profilePayload.preferred_industries = profile.preferredIndustries;

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileErr) {
      console.warn('[Supabase] profiles upsert warning:', profileErr.message);
    }

    // 2. Save career targets and preferences to user_preferences table
    const prefPayload: Record<string, any> = {
      user_id: userId,
      updated_at: now,
    };
    if (profile.preferredJobTitles !== undefined) prefPayload.preferred_job_titles = profile.preferredJobTitles;
    if (profile.preferredLocations !== undefined) prefPayload.preferred_locations = profile.preferredLocations;
    if (profile.employmentPreferences !== undefined) prefPayload.preferred_employment_types = profile.employmentPreferences;
    if (profile.remotePreference !== undefined) prefPayload.remote_preference = profile.remotePreference;
    if (profile.salaryRange !== undefined) prefPayload.salary_preferences = profile.salaryRange;

    const { error: prefErr } = await supabase
      .from('user_preferences')
      .upsert(prefPayload, { onConflict: 'user_id' });

    if (prefErr) {
      console.warn('[Supabase] user_preferences upsert warning:', prefErr.message);
    }

    return !profileErr && !prefErr;
  } catch (err) {
    console.warn('[Supabase] save error:', (err as Error).message);
    return false;
  }
}
