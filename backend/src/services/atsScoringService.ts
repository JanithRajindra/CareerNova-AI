import {
  ParsedResume,
  ATSScore,
  ATSCheckResult,
  ATSCategory,
  ATSFinding,
  CategoryScore,
} from '../types';

const ANALYSIS_VERSION = '1.0.0';

// Category max points
const CATEGORY_MAX: Record<ATSCategory, number> = {
  formatting: 20,
  skills: 25,
  experience: 20,
  education: 10,
  contact: 10,
  readability: 10,
  extraction: 5,
};

const CATEGORY_LABELS: Record<ATSCategory, string> = {
  formatting: 'Formatting & Structure',
  skills: 'Skills & Keywords',
  experience: 'Work Experience',
  education: 'Education',
  contact: 'Contact Information',
  readability: 'Readability & Grammar',
  extraction: 'Document Extraction Quality',
};

export interface ATSScoringInput {
  parsed: ParsedResume;
  targetJobDescription?: string;
  targetJobTitle?: string;
}

export function calculateATSScore(input: ATSScoringInput): ATSScore {
  const { parsed, targetJobDescription, targetJobTitle } = input;
  const checks: ATSCheckResult[] = [];

  // --- Category: Extraction Quality (5pts) ---
  checks.push(...runExtractionChecks(parsed));

  // --- Category: Contact Information (10pts) ---
  checks.push(...runContactChecks(parsed));

  // --- Category: Formatting & Structure (20pts) ---
  checks.push(...runFormattingChecks(parsed));

  // --- Category: Skills & Keywords (25pts) ---
  checks.push(...runSkillsChecks(parsed, targetJobDescription));

  // --- Category: Work Experience (20pts) ---
  checks.push(...runExperienceChecks(parsed));

  // --- Category: Education (10pts) ---
  checks.push(...runEducationChecks(parsed));

  // --- Category: Readability (10pts) ---
  checks.push(...runReadabilityChecks(parsed));

  // Aggregate scores per category
  const categoryScores: Record<ATSCategory, CategoryScore> = {} as Record<ATSCategory, CategoryScore>;
  for (const cat of Object.keys(CATEGORY_MAX) as ATSCategory[]) {
    const catChecks = checks.filter((c) => c.category === cat);
    const earned = catChecks.reduce((sum, c) => sum + c.pointsEarned, 0);
    const max = CATEGORY_MAX[cat];
    categoryScores[cat] = {
      earned: Math.min(earned, max),
      max,
      percentage: Math.round((Math.min(earned, max) / max) * 100),
      label: CATEGORY_LABELS[cat],
    };
  }

  // Total score
  const totalEarned = Object.values(categoryScores).reduce((s, c) => s + c.earned, 0);
  const totalMax = Object.values(CATEGORY_MAX).reduce((s, v) => s + v, 0);
  const overall = Math.round((totalEarned / totalMax) * 100);

  // Completeness: what fraction of checks were evaluatable
  const evaluatable = checks.filter((c) => c.status !== 'unavailable').length;
  const completeness = Math.round((evaluatable / checks.length) * 100);

  // Band
  let band: ATSScore['band'];
  let bandLabel: string;
  if (overall >= 90) { band = 'strong'; bandLabel = 'Strong ATS Readiness'; }
  else if (overall >= 75) { band = 'good'; bandLabel = 'Good Readiness – Minor Improvements Recommended'; }
  else if (overall >= 60) { band = 'fair'; bandLabel = 'Fair – Several Improvements Recommended'; }
  else { band = 'needs_improvement'; bandLabel = 'Significant Improvements Recommended'; }

  // Generate findings
  const findings = generateFindings(checks, targetJobDescription);

  // Top recommendations
  const recommendations = generateRecommendations(checks, findings);

  return {
    overall,
    maxPossible: totalMax,
    completeness,
    band,
    bandLabel,
    categories: categoryScores,
    checks,
    findings,
    recommendations,
    analysisVersion: ANALYSIS_VERSION,
  };
}

