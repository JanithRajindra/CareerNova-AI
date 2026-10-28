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
 * Transparent, deterministic job matching engine across all industries.
 *
 * Scoring weights (total 100%):
 * - Required Skills: 30%
 * - Preferred Skills: 10% (normalized if job does not list preferred skills)
 * - Experience & Seniority: 20%
 * - Job Title & Role Responsibilities: 15%
 * - Education & Certifications: 15% (normalized if job does not list education reqs)
 * - Location Compatibility: 5%
 * - Workplace & Employment Type: 5%
 */
const SKILL_SYNONYMS: Record<string, string[]> = {
  // Web & Frontend
  'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'react native', 'redux'],
  'react.js': ['react', 'reactjs', 'next.js', 'nextjs'],
  'next.js': ['nextjs', 'react', 'react.js'],
  'vue': ['vue.js', 'vuejs', 'nuxt', 'nuxtjs'],
  'angular': ['angular.js', 'angularjs', 'angular 2+'],
  'typescript': ['ts', 'javascript', 'js'],
  'javascript': ['js', 'typescript', 'es6'],
  'html': ['html5', 'web'],
  'css': ['css3', 'tailwind', 'tailwindcss', 'sass', 'scss', 'bootstrap'],
  'tailwind': ['tailwindcss', 'css'],

  // Backend & Languages
  'node.js': ['nodejs', 'node', 'express', 'express.js', 'nest.js', 'nestjs'],
  'nodejs': ['node.js', 'node', 'express', 'nest.js'],
  'express': ['express.js', 'node.js', 'nodejs'],
  'python': ['python3', 'django', 'fastapi', 'flask'],
  'django': ['python', 'python3'],
  'fastapi': ['python', 'python3'],
  'java': ['spring', 'spring boot', 'j2ee'],
  'spring boot': ['spring', 'java'],
  'c#': ['.net', 'asp.net', 'dotnet', 'c sharp'],
  '.net': ['c#', 'asp.net', 'dotnet'],
  'php': ['laravel', 'symfony'],
  'golang': ['go', 'go lang'],

  // Databases
  'sql': ['postgresql', 'postgres', 'mysql', 'mssql', 'sql server', 'sqlite', 'mariadb', 'relational'],
  'postgresql': ['postgres', 'sql', 'rdbms'],
  'postgres': ['postgresql', 'sql'],
  'mysql': ['sql', 'mariadb'],
  'mongodb': ['mongo', 'nosql', 'documentdb'],
  'redis': ['in-memory', 'cache', 'caching'],

  // Cloud & DevOps
  'aws': ['amazon web services', 'ec2', 's3', 'lambda', 'cloud'],
  'azure': ['microsoft azure', 'cloud'],
  'gcp': ['google cloud', 'google cloud platform', 'cloud'],
  'cloud': ['aws', 'azure', 'gcp', 'cloud computing'],
  'docker': ['containers', 'containerization', 'kubernetes', 'k8s'],
  'kubernetes': ['k8s', 'docker', 'container orchestration'],
  'ci/cd': ['continuous integration', 'continuous delivery', 'github actions', 'jenkins', 'gitlab ci', 'devops'],
  'git': ['github', 'gitlab', 'version control', 'bitbucket'],

  // Architecture & APIs
  'rest': ['restful', 'rest api', 'rest apis', 'api development', 'graphql', 'microservices'],
  'rest apis': ['rest', 'restful', 'api', 'graphql', 'microservices'],
  'microservices': ['microservice', 'distributed systems', 'rest apis'],

  // Testing & Quality
  'testing': ['unit testing', 'jest', 'cypress', 'playwright', 'selenium', 'qa', 'test automation'],
  'qa': ['quality assurance', 'testing', 'automation testing', 'manual testing'],

  // Business, Accounting & Finance
  'financial analysis': ['cash flow modeling', 'financial modeling', 'credit risk', 'cima', 'acca', 'cfa', 'commercial banking'],
  'credit risk': ['credit analysis', 'credit risk assessment', 'commercial credit', 'lending'],
  'credit risk assessment': ['credit risk', 'credit analysis', 'financial analysis', 'cima'],
  'cash flow modeling': ['financial modeling', 'financial analysis', 'valuation', 'excel financial modeling'],
  'corporate banking': ['commercial banking', 'banking', 'credit analysis', 'financial analysis'],
  'accounting': ['financial accounting', 'management accounting', 'bookkeeping', 'cima', 'acca', 'ca sri lanka', 'quickbooks', 'audit'],
  'cima': ['management accounting', 'financial analysis', 'accounting', 'acca', 'ca sri lanka'],
  'acca': ['accounting', 'audit', 'financial analysis', 'cima'],
  'cfa': ['financial analysis', 'investment', 'portfolio management'],

  // Human Resources
  'human resources': ['hr', 'hrm', 'cipm', 'talent acquisition', 'recruitment', 'employee relations'],
  'talent acquisition': ['recruitment', 'sourcing', 'hiring', 'talent management'],
  'cipm': ['human resources', 'hrm', 'hr management'],

  // Healthcare
  'pharmacology': ['clinical pharmacology', 'pharmacy', 'prescription auditing', 'slmc', 'therapeutic drug monitoring'],
  'clinical pharmacology': ['pharmacology', 'pharmacy', 'prescription auditing', 'slmc'],
  'slmc': ['medical council', 'registered pharmacist', 'doctor'],

  // Agriculture
  'agronomy': ['crop protection', 'soil nutrient analysis', 'field trial management', 'gap certification', 'agribusiness'],
  'crop protection': ['agronomy', 'pest management', 'soil science'],
  'gap certification': ['good agricultural practices', 'agronomy', 'quality standards'],

  // Marketing & Sales
  'digital marketing': ['seo', 'sem', 'google ads', 'social media marketing', 'content strategy'],
  'b2b sales': ['sales', 'business development', 'lead generation', 'crm', 'salesforce'],
};

