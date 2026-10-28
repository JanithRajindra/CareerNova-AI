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

// Multi-industry skills and competencies across all career paths
const KNOWN_SKILLS = [
  // Tech & Software
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', '.NET',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux',
  'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Vue', 'Angular',
  'Machine Learning', 'Data Analysis', 'SQL', 'Pandas', 'TensorFlow', 'PyTorch',
  'Figma', 'UI Design', 'UX Research', 'Agile', 'Scrum', 'Product Management',
  'JIRA', 'Git', 'DevOps', 'Microservices', 'Unit Testing', 'Spring Boot', 'Django',
  // Accounting, Finance & Banking
  'Financial Analysis', 'Financial Reporting', 'Credit Risk Assessment', 'Cash Flow Modeling',
  'Auditing', 'External Auditing', 'IFRS / SLFRS', 'Internal Controls', 'Cost Optimization',
  'Management Accounting', 'Budgeting & Forecasting', 'Variance Analysis', 'Taxation', 'Corporate Banking',
  'CIMA', 'ACCA', 'CA Sri Lanka', 'CFA', 'Excel Financial Modeling', 'SAP S/4HANA',
  // Agriculture & Agribusiness
  'Agronomy', 'Crop Protection', 'Soil Nutrient Analysis', 'Field Trial Management',
  'GAP Certification', 'Farmer Advisory Services', 'Seed Production', 'Agricultural Extension',
  'Farm Operations', 'Precision Agriculture', 'Pest Management',
  // Business Management & Administration
  'Strategic Planning', 'Operations Management', 'Lean Manufacturing', 'Value Stream Mapping',
  'Continuous Improvement', 'Kaizen', 'Six Sigma', 'Production Scheduling', 'Capacity Planning',
  'Business Analysis', 'Market Research', 'Financial Valuation', 'Presentation Skills',
  // Marketing & Sales
  'Brand Management', 'Consumer Insights', 'Digital Marketing', 'Campaign Execution',
  'Trade Marketing', 'Distributor Operations', 'Sales Pipeline', 'Retail Negotiation',
  'SEO/SEM', 'Content Strategy', 'Social Media Marketing', 'Google Ads', 'CIM UK',
  // Human Resources
  'HR Business Partnering', 'Employee Relations', 'Sri Lankan Labor Law', 'Performance Management',
  'Talent Development', 'Talent Sourcing', 'Full-Cycle Recruitment', 'Grievance Handling',
  'Applicant Tracking Systems (ATS)', 'Employer Branding', 'CIPM',
  // Engineering & Manufacturing
  'Mechanical Maintenance', 'Predictive Maintenance', 'Rotating Machinery', 'Vibration Analysis',
  'Civil Engineering', 'Quality Assurance (QA/QC)', 'Material Testing', 'FIDIC Standards',
  'Site Inspection', 'AutoCAD', 'SolidWorks', 'Root Cause Analysis', 'Industrial Safety',
  // Healthcare & Life Sciences
  'Biomedical Instrumentation', 'Medical Equipment Calibration', 'Clinical Safety Standards',
  'Clinical Pharmacology', 'Prescription Auditing', 'Therapeutic Drug Monitoring',
  'Inpatient Pharmacy Operations', 'Patient Medication Counseling', 'ACHSI / ISO 15189',
  // Logistics & Supply Chain
  'Freight Forwarding', 'Customs Clearance (ASYCUDA)', 'Shipping Documentation', 'Ocean & Air Freight',
  'Multimodal Logistics', 'Supply Chain Operations', 'Purchase Order Tracking', 'Warehouse Management',
  'EDI Integration', 'Inventory Control', 'Incoterms 2020', 'CILT Certification',
  // Hospitality & Tourism
  'Food & Beverage Operations', 'Banquet Management', 'HACCP Standards', 'Guest Relations',
  'Hospitality Front Office', 'Sustainable Tourism', 'Customer Experience Management',
  // Education & Research
  'Academic Lecturing', 'Curriculum Development', 'Research Publication', 'Higher Education',
  'Student Mentoring', 'Coursework Assessment',
  // Construction & Trades
  'Structural Engineering', 'Site Supervision', 'Reinforced Concrete', 'BOQ Reconciliation',
  'Construction Safety', 'Subcontractor Management',
  // General & Graduate
  'Problem Solving', 'Communication Skills', 'Team Collaboration', 'Analytical Ability',
  'Critical Thinking', 'Project Coordination', 'MS Excel', 'PowerPoint Presentation'
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