// ========================
// Extraction checks (5pts)
// ========================
function runExtractionChecks(parsed: ParsedResume): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];
  const textLength = parsed.rawText.trim().length;

  checks.push({
    checkId: 'ext_text_present',
    category: 'extraction',
    pointsEarned: textLength > 200 ? 3 : textLength > 50 ? 1 : 0,
    maxPoints: 3,
    status: textLength > 200 ? 'pass' : textLength > 50 ? 'warning' : 'fail',
    explanation: textLength > 200
      ? 'Meaningful text was successfully extracted from your document.'
      : 'Very little text was extracted. The document may be image-based or have extraction issues.',
    severity: textLength < 50 ? 'high' : 'medium',
    recommendation: textLength < 200 ? 'Ensure your CV is saved as a text-selectable PDF or DOCX, not a scanned image.' : undefined,
    evidence: `Extracted ${textLength} characters`,
  });

  const sectionCount = parsed.sections.length;
  checks.push({
    checkId: 'ext_sections_detected',
    category: 'extraction',
    pointsEarned: sectionCount >= 3 ? 2 : sectionCount >= 1 ? 1 : 0,
    maxPoints: 2,
    status: sectionCount >= 3 ? 'pass' : sectionCount >= 1 ? 'warning' : 'fail',
    explanation: sectionCount >= 3
      ? `${sectionCount} sections were detected in your CV.`
      : `Only ${sectionCount} sections were detected. Section headings may be missing or unusual.`,
    severity: sectionCount === 0 ? 'high' : 'low',
    recommendation: sectionCount < 3 ? 'Add clear section headings (e.g., "Work Experience", "Skills", "Education") in a standard format.' : undefined,
    evidence: `Sections: ${parsed.sections.map((s) => s.name).join(', ') || 'none'}`,
  });

  return checks;
}

// ==============================
// Contact information checks (10pts)
// ==============================
function runContactChecks(parsed: ParsedResume): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];

  checks.push({
    checkId: 'contact_email',
    category: 'contact',
    pointsEarned: parsed.email ? 4 : 0,
    maxPoints: 4,
    status: parsed.email ? 'pass' : 'fail',
    explanation: parsed.email
      ? `Email address found: ${parsed.email}`
      : 'No email address detected. This is essential for recruiters to contact you.',
    severity: 'high',
    recommendation: !parsed.email ? 'Add a professional email address to your CV.' : undefined,
    evidence: parsed.email,
  });

  checks.push({
    checkId: 'contact_phone',
    category: 'contact',
    pointsEarned: parsed.phone ? 3 : 0,
    maxPoints: 3,
    status: parsed.phone ? 'pass' : 'warning',
    explanation: parsed.phone
      ? `Phone number found: ${parsed.phone}`
      : 'No phone number detected.',
    severity: 'medium',
    recommendation: !parsed.phone ? 'Consider adding a phone number.' : undefined,
    evidence: parsed.phone,
  });

  checks.push({
    checkId: 'contact_name',
    category: 'contact',
    pointsEarned: parsed.fullName ? 3 : 0,
    maxPoints: 3,
    status: parsed.fullName ? 'pass' : 'warning',
    explanation: parsed.fullName
      ? `Name detected: ${parsed.fullName}`
      : 'Your full name was not clearly detected at the top of the CV.',
    severity: 'medium',
    recommendation: !parsed.fullName ? 'Place your full name prominently at the top of your CV.' : undefined,
    evidence: parsed.fullName,
  });

  return checks;
}

