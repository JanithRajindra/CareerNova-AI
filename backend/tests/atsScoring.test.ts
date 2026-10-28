import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateATSScore } from '../src/services/atsScoringService';
import { ParsedResume } from '../src/types';

describe('ATS Readiness Scoring Engine', () => {
  const completeResume: ParsedResume = {
    rawText: `
      Alex Taylor
      alex.taylor@example.com | +94 77 123 4567 | Colombo, Sri Lanka
      
      PROFESSIONAL SUMMARY
      Results-driven Senior Full Stack Software Engineer with over 6 years of experience building high-performance web applications using React, Node.js, and PostgreSQL. Proven track record of architecting scalable distributed systems, increasing platform throughput by 40%, and mentoring agile engineering teams.
      
      WORK EXPERIENCE
      Senior Software Engineer
      Sysco LABS Sri Lanka
      Jan 2021 - Present
      • Architected microservices platform handling 5 million daily requests with 99.99% uptime.
      • Increased API response speeds by 35% through Redis caching and query optimization.
      • Led an engineering squad of 6 developers delivering quarterly product roadmaps on time.
      • Integrated automated CI/CD pipelines reducing deployment failure rates by 50%.
      
      Software Engineer
      Virtusa
      Feb 2018 - Dec 2020
      • Developed customer-facing React components with TypeScript and Redux.
      • Built RESTful APIs in Node.js and PostgreSQL supporting 100k active users.
      • Optimized database queries cutting load times by 25%.
      
      SKILLS
      React, Node.js, TypeScript, JavaScript, PostgreSQL, Docker, Kubernetes, AWS, REST APIs, Git, Microservices, Redis, GraphQL
      
      EDUCATION
      BSc in Computer Science
      University of Colombo
      2014 - 2018
      
      PROJECTS
      Cloud Analytics Dashboard
      Real-time visualization engine built with React and WebSockets.
      Technologies: React, Node.js, WebSocket
      
      CERTIFICATIONS
      • AWS Certified Solutions Architect - Associate
      • Certified Kubernetes Application Developer (CKAD)
    `,
    fullName: 'Alex Taylor',
    email: 'alex.taylor@example.com',
    phone: '+94 77 123 4567',
    location: 'Colombo, Sri Lanka',
    summary: 'Results-driven Senior Full Stack Software Engineer with over 6 years of experience building high-performance web applications.',
    skills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'REST APIs', 'Git', 'Microservices', 'Redis'],
    experience: [
      {
        jobTitle: 'Senior Software Engineer',
        company: 'Sysco LABS Sri Lanka',
        startDate: 'Jan 2021',
        endDate: 'Present',
        isCurrent: true,
        bullets: [
          'Architected microservices platform handling 5 million daily requests with 99.99% uptime.',
          'Increased API response speeds by 35% through Redis caching.',
          'Led an engineering squad of 6 developers delivering quarterly roadmaps.',
        ],
      },
      {
        jobTitle: 'Software Engineer',
        company: 'Virtusa',
        startDate: 'Feb 2018',
        endDate: 'Dec 2020',
        bullets: [
          'Developed customer-facing React components with TypeScript.',
          'Built RESTful APIs in Node.js and PostgreSQL.',
        ],
      },
    ],
    education: [
      {
        degree: 'BSc in Computer Science',
        institution: 'University of Colombo',
        startDate: '2014',
        endDate: '2018',
      },
    ],
    certifications: [
      'AWS Certified Solutions Architect - Associate',
      'Certified Kubernetes Application Developer',
    ],
    projects: [
      {
        name: 'Cloud Analytics Dashboard',
        description: 'Real-time visualization engine',
        technologies: ['React', 'Node.js'],
      },
    ],
    languages: ['English', 'Sinhala'],
    achievements: ['Best Engineer Award 2023'],
    sections: [
      { name: 'summary', content: '...', order: 0 },
      { name: 'experience', content: '...', order: 1 },
      { name: 'skills', content: '...', order: 2 },
      { name: 'education', content: '...', order: 3 },
    ],
  };

  it('1. Calculates high ATS score for well-structured complete CV', () => {
    const score = calculateATSScore({ parsed: completeResume });
    assert.ok(score.overall >= 75, `Expected score >= 75, got ${score.overall}`);
    assert.strictEqual(score.maxPossible, 100);
    assert.ok(['strong', 'good'].includes(score.band));
    assert.ok(score.completeness >= 80);
  });

  it('2. Evaluates score boundaries (0 to 100 range strictly enforced)', () => {
    const emptyResume: ParsedResume = {
      rawText: '',
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      languages: [],
      achievements: [],
      sections: [],
    };
    const scoreEmpty = calculateATSScore({ parsed: emptyResume });
    assert.ok(scoreEmpty.overall >= 0 && scoreEmpty.overall <= 100);
    assert.strictEqual(scoreEmpty.band, 'needs_improvement');

    const scoreFull = calculateATSScore({ parsed: completeResume });
    assert.ok(scoreFull.overall >= 0 && scoreFull.overall <= 100);
  });

  it('3. Appropriately flags missing essential contact details', () => {
    const noContactResume: ParsedResume = {
      ...completeResume,
      email: undefined,
      phone: undefined,
      fullName: undefined,
    };
    const score = calculateATSScore({ parsed: noContactResume });
    const contactChecks = score.checks.filter((c) => c.category === 'contact');
    const emailCheck = contactChecks.find((c) => c.checkId === 'contact_email');
    assert.strictEqual(emailCheck?.status, 'fail');
    assert.strictEqual(emailCheck?.pointsEarned, 0);
  });

  it('4. Handles missing target job description transparently without arbitrary penalty', () => {
    const withoutJD = calculateATSScore({ parsed: completeResume });
    const jdCheck = withoutJD.checks.find((c) => c.checkId === 'skills_jd_keywords');
    assert.strictEqual(jdCheck?.status, 'unavailable');
    assert.ok(jdCheck?.explanation.includes('not available without a target job description'));
  });

  it('5. Compares keywords when job description is provided', () => {
    const targetJD = `
      Looking for a Senior Software Engineer with strong React, Node.js, TypeScript, PostgreSQL, and AWS experience.
      Must have demonstrated experience leading engineering squads and designing microservices.
    `;
    const withJD = calculateATSScore({ parsed: completeResume, targetJobDescription: targetJD });
    const jdCheck = withJD.checks.find((c) => c.checkId === 'skills_jd_keywords');
    assert.notStrictEqual(jdCheck?.status, 'unavailable');
    assert.ok(jdCheck?.pointsEarned! > 0);
  });

  it('6. Detects poor extraction / image-based PDF text deficiency', () => {
    const scannedPdfResume: ParsedResume = {
      rawText: 'Scanned image page 1',
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      projects: [],
      languages: [],
      achievements: [],
      sections: [],
    };
    const score = calculateATSScore({ parsed: scannedPdfResume });
    const extractionCheck = score.checks.find((c) => c.checkId === 'ext_text_present');
    assert.strictEqual(extractionCheck?.status, 'fail');
    assert.ok(extractionCheck?.recommendation?.includes('scanned image'));
  });

  it('7. Generates actionable findings grouped by priority', () => {
    const score = calculateATSScore({ parsed: completeResume });
    assert.ok(score.findings.length > 0);
    const positiveFindings = score.findings.filter((f) => f.priority === 'positive');
    assert.ok(positiveFindings.length > 0);
  });
});
