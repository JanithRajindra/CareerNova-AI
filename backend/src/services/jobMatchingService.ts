import { JobListing, JobMatch, ParsedResume } from '../types';

/**
 * Benchmark job listings used strictly for deterministic unit tests and offline testing.
 */
export const BENCHMARK_JOB_FIXTURES: JobListing[] = [
  {
    id: 'demo-job-001',
    providerName: 'demo',
    externalJobId: 'demo-001',
    title: 'Senior Software Engineer – Full Stack',
    company: 'Sysco LABS Sri Lanka',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Hybrid',
    description: 'We are seeking an experienced Full Stack Software Engineer to join our product engineering team. You will design, develop, and maintain scalable web applications using React, Node.js, and PostgreSQL. You will collaborate with cross-functional teams to deliver high-quality software solutions.',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Git'],
    preferredSkills: ['AWS', 'Docker', 'Microservices', 'GraphQL', 'Redis'],
    experienceRequirements: '4+ years of professional software development experience',
    educationRequirements: "Bachelor's degree in Computer Science or related field, or equivalent experience",
    salaryInformation: 'LKR 250,000 – 450,000 per month',
    postingDate: '2026-10-20',
    closingDate: '2026-11-20',
    lastVerifiedAt: '2026-10-20',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-20T00:00:00Z',
    updatedAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'demo-job-002',
    providerName: 'demo',
    externalJobId: 'demo-002',
    title: 'Data Scientist',
    company: 'hSenid Mobile',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Remote',
    description: 'Join our AI/ML team to build data-driven solutions for telecom clients. You will work on predictive modeling, NLP, and data pipeline development. You should have strong Python skills and experience with machine learning frameworks.',
    requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Pandas', 'Scikit-learn', 'Data Analysis'],
    preferredSkills: ['TensorFlow', 'PyTorch', 'Spark', 'AWS SageMaker', 'NLP'],
    experienceRequirements: '3+ years in data science or machine learning',
    educationRequirements: "Master's degree in Data Science, Statistics, or related field preferred",
    salaryInformation: 'LKR 200,000 – 350,000 per month',
    postingDate: '2026-10-22',
    lastVerifiedAt: '2026-10-22',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-22T00:00:00Z',
    updatedAt: '2026-10-22T00:00:00Z',
  },
  {
    id: 'demo-job-003',
    providerName: 'demo',
    externalJobId: 'demo-003',
    title: 'Product Manager',
    company: 'WSO2',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Hybrid',
    description: 'Lead product strategy and roadmap for our integration platform. Work closely with engineering, design, and sales teams to deliver customer value. Define product requirements and prioritize features based on market needs.',
    requiredSkills: ['Product Management', 'Agile', 'Roadmap Planning', 'Stakeholder Management', 'User Research'],
    preferredSkills: ['API Management', 'Integration Platforms', 'B2B SaaS', 'JIRA', 'Analytics'],
    experienceRequirements: '5+ years in product management, preferably in enterprise software',
    educationRequirements: "Bachelor's degree required; MBA preferred",
    salaryInformation: 'Competitive',
    postingDate: '2026-10-18',
    lastVerifiedAt: '2026-10-18',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-18T00:00:00Z',
    updatedAt: '2026-10-18T00:00:00Z',
  },
  {
    id: 'demo-job-004',
    providerName: 'demo',
    externalJobId: 'demo-004',
    title: 'DevOps Engineer',
    company: 'IronOne Technologies',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Onsite',
    description: 'Design and maintain CI/CD pipelines, cloud infrastructure, and monitoring systems. Collaborate with development teams to improve deployment processes and system reliability.',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Terraform'],
    preferredSkills: ['Jenkins', 'Ansible', 'Prometheus', 'Grafana', 'Python', 'Bash'],
    experienceRequirements: '3+ years in DevOps or infrastructure engineering',
    educationRequirements: "Bachelor's degree in Computer Science or equivalent",
    postingDate: '2026-10-15',
    lastVerifiedAt: '2026-10-15',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
  },
  {
    id: 'demo-job-005',
    providerName: 'demo',
    externalJobId: 'demo-005',
    title: 'UI/UX Designer',
    company: 'Virtusa',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Hybrid',
    description: 'Create intuitive and visually appealing user interfaces for enterprise applications. Conduct user research, create wireframes, prototypes, and high-fidelity designs.',
    requiredSkills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'User Testing', 'Design Systems'],
    preferredSkills: ['Adobe XD', 'Sketch', 'CSS', 'HTML', 'Motion Design', 'Accessibility'],
    experienceRequirements: '3+ years in UI/UX design',
    educationRequirements: "Bachelor's degree in Design, HCI, or related field",
    postingDate: '2026-10-21',
    lastVerifiedAt: '2026-10-21',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-21T00:00:00Z',
    updatedAt: '2026-10-21T00:00:00Z',
  },
  {
    id: 'demo-job-006',
    providerName: 'demo',
    externalJobId: 'demo-006',
    title: 'Backend Engineer – Python/Django',
    company: 'Calcey Technologies',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Remote',
    description: 'Build robust backend services and APIs for our SaaS platform using Python, Django, and PostgreSQL. Write clean, testable code and participate in code reviews.',
    requiredSkills: ['Python', 'Django', 'PostgreSQL', 'REST APIs', 'Git', 'Unit Testing'],
    preferredSkills: ['Django REST Framework', 'Celery', 'Redis', 'AWS', 'Docker'],
    experienceRequirements: '3+ years Python backend development',
    educationRequirements: "Bachelor's degree in CS or equivalent experience",
    salaryInformation: 'LKR 180,000 – 320,000 per month',
    postingDate: '2026-10-23',
    lastVerifiedAt: '2026-10-23',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-23T00:00:00Z',
    updatedAt: '2026-10-23T00:00:00Z',
  },
  {
    id: 'demo-job-007',
    providerName: 'demo',
    externalJobId: 'demo-007',
    title: 'Marketing Manager – Digital',
    company: 'Dialog Axiata',
    location: 'Colombo, Sri Lanka',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Hybrid',
    description: 'Lead digital marketing campaigns across social media, email, and paid advertising channels. Analyze campaign performance metrics and optimize for ROI.',
    requiredSkills: ['Digital Marketing', 'SEO/SEM', 'Social Media Marketing', 'Google Ads', 'Analytics', 'Content Strategy'],
    preferredSkills: ['HubSpot', 'Salesforce Marketing Cloud', 'A/B Testing', 'CRM', 'Video Marketing'],
    experienceRequirements: '5+ years in digital marketing',
    educationRequirements: "Bachelor's degree in Marketing, Business, or Communications",
    postingDate: '2026-10-19',
    lastVerifiedAt: '2026-10-19',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-19T00:00:00Z',
    updatedAt: '2026-10-19T00:00:00Z',
  },
  {
    id: 'demo-job-008',
    providerName: 'demo',
    externalJobId: 'demo-008',
    title: 'Senior React Developer',
    company: 'Zoho Corporation (Remote)',
    location: 'Remote – Sri Lanka preferred',
    country: 'LK',
    employmentType: 'Full-time',
    workplaceType: 'Remote',
    description: 'Build and maintain enterprise-grade React applications. Work with design and backend teams to implement pixel-perfect, performant user interfaces.',
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'State Management'],
    preferredSkills: ['Redux', 'React Query', 'Next.js', 'Tailwind CSS', 'Testing Library', 'Storybook'],
    experienceRequirements: '4+ years React development',
    educationRequirements: "Bachelor's degree or equivalent experience",
    postingDate: '2026-10-24',
    lastVerifiedAt: '2026-10-24',
    sourceStatus: 'demo',
    applicationUrl: '#demo',
    isDemo: true,
    createdAt: '2026-10-24T00:00:00Z',
    updatedAt: '2026-10-24T00:00:00Z',
  },
];