// ==============================
// Formatting & structure (20pts)
// ==============================
function runFormattingChecks(parsed: ParsedResume): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];

  // Section presence and order
  const sectionNames = parsed.sections.map((s) => s.name);
  const hasExperience = sectionNames.includes('experience');
  const hasSkills = sectionNames.includes('skills');
  const hasEducation = sectionNames.includes('education');

  checks.push({
    checkId: 'fmt_key_sections',
    category: 'formatting',
    pointsEarned: (hasExperience ? 3 : 0) + (hasSkills ? 3 : 0) + (hasEducation ? 2 : 0),
    maxPoints: 8,
    status: hasExperience && hasSkills ? 'pass' : 'warning',
    explanation: `Detected sections: ${sectionNames.join(', ') || 'none'}. ${
      !hasExperience ? 'Work Experience section not found. ' : ''
    }${!hasSkills ? 'Skills section not found. ' : ''}${!hasEducation ? 'Education section not found. ' : ''}`,
    severity: !hasExperience ? 'high' : 'medium',
    recommendation: !hasExperience
      ? 'Add a clearly labeled Work Experience or Employment History section.'
      : !hasSkills
      ? 'Add a Skills section listing your technical and soft skills.'
      : undefined,
    evidence: `Sections: ${sectionNames.join(', ')}`,
  });

  // Summary/objective
  const hasSummary = sectionNames.includes('summary');
  checks.push({
    checkId: 'fmt_summary',
    category: 'formatting',
    pointsEarned: hasSummary ? 4 : 0,
    maxPoints: 4,
    status: hasSummary ? 'pass' : 'warning',
    explanation: hasSummary
      ? 'A professional summary was detected.'
      : 'No professional summary found. A concise summary helps ATS and recruiters quickly understand your profile.',
    severity: 'medium',
    recommendation: !hasSummary
      ? 'Add a 3–4 sentence professional summary at the top of your CV tailored to your target role.'
      : undefined,
  });

  // Section ordering heuristic
  let orderScore = 4;
  const experienceIdx = sectionNames.indexOf('experience');
  const educationIdx = sectionNames.indexOf('education');
  if (experienceIdx > -1 && educationIdx > -1 && educationIdx < experienceIdx) {
    // Education before experience is less optimal for experienced candidates
    orderScore = 2;
  }
  checks.push({
    checkId: 'fmt_section_order',
    category: 'formatting',
    pointsEarned: orderScore,
    maxPoints: 4,
    status: orderScore === 4 ? 'pass' : 'warning',
    explanation: orderScore === 4
      ? 'Section ordering appears appropriate.'
      : 'Education appears before Work Experience. For experienced candidates, work experience should come first.',
    severity: 'low',
    recommendation: orderScore < 4 ? 'Consider moving Work Experience before Education if you have significant work history.' : undefined,
  });

  // Bullet points usage
  const totalBullets = parsed.experience.reduce((sum, e) => sum + e.bullets.length, 0);
  checks.push({
    checkId: 'fmt_bullet_points',
    category: 'formatting',
    pointsEarned: totalBullets >= 5 ? 4 : totalBullets >= 2 ? 2 : 0,
    maxPoints: 4,
    status: totalBullets >= 5 ? 'pass' : totalBullets >= 2 ? 'warning' : 'fail',
    explanation: totalBullets >= 5
      ? `${totalBullets} experience bullet points detected — good use of structured formatting.`
      : `Only ${totalBullets} bullet points detected in experience sections. ATS systems prefer bullet-pointed descriptions.`,
    severity: totalBullets === 0 ? 'high' : 'medium',
    recommendation: totalBullets < 5 ? 'Use bullet points to describe your responsibilities and achievements in each role.' : undefined,
    evidence: `${totalBullets} bullets detected`,
  });

  return checks;
}

// ==============================
// Skills & keywords (25pts)
// ==============================
function runSkillsChecks(parsed: ParsedResume, targetJD?: string): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];
  const skillCount = parsed.skills.length;

  checks.push({
    checkId: 'skills_count',
    category: 'skills',
    pointsEarned: skillCount >= 10 ? 8 : skillCount >= 5 ? 5 : skillCount >= 2 ? 3 : 0,
    maxPoints: 8,
    status: skillCount >= 10 ? 'pass' : skillCount >= 5 ? 'warning' : 'fail',
    explanation: skillCount >= 10
      ? `${skillCount} skills identified — good range of skills presented.`
      : `Only ${skillCount} skills detected. A dedicated skills section with relevant keywords improves ATS matching.`,
    severity: skillCount < 3 ? 'high' : 'medium',
    recommendation: skillCount < 10 ? 'Expand your skills section with relevant technical and soft skills.' : undefined,
    evidence: `Skills: ${parsed.skills.slice(0, 10).join(', ')}${skillCount > 10 ? '...' : ''}`,
  });

  // Skills in context (appear in experience descriptions too)
  const skillsInContext = parsed.skills.filter((skill) => {
    const lowerSkill = skill.toLowerCase();
    return parsed.experience.some(
      (exp) => exp.description?.toLowerCase().includes(lowerSkill) ||
               exp.bullets.some((b) => b.toLowerCase().includes(lowerSkill))
    );
  });

  checks.push({
    checkId: 'skills_in_context',
    category: 'skills',
    pointsEarned: skillsInContext.length >= 3 ? 7 : skillsInContext.length >= 1 ? 4 : 0,
    maxPoints: 7,
    status: skillsInContext.length >= 3 ? 'pass' : 'warning',
    explanation: skillsInContext.length >= 3
      ? `${skillsInContext.length} skills appear in context within your experience section.`
      : 'Few skills are mentioned in your experience descriptions. ATS systems weigh skills that appear in context.',
    severity: 'medium',
    recommendation: skillsInContext.length < 3 ? 'Naturally incorporate your key skills into your work experience descriptions.' : undefined,
    evidence: skillsInContext.length > 0 ? `Contextual: ${skillsInContext.slice(0, 5).join(', ')}` : undefined,
  });

  // Job description keyword matching (when JD is provided)
  if (targetJD) {
    const jdWords = extractKeywordsFromText(targetJD);
    const resumeWords = extractKeywordsFromText(parsed.rawText);
    const matched = jdWords.filter((kw) => resumeWords.includes(kw));
    const coverage = jdWords.length > 0 ? matched.length / jdWords.length : 0;

    checks.push({
      checkId: 'skills_jd_keywords',
      category: 'skills',
      pointsEarned: Math.round(coverage * 10),
      maxPoints: 10,
      status: coverage >= 0.6 ? 'pass' : coverage >= 0.3 ? 'warning' : 'fail',
      explanation: `Your CV covers ${Math.round(coverage * 100)}% of keywords from the target job description.`,
      severity: coverage < 0.3 ? 'high' : 'medium',
      recommendation: coverage < 0.6 ? `Consider incorporating these job-description keywords: ${jdWords.filter((k) => !resumeWords.includes(k)).slice(0, 5).join(', ')}` : undefined,
      evidence: `Matched: ${matched.slice(0, 8).join(', ')}`,
    });
  } else {
    checks.push({
      checkId: 'skills_jd_keywords',
      category: 'skills',
      pointsEarned: 5, // Neutral score when no JD
      maxPoints: 10,
      status: 'unavailable',
      explanation: 'Job-description keyword analysis is not available without a target job description. Provide a job description for role-specific keyword analysis.',
      evidence: 'No target job description provided',
    });
  }

  return checks;
}

