import { JobListing } from '../types';
import { config } from '../config';
import { getSriLankanJobListings } from './sriLankanJobService';

// 30-minute in-memory cache for live listings
interface CacheEntry {
  timestamp: number;
  data: JobListing[];
}
let cachedLiveJobs: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

// Common tech and professional keywords to extract from job descriptions
const KNOWN_SKILLS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', '.NET',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux',
  'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Vue', 'Angular',
  'Machine Learning', 'Data Analysis', 'SQL', 'Pandas', 'TensorFlow', 'PyTorch',
  'Figma', 'UI Design', 'UX Research', 'Agile', 'Scrum', 'Product Management',
  'JIRA', 'Git', 'DevOps', 'Microservices', 'Unit Testing', 'Spring Boot', 'Django'
];

/**
 * Extracts skills from job title and description text.
 */
function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    const skillLower = skill.toLowerCase();
    // Match whole words or boundary patterns
    const regex = new RegExp(`\\b${skillLower.replace(/[.+]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      matched.push(skill);
    }
  }

  return matched.slice(0, 10);
}

/**
 * Strips HTML tags from job descriptions
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetches live listings from Adzuna API when configured.
 */
async function fetchAdzunaJobs(country = 'gb', what?: string): Promise<JobListing[]> {
  const { adzunaAppId, adzunaApiKey } = config.jobProvider;
  if (!adzunaAppId || !adzunaApiKey) return [];

  try {
    const query = what ? `&what=${encodeURIComponent(what)}` : '';
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${adzunaAppId}&app_key=${adzunaApiKey}&results_per_page=20${query}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Adzuna error ${res.status}`);

    const data = await res.json() as any;
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((j: any): JobListing => {
      const skills = extractSkills(`${j.title} ${j.description}`);
      return {
        id: `adzuna-${j.id}`,
        providerName: 'adzuna',
        externalJobId: String(j.id),
        title: j.title,
        company: j.company?.display_name || 'Employer',
        location: j.location?.display_name || 'Various',
        country: country.toUpperCase(),
        employmentType: j.contract_type || 'Full-time',
        workplaceType: 'Onsite',
        description: j.description || '',
        requiredSkills: skills.slice(0, 5),
        preferredSkills: skills.slice(5, 8),
        salaryInformation: j.salary_min ? `${j.salary_min} - ${j.salary_max}` : undefined,
        postingDate: j.created,
        lastVerifiedAt: new Date().toISOString(),
        sourceStatus: 'verified',
        applicationUrl: j.redirect_url,
        isDemo: false,
        createdAt: j.created,
        updatedAt: new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn('[JobProvider] Adzuna fetch failed:', (err as Error).message);
    return [];
  }
}

/**
 * Main Job Service: returns verified, real live vacancies from active provider APIs.
 */
export async function getActiveJobListings(forceRefresh = false): Promise<JobListing[]> {
  const now = Date.now();

  // Return cached live jobs if fresh
  if (!forceRefresh && cachedLiveJobs && now - cachedLiveJobs.timestamp < CACHE_TTL_MS) {
    return cachedLiveJobs.data;
  }

  // Fetch exclusively from live Sri Lankan job portals (TopJobs.lk, ITJobs.lk, ExpressJobs.lk, LinkedIn LK)
  const sriLankanJobs = await getSriLankanJobListings();
  const liveJobs = [...sriLankanJobs];

  // Deduplicate by title+company
  const seen = new Set<string>();
  const deduplicated: JobListing[] = [];
  for (const job of liveJobs) {
    const key = `${job.title.toLowerCase()}::${job.company.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(job);
    }
  }

  cachedLiveJobs = {
    timestamp: now,
    data: deduplicated,
  };

  return deduplicated;
}