function checkSkillMatch(skillLower: string, resumeSkills: string[], resumeText: string): boolean {
  // 1. Direct or substring match
  if (resumeSkills.some((rs) => rs === skillLower || rs.includes(skillLower) || skillLower.includes(rs))) {
    return true;
  }
  if (resumeText.includes(skillLower)) {
    return true;
  }

  // 2. Check synonyms cluster
  const synonyms = SKILL_SYNONYMS[skillLower] || [];
  for (const syn of synonyms) {
    if (resumeSkills.some((rs) => rs === syn || rs.includes(syn) || syn.includes(rs))) {
      return true;
    }
    if (resumeText.includes(syn)) {
      return true;
    }
  }

  // 3. Normalized punctuation comparison (e.g. "node.js" vs "nodejs")
  const normSkill = skillLower.replace(/[.\-_\s]/g, '');
  if (normSkill.length > 2) {
    if (resumeSkills.some((rs) => rs.replace(/[.\-_\s]/g, '') === normSkill)) {
      return true;
    }
    const normText = resumeText.replace(/[.\-_\s]/g, '');
    if (normText.includes(normSkill)) {
      return true;
    }
  }

  return false;
}

export function calculateJobMatch(parsed: ParsedResume, job: JobListing): JobMatch {
  const resumeText = (parsed.rawText || '').toLowerCase();
  const resumeSkills = (parsed.skills || []).map((s) => s.toLowerCase());

  // Check if CV is incomplete or sparse
  const hasSparseData = (parsed.skills || []).length === 0 && (parsed.experience || []).length === 0;

  // 1. Required Skills (30%)
  const reqSkills = job.requiredSkills || [];
  const reqMatched: string[] = [];
  const reqMissing: string[] = [];

  for (const skill of reqSkills) {
    const sLower = skill.toLowerCase();
    if (checkSkillMatch(sLower, resumeSkills, resumeText)) {
      reqMatched.push(skill);
    } else {
      reqMissing.push(skill);
    }
  }

  const reqScore = reqSkills.length > 0 ? reqMatched.length / reqSkills.length : 1.0;

  // 2. Preferred Skills (10%)
  const prefSkills = job.preferredSkills || [];
  const prefMatched: string[] = [];

  for (const skill of prefSkills) {
    const sLower = skill.toLowerCase();
    if (checkSkillMatch(sLower, resumeSkills, resumeText)) {
      prefMatched.push(skill);
    }
  }

  // If employer didn't specify preferred skills, do not penalize candidate; if specified, scale based on matched
  const prefScore = prefSkills.length > 0
    ? Math.min(1.0, 0.4 + (prefMatched.length / prefSkills.length) * 0.6)
    : 1.0;

  // 3. Experience & Seniority (20%)
  const expKeywords = extractImportantWords(job.description || '');
  const expInResume = expKeywords.filter((kw) => resumeText.includes(kw));
  const keywordRatio = expKeywords.length > 0
    ? Math.min(1.0, expInResume.length / Math.min(expKeywords.length, 6))
    : 0.5;

  const candidateExps = parsed.experience || [];
  const candidateTitles = candidateExps.map((e) => (e.jobTitle || '').toLowerCase()).join(' ');

  // Seniority detection
  const jobReq = (job.experienceRequirements || '').toLowerCase();
  let seniorityScore = 0.6;
  if (/senior|lead|head|manager|director|architect|specialist/i.test(jobReq)) {
    if (/senior|lead|manager|director|architect|head|specialist|analyst/i.test(candidateTitles) || candidateExps.length >= 2) {
      seniorityScore = 1.0;
    } else if (candidateExps.length >= 1) {
      seniorityScore = 0.8;
    } else {
      seniorityScore = 0.4;
    }
  } else if (/entry|junior|intern|trainee|fresh/i.test(jobReq)) {
    seniorityScore = 1.0; // Open to all levels
  } else {
    seniorityScore = candidateExps.length > 0 ? 0.9 : 0.5;
  }

  // Domain relevance from industry category
  const catWords = (job.category || '').toLowerCase().split(/[\s,&/]+/).filter((w) => w.length > 3);
  const catMatches = catWords.filter((w) => resumeText.includes(w) || candidateTitles.includes(w));
  const domainScore = catWords.length > 0 ? Math.min(1.0, catMatches.length / Math.min(catWords.length, 2)) : 0.8;

  let expScore = hasSparseData
    ? 0.3
    : Math.min(1.0, keywordRatio * 0.4 + seniorityScore * 0.3 + domainScore * 0.3);

  // 4. Job Title & Responsibility Relevance (15%)
  const titleWords = (job.title || '').toLowerCase().split(/[\s,–—\-/]+/).filter((w) => w.length > 3);
  const titleMatches = titleWords.filter((w) => resumeText.includes(w) || candidateTitles.includes(w));
  const respScore = titleWords.length > 0 ? Math.min(1.0, titleMatches.length / Math.min(titleWords.length, 2)) : 0.5;

  // 5. Education & Certifications (15%)
  let eduScore = 1.0;
  if (job.educationRequirements) {
    const eduReq = job.educationRequirements.toLowerCase();
    const candidateEdu = parsed.education || [];
    const candidateCerts = (parsed.certifications || []).join(' ').toLowerCase();

    if (candidateEdu.length > 0 || candidateCerts.length > 0) {
      const allEduText = (candidateEdu.map((e) => `${e.degree || ''} ${e.field || ''}`).join(' ') + ' ' + candidateCerts + ' ' + resumeText).toLowerCase();

      // Check specific field matches (finance, accounting, agriculture, pharmacy, engineering, etc.)
      const fieldWords = eduReq.split(/[\s,()/]+/).filter((w) => w.length > 3 && !['degree', 'recognized', 'equivalent', 'from', 'university', 'with', 'relevant'].includes(w));
      const hasFieldMatch = fieldWords.some((fw) => allEduText.includes(fw));

      // Check professional certs (CIMA, ACCA, CFA, CIPM, CA Sri Lanka, PMP)
      const hasCerts = /cima|acca|cfa|cipm|ca sri lanka|pmp|iesl|slmc|slim|cim/i.test(allEduText);
      const reqHasCerts = /cima|acca|cfa|cipm|ca sri lanka|pmp|iesl|slmc|slim|cim/i.test(eduReq);

      if (hasFieldMatch || (reqHasCerts && hasCerts)) {
        eduScore = 1.0;
      } else if (/phd|doctorate/i.test(eduReq)) {
        eduScore = /phd|doctorate/i.test(allEduText) ? 1.0 : 0.6;
      } else if (/master|msc|mba|postgraduate/i.test(eduReq)) {
        eduScore = /master|msc|mba|postgraduate|phd/i.test(allEduText) ? 1.0 : 0.75;
      } else if (/bachelor|degree|bsc|ba|bcom|beng|bpharm/i.test(eduReq)) {
        eduScore = /bachelor|degree|bsc|ba|bcom|beng|bpharm|master|msc|mba/i.test(allEduText) ? 1.0 : 0.8;
      } else {
        eduScore = 0.85;
      }
    } else {
      eduScore = hasSparseData ? 0.3 : 0.5;
    }
  }

  // 6. Location Compatibility (5%)
  let locationScore = 1.0;
  if (job.workplaceType?.toLowerCase() === 'remote') {
    locationScore = 1.0;
  } else if (job.location) {
    const jobLoc = job.location.toLowerCase();
    const candLoc = (parsed.location || '').toLowerCase();
    if (!candLoc || jobLoc.includes(candLoc) || candLoc.includes('sri lanka') || jobLoc.includes('sri lanka')) {
      locationScore = 1.0;
    } else {
      locationScore = 0.9;
    }
  }

  // 7. Workplace & Employment Compatibility (5%)
  const workplaceScore = 1.0;

  // Transparent weights sum = 100%
  // 30% req + 10% pref + 20% exp + 15% resp + 15% edu + 5% loc + 5% work = 100%
  const totalScore = Math.round(
    (reqScore * 0.30 +
      prefScore * 0.10 +
      expScore * 0.20 +
      respScore * 0.15 +
      eduScore * 0.15 +
      locationScore * 0.05 +
      workplaceScore * 0.05) *
      100
  );

  const finalScore = Math.min(Math.max(totalScore, 0), 100);

  // Natural language explanations grounded strictly in candidate CV and job posting
  const explanations: string[] = [];

  if (finalScore >= 80) {
    explanations.push(`Strong match (${finalScore}%): your skills and professional experience closely align with this position at ${job.company}.`);
  } else if (finalScore >= 65) {
    explanations.push(`Good match (${finalScore}%): your background provides a solid foundation for this ${job.title} role at ${job.company}.`);
  } else {
    explanations.push(`Fair match (${finalScore}%): role offers transferable opportunities, though several domain-specific requirements differ.`);
  }

  if (reqMatched.length > 0) {
    explanations.push(`Matched ${reqMatched.length} of ${reqSkills.length} required skills: ${reqMatched.slice(0, 4).join(', ')}${reqMatched.length > 4 ? ` (+${reqMatched.length - 4} more)` : ''}.`);
  }

  if (reqMissing.length > 0) {
    explanations.push(`The employer requests ${reqMissing.slice(0, 3).join(', ')}, which was not identified in your current CV.`);
  }

  if (prefMatched.length > 0) {
    explanations.push(`Matched preferred competencies: ${prefMatched.slice(0, 3).join(', ')}.`);
  }

  if (hasSparseData) {
    explanations.push('Note: This match score is an estimate based on available CV sections. Upload a detailed CV for maximum scoring precision.');
  }

  return {
    id: `match-${job.id}`,
    jobListing: job,
    matchScore: finalScore,
    matchedSkills: [...new Set([...reqMatched, ...prefMatched])],
    missingRequirements: reqMissing,
    explanations,
    scoreBreakdown: {
      requiredSkills: Math.round(reqScore * 100),
      experience: Math.round(expScore * 100),
      responsibilities: Math.round(respScore * 100),
      education: Math.round(eduScore * 100),
      preferredSkills: Math.round(prefScore * 100),
    },
    isEstimate: hasSparseData,
  };
}

function extractImportantWords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'as', 'is', 'are', 'was', 'were', 'will', 'would', 'should', 'you', 'we', 'our',
    'your', 'their', 'this', 'that', 'have', 'has', 'be', 'been', 'with', 'such', 'into', 'team'
  ]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 35);
}

/**
 * Returns recommendations matched against job listings.
 */
export function getRecommendations(
  parsed: ParsedResume,
  minScore = 0,
  listings: JobListing[] = BENCHMARK_JOB_FIXTURES
): JobMatch[] {
  return listings
    .map((job) => calculateJobMatch(parsed, job))
    .filter((match) => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
}