// ==============================
// Work experience checks (20pts)
// ==============================
function runExperienceChecks(parsed: ParsedResume): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];
  const expCount = parsed.experience.length;

  checks.push({
    checkId: 'exp_entries',
    category: 'experience',
    pointsEarned: expCount >= 2 ? 6 : expCount === 1 ? 4 : 0,
    maxPoints: 6,
    status: expCount >= 2 ? 'pass' : expCount === 1 ? 'warning' : 'fail',
    explanation: expCount >= 2
      ? `${expCount} work experience entries detected.`
      : expCount === 1
      ? '1 work experience entry detected.'
      : 'No work experience entries were detected.',
    severity: expCount === 0 ? 'high' : 'low',
    recommendation: expCount === 0 ? 'Add a Work Experience section with your employment history.' : undefined,
    evidence: expCount > 0 ? `Roles: ${parsed.experience.map((e) => e.jobTitle || e.company || 'Role').slice(0, 3).join(', ')}` : undefined,
  });

  // Dates present
  const withDates = parsed.experience.filter((e) => e.startDate);
  checks.push({
    checkId: 'exp_dates',
    category: 'experience',
    pointsEarned: withDates.length === expCount && expCount > 0 ? 4 : withDates.length > 0 ? 2 : 0,
    maxPoints: 4,
    status: withDates.length === expCount && expCount > 0 ? 'pass' : 'warning',
    explanation: withDates.length === expCount && expCount > 0
      ? 'Employment dates detected for all positions.'
      : 'Some positions are missing employment dates.',
    severity: 'medium',
    recommendation: withDates.length < expCount ? 'Add start and end dates (Month Year format) for each position.' : undefined,
  });

  // Achievement-oriented bullets (check for numbers/metrics)
  const allBullets = parsed.experience.flatMap((e) => e.bullets);
  const metricBullets = allBullets.filter((b) => /\d+%|\d+\s*(?:million|billion|thousand|k\b|users|customers|projects)/i.test(b));
  const actionVerbs = ['achieved', 'increased', 'reduced', 'improved', 'led', 'managed', 'developed', 'built', 'created', 'delivered', 'launched', 'optimized', 'generated'];
  const actionBullets = allBullets.filter((b) => actionVerbs.some((v) => b.toLowerCase().startsWith(v)));

  checks.push({
    checkId: 'exp_achievements',
    category: 'experience',
    pointsEarned: metricBullets.length >= 2 ? 6 : metricBullets.length >= 1 ? 4 : actionBullets.length >= 3 ? 3 : 0,
    maxPoints: 6,
    status: metricBullets.length >= 2 ? 'pass' : metricBullets.length >= 1 || actionBullets.length >= 2 ? 'warning' : 'fail',
    explanation: metricBullets.length >= 2
      ? `${metricBullets.length} achievement-oriented bullet points with measurable results detected.`
      : 'Few or no bullet points contain measurable achievements or strong action verbs.',
    severity: 'medium',
    recommendation: metricBullets.length < 2 ? 'Quantify your achievements where possible (e.g., "Increased sales by 25%"). Use strong action verbs to start bullet points.' : undefined,
    evidence: metricBullets.length > 0 ? metricBullets[0].substring(0, 100) : actionBullets.length > 0 ? actionBullets[0].substring(0, 100) : undefined,
  });

  // Job title clarity
  const withTitles = parsed.experience.filter((e) => e.jobTitle);
  checks.push({
    checkId: 'exp_titles',
    category: 'experience',
    pointsEarned: withTitles.length === expCount && expCount > 0 ? 4 : withTitles.length > 0 ? 2 : 0,
    maxPoints: 4,
    status: withTitles.length === expCount && expCount > 0 ? 'pass' : 'warning',
    explanation: withTitles.length === expCount && expCount > 0
      ? 'Job titles detected for all positions.'
      : 'Some positions appear to be missing clear job titles.',
    severity: 'medium',
    recommendation: withTitles.length < expCount ? 'Ensure each position has a clearly stated job title.' : undefined,
    evidence: withTitles.length > 0 ? withTitles.map((e) => e.jobTitle).join(', ') : undefined,
  });

  return checks;
}

