import {
  ParsedResume,
  WorkExperience,
  Education,
  Project,
  ResumeSection,
} from '../types';

/**
 * Parses raw extracted text into a structured ParsedResume object.
 * Uses heuristic rules — no AI calls.
 */
export function parseResumeText(rawText: string): ParsedResume {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const result: ParsedResume = {
    rawText,
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    achievements: [],
    sections: [],
  };

  // Extract email
  const emailMatch = rawText.match(/[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.email = emailMatch[0];

  // Extract phone
  const phoneMatch = rawText.match(
    /(\+?\d[\d\s\-().]{8,}\d)/
  );
  if (phoneMatch) result.phone = phoneMatch[0].trim();

  // Extract LinkedIn URL
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w\-]+/i);
  if (linkedinMatch) result.location = result.location; // just note it exists

  // Try to find full name (typically first non-empty line before contact info)
  const nameCandidate = lines[0];
  if (
    nameCandidate &&
    nameCandidate.length < 60 &&
    !nameCandidate.includes('@') &&
    !/\d{3}/.test(nameCandidate)
  ) {
    result.fullName = nameCandidate;
  }

  // Section detection
  const sectionHeaders: Record<string, ATSSectionKey> = {
    'professional summary': 'summary',
    summary: 'summary',
    objective: 'summary',
    profile: 'summary',
    'about me': 'summary',
    'skills': 'skills',
    'technical skills': 'skills',
    'core competencies': 'skills',
    'key skills': 'skills',
    'technologies': 'skills',
    'work experience': 'experience',
    experience: 'experience',
    employment: 'experience',
    'professional experience': 'experience',
    'career history': 'experience',
    education: 'education',
    'academic background': 'education',
    qualifications: 'education',
    certifications: 'certifications',
    certificates: 'certifications',
    'licenses': 'certifications',
    projects: 'projects',
    'personal projects': 'projects',
    'key projects': 'projects',
    languages: 'languages',
    achievements: 'achievements',
    awards: 'achievements',
    'honors': 'achievements',
  };

  type ATSSectionKey =
    | 'summary'
    | 'skills'
    | 'experience'
    | 'education'
    | 'certifications'
    | 'projects'
    | 'languages'
    | 'achievements';

  let currentSection: ATSSectionKey | null = null;
  let currentContent: string[] = [];
  let sectionOrder = 0;

  const flushSection = (sectionName: ATSSectionKey | null, content: string[]) => {
    if (!sectionName || content.length === 0) return;
    const text = content.join('\n');
    result.sections.push({ name: sectionName, content: text, order: sectionOrder++ });

    switch (sectionName) {
      case 'summary':
        result.summary = text;
        break;
      case 'skills':
        result.skills = extractSkillsList(text);
        break;
      case 'experience':
        result.experience = extractExperience(text);
        break;
      case 'education':
        result.education = extractEducation(text);
        break;
      case 'certifications':
        result.certifications = extractBulletList(text);
        break;
      case 'projects':
        result.projects = extractProjects(text);
        break;
      case 'languages':
        result.languages = extractBulletList(text);
        break;
      case 'achievements':
        result.achievements = extractBulletList(text);
        break;
    }
  };

  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[:\-|]/g, '').trim();
    const detectedSection = sectionHeaders[lower];

    if (detectedSection) {
      flushSection(currentSection, currentContent);
      currentSection = detectedSection;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  flushSection(currentSection, currentContent);

  // Fallback: if no experience detected but raw text has company patterns
  if (result.experience.length === 0 && result.sections.length === 0) {
    // Put everything in summary as fallback
    result.summary = result.summary || rawText.substring(0, 1000);
  }

  return result;
}

function extractSkillsList(text: string): string[] {
  // Split by common delimiters: commas, bullets, pipes, newlines
  const raw = text.replace(/[•·▪▸►▶\-]/g, ',').replace(/\|/g, ',');
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60);
}

function extractBulletList(text: string): string[] {
  return text
    .split(/\n|•|·/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function extractExperience(text: string): WorkExperience[] {
  const experiences: WorkExperience[] = [];
  // Split by common job block patterns
  const blocks = text.split(/\n(?=[A-Z][^a-z\n]{0,50}\n)/);

  for (const block of blocks) {
    if (block.trim().length < 20) continue;
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const exp: WorkExperience = { bullets: [] };

    for (const line of lines) {
      // Date pattern detection
      const datePattern = /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}|\d{4})\s*[-–—]\s*(Present|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})/i;
      if (datePattern.test(line)) {
        const match = line.match(datePattern)!;
        exp.startDate = match[1];
        exp.endDate = match[2];
        exp.isCurrent = /present/i.test(match[2]);
      } else if (!exp.jobTitle && line.length < 80 && lines.indexOf(line) < 3) {
        exp.jobTitle = line;
      } else if (!exp.company && line.length < 80 && lines.indexOf(line) < 4) {
        exp.company = line;
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        exp.bullets.push(line.replace(/^[•\-*]\s*/, ''));
      } else {
        exp.bullets.push(line);
      }
    }

    if (exp.jobTitle || exp.company || exp.bullets.length > 0) {
      experiences.push(exp);
    }
  }

  return experiences;
}

function extractEducation(text: string): Education[] {
  const educations: Education[] = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    if (block.trim().length < 10) continue;
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const edu: Education = {};

    for (const line of lines) {
      const datePattern = /(\d{4})\s*[-–—]\s*(\d{4}|Present)/i;
      if (datePattern.test(line)) {
        const match = line.match(datePattern)!;
        edu.startDate = match[1];
        edu.endDate = match[2];
      } else if (!edu.institution) {
        edu.institution = line;
      } else if (!edu.degree) {
        edu.degree = line;
      }
    }

    if (edu.institution || edu.degree) {
      educations.push(edu);
    }
  }

  return educations;
}

function extractProjects(text: string): Project[] {
  const projects: Project[] = [];
  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    if (block.trim().length < 10) continue;
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const proj: Project = { technologies: [] };

    proj.name = lines[0];
    proj.description = lines.slice(1).join(' ');

    // Extract tech mentions
    const techPattern = /\b(React|Node|Python|Java|JavaScript|TypeScript|SQL|MongoDB|PostgreSQL|AWS|Docker|Kubernetes|Angular|Vue|Django|Flask|Spring|\.NET|PHP|Ruby|Swift|Kotlin|Go|Rust|C\+\+|C#)\b/gi;
    const techMatches = block.match(techPattern);
    if (techMatches) {
      proj.technologies = [...new Set(techMatches.map((t) => t.trim()))];
    }

    if (proj.name) projects.push(proj);
  }

  return projects;
}