/**
 * Job matching algorithm.
 * Weights: Required Skills 40%, Experience 25%, Responsibilities 15%, Education 10%, Preferred Skills 10%
 */
export function calculateJobMatch(parsed: ParsedResume, job: JobListing): JobMatch {
  const resumeText = parsed.rawText.toLowerCase();
  const resumeSkills = parsed.skills.map((s) => s.toLowerCase());

  // Required skills matching (40%)
  const reqMatched = job.requiredSkills.filter((skill) => {
    const lowerSkill = skill.toLowerCase();
    return resumeSkills.some((rs) => rs.includes(lowerSkill) || lowerSkill.includes(rs)) ||
           resumeText.includes(lowerSkill);
  });
  const reqScore = job.requiredSkills.length > 0 ? reqMatched.length / job.requiredSkills.length : 1;

  // Preferred skills (10%)
  const prefMatched = job.preferredSkills.filter((skill) => {
    const lowerSkill = skill.toLowerCase();
    return resumeSkills.some((rs) => rs.includes(lowerSkill) || lowerSkill.includes(rs)) ||
           resumeText.includes(lowerSkill);
  });
  const prefScore = job.preferredSkills.length > 0 ? prefMatched.length / job.preferredSkills.length : 0;

  // Experience relevance (25%) — keyword overlap with job description
  const expKeywords = extractImportantWords(job.description);
  const expInResume = expKeywords.filter((kw) => resumeText.includes(kw));
  const expScore = expKeywords.length > 0 ? expInResume.length / expKeywords.length : 0.5;

  // Responsibilities/transferable (15%) — job title keywords
  const titleWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const titleMatched = titleWords.filter((w) => resumeText.includes(w));
  const respScore = titleWords.length > 0 ? titleMatched.length / titleWords.length : 0.5;

  // Education (10%) — simple heuristic
  let eduScore = 0.5;
  if (job.educationRequirements) {
    const eduReq = job.educationRequirements.toLowerCase();
    if (parsed.education.length > 0) {
      eduScore = 0.8;
      // Check for degree level match
      if (/master|msc|mba/i.test(eduReq) && parsed.education.some((e) => /master|msc|mba/i.test(e.degree || ''))) {
        eduScore = 1.0;
      } else if (/bachelor|bsc|degree/i.test(eduReq) && parsed.education.some((e) => /bachelor|bsc|degree/i.test(e.degree || ''))) {
        eduScore = 1.0;
      }
    } else {
      eduScore = 0.3;
    }
  }

  // Weighted total
  const totalScore = Math.round(
    (reqScore * 0.40 + prefScore * 0.10 + expScore * 0.25 + respScore * 0.15 + eduScore * 0.10) * 100
  );

  // Missing requirements
  const missingRequired = job.requiredSkills.filter((s) => !reqMatched.includes(s));
  const matchedSkills = [...reqMatched, ...prefMatched];

  // Explanations
  const explanations: string[] = [];
  if (reqMatched.length > 0) explanations.push(`Matched ${reqMatched.length}/${job.requiredSkills.length} required skills`);
  if (prefMatched.length > 0) explanations.push(`Matched ${prefMatched.length}/${job.preferredSkills.length} preferred skills`);
  if (missingRequired.length > 0) explanations.push(`Missing required: ${missingRequired.slice(0, 3).join(', ')}`);

  return {
    id: `match-${job.id}`,
    jobListing: job,
    matchScore: Math.min(Math.max(totalScore, 0), 100),
    matchedSkills: [...new Set(matchedSkills)],
    missingRequirements: missingRequired,
    explanations,
    scoreBreakdown: {
      requiredSkills: Math.round(reqScore * 100),
      experience: Math.round(expScore * 100),
      responsibilities: Math.round(respScore * 100),
      education: Math.round(eduScore * 100),
      preferredSkills: Math.round(prefScore * 100),
    },
  };
}

function extractImportantWords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'will', 'would', 'should', 'you', 'we', 'our', 'your', 'their', 'this', 'that', 'have', 'has', 'be', 'been']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 30);
}

export function getRecommendations(parsed: ParsedResume, minScore = 0): JobMatch[] {
  return BENCHMARK_JOB_FIXTURES
    .map((job) => calculateJobMatch(parsed, job))
    .filter((match) => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}