// ==============================
// Education checks (10pts)
// ==============================
function runEducationChecks(parsed: ParsedResume): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];
  const eduCount = parsed.education.length;

  checks.push({
    checkId: 'edu_entries',
    category: 'education',
    pointsEarned: eduCount >= 1 ? 6 : 0,
    maxPoints: 6,
    status: eduCount >= 1 ? 'pass' : 'warning',
    explanation: eduCount >= 1
      ? `${eduCount} education ${eduCount === 1 ? 'entry' : 'entries'} detected.`
      : 'No education entries detected. Add an Education section if applicable.',
    severity: 'low',
    recommendation: eduCount === 0 ? 'Add an Education section with your qualifications.' : undefined,
    evidence: eduCount > 0 ? parsed.education.map((e) => `${e.degree || ''} ${e.institution || ''}`.trim()).join('; ') : undefined,
  });

  const withInstitution = parsed.education.filter((e) => e.institution);
  checks.push({
    checkId: 'edu_institution',
    category: 'education',
    pointsEarned: withInstitution.length === eduCount && eduCount > 0 ? 4 : withInstitution.length > 0 ? 2 : 0,
    maxPoints: 4,
    status: withInstitution.length === eduCount && eduCount > 0 ? 'pass' : 'warning',
    explanation: withInstitution.length === eduCount && eduCount > 0
      ? 'Institution names detected for all education entries.'
      : 'Some education entries may be missing institution names.',
    severity: 'low',
    recommendation: withInstitution.length < eduCount ? 'Include the institution name for each education entry.' : undefined,
  });

  return checks;
}

// ==============================
// Readability checks (10pts)
// ==============================
function runReadabilityChecks(parsed: ParsedResume): ATSCheckResult[] {
  const checks: ATSCheckResult[] = [];
  const text = parsed.rawText;
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Length check
  checks.push({
    checkId: 'read_length',
    category: 'readability',
    pointsEarned: wordCount >= 300 && wordCount <= 1000 ? 4 : wordCount >= 150 ? 2 : 0,
    maxPoints: 4,
    status: wordCount >= 300 && wordCount <= 1000 ? 'pass' : 'warning',
    explanation: wordCount >= 300 && wordCount <= 1000
      ? `CV length (${wordCount} words) is appropriate.`
      : wordCount < 300
      ? `CV appears short (${wordCount} words). A strong CV typically has 300–700 words.`
      : `CV is long (${wordCount} words). Consider condensing to the most relevant content.`,
    severity: wordCount < 100 ? 'high' : 'low',
    recommendation: wordCount < 300 ? 'Expand your CV with more detailed descriptions of your experience, skills, and achievements.' : wordCount > 1000 ? 'Consider condensing your CV to 1–2 pages focused on your most relevant experience.' : undefined,
    evidence: `${wordCount} words`,
  });

  // Tense consistency (basic)
  const presentVerbs = (text.match(/\b(manage|lead|develop|build|create|support)\b/gi) || []).length;
  const pastVerbs = (text.match(/\b(managed|led|developed|built|created|supported)\b/gi) || []).length;
  const mixedTense = presentVerbs > 0 && pastVerbs > 0;

  checks.push({
    checkId: 'read_tense',
    category: 'readability',
    pointsEarned: !mixedTense ? 3 : 1,
    maxPoints: 3,
    status: !mixedTense ? 'pass' : 'warning',
    explanation: !mixedTense
      ? 'Verb tense appears consistent throughout.'
      : 'Mixed verb tenses detected. Use past tense for previous roles and present tense for current roles.',
    severity: 'low',
    recommendation: mixedTense ? 'Review your verb tenses: use past tense for previous roles and present tense for your current position.' : undefined,
  });

  // Buzzword / vague phrasing check
  const vaguePhrases = ['responsible for', 'helped with', 'worked on', 'assisted in', 'involved in'];
  const vagueCount = vaguePhrases.filter((phrase) => text.toLowerCase().includes(phrase)).length;

  checks.push({
    checkId: 'read_vague',
    category: 'readability',
    pointsEarned: vagueCount === 0 ? 3 : vagueCount <= 2 ? 2 : 0,
    maxPoints: 3,
    status: vagueCount === 0 ? 'pass' : 'warning',
    explanation: vagueCount === 0
      ? 'No obviously vague phrasing detected.'
      : `${vagueCount} vague phrase(s) detected (e.g., "responsible for", "helped with"). These are weak in ATS and recruiter reviews.`,
    severity: vagueCount > 2 ? 'high' : 'medium',
    recommendation: vagueCount > 0 ? 'Replace vague phrases with strong action verbs. E.g., "Responsible for managing team" → "Managed a team of 5 engineers."' : undefined,
    evidence: vaguePhrases.filter((p) => text.toLowerCase().includes(p)).join(', ') || undefined,
  });

  return checks;
}

// ==============================
// Helpers
// ==============================
function extractKeywordsFromText(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'shall', 'this', 'that', 'these',
    'those', 'we', 'you', 'they', 'he', 'she', 'it', 'i', 'our', 'your',
    'their', 'its', 'my', 'not', 'no', 'if', 'then', 'than', 'when', 'where',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s#.+]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i); // unique
}

function generateFindings(checks: ATSCheckResult[], _jd?: string): ATSFinding[] {
  const findings: ATSFinding[] = [];

  for (const check of checks) {
    if (check.status === 'unavailable') continue;

    const priority =
      check.status === 'pass'
        ? 'positive'
        : check.severity === 'high'
        ? 'high'
        : check.severity === 'medium'
        ? 'medium'
        : 'low';

    findings.push({
      id: check.checkId,
      priority,
      category: check.category,
      title: getTitleForCheck(check.checkId),
      description: check.explanation,
      recommendation: check.recommendation,
      evidence: check.evidence,
    });
  }

  // Sort: high > medium > low > positive
  const order = { high: 0, medium: 1, low: 2, positive: 3 };
  return findings.sort((a, b) => order[a.priority] - order[b.priority]);
}

function getTitleForCheck(checkId: string): string {
  const titles: Record<string, string> = {
    ext_text_present: 'Text Extraction',
    ext_sections_detected: 'Section Detection',
    contact_email: 'Email Address',
    contact_phone: 'Phone Number',
    contact_name: 'Full Name Visibility',
    fmt_key_sections: 'Key Sections Present',
    fmt_summary: 'Professional Summary',
    fmt_section_order: 'Section Order',
    fmt_bullet_points: 'Bullet Point Usage',
    skills_count: 'Skills Quantity',
    skills_in_context: 'Skills in Context',
    skills_jd_keywords: 'Job Description Keyword Match',
    exp_entries: 'Work Experience Entries',
    exp_dates: 'Employment Dates',
    exp_achievements: 'Achievement-Oriented Descriptions',
    exp_titles: 'Job Title Clarity',
    edu_entries: 'Education Entries',
    edu_institution: 'Institution Names',
    read_length: 'CV Length',
    read_tense: 'Verb Tense Consistency',
    read_vague: 'Specific Language',
  };
  return titles[checkId] || checkId;
}

function generateRecommendations(checks: ATSCheckResult[], findings: ATSFinding[]): string[] {
  return findings
    .filter((f) => f.priority !== 'positive' && f.recommendation)
    .slice(0, 8)
    .map((f) => f.recommendation!);
}
