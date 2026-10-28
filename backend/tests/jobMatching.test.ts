import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateJobMatch, getRecommendations, BENCHMARK_JOB_FIXTURES } from '../src/services/jobMatchingService';
import { ParsedResume } from '../src/types';

describe('Job Matching Engine', () => {
  const fullStackResume: ParsedResume = {
    rawText: 'React Node.js TypeScript PostgreSQL REST APIs Git AWS Docker full stack software engineer',
    fullName: 'Alex Taylor',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST APIs', 'Git', 'AWS', 'Docker'],
    experience: [
      {
        jobTitle: 'Senior Software Engineer',
        company: 'Tech Corp',
        startDate: '2020',
        endDate: 'Present',
        bullets: ['Built scalable React and Node.js microservices with PostgreSQL.'],
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Colombo',
      },
    ],
    certifications: [],
    projects: [],
    languages: [],
    achievements: [],
    sections: [],
  };

  const marketingResume: ParsedResume = {
    rawText: 'Digital Marketing SEO Social Media Google Ads content strategy copywriter',
    fullName: 'Jordan Lee',
    skills: ['Digital Marketing', 'SEO', 'Google Ads', 'Content Strategy'],
    experience: [
      {
        jobTitle: 'Marketing Manager',
        company: 'Media Agency',
        startDate: '2019',
        endDate: 'Present',
        bullets: ['Managed paid ad campaigns and content marketing.'],
      },
    ],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    achievements: [],
    sections: [],
  };

  it('1. Computes high match percentage for candidate matching required tech stack', () => {
    const fullStackJob = BENCHMARK_JOB_FIXTURES.find((j) => j.id === 'demo-job-001')!;
    const match = calculateJobMatch(fullStackResume, fullStackJob);

    assert.ok(match.matchScore >= 70, `Expected match >= 70%, got ${match.matchScore}%`);
    assert.ok(match.matchedSkills.includes('React'));
    assert.ok(match.matchedSkills.includes('Node.js'));
    assert.ok(match.matchedSkills.includes('PostgreSQL'));
    assert.ok(match.scoreBreakdown.requiredSkills > 70);
  });

  it('2. Correctly flags missing required requirements', () => {
    const dataScientistJob = BENCHMARK_JOB_FIXTURES.find((j) => j.id === 'demo-job-002')!;
    const match = calculateJobMatch(marketingResume, dataScientistJob);

    assert.ok(match.missingRequirements.length > 0);
    assert.ok(match.matchScore < 50, `Expected low match for marketing to data science, got ${match.matchScore}`);
  });

  it('3. Ranks recommendations strictly by fit and threshold', () => {
    const recommendations = getRecommendations(fullStackResume, 0);
    assert.ok(recommendations.length > 0);

    // Verify descending sort order
    for (let i = 0; i < recommendations.length - 1; i++) {
      assert.ok(
        recommendations[i].matchScore >= recommendations[i + 1].matchScore,
        `Recommendations should be ordered descending: index ${i} has ${recommendations[i].matchScore} vs index ${i+1} has ${recommendations[i+1].matchScore}`
      );
    }
  });

  it('4. Filters out jobs below minimum match score threshold', () => {
    const highMatches = getRecommendations(fullStackResume, 70);
    for (const match of highMatches) {
      assert.ok(match.matchScore >= 70);
    }
  });

  it('5. Explanations clearly state matched vs missing counts', () => {
    const fullStackJob = BENCHMARK_JOB_FIXTURES.find((j) => j.id === 'demo-job-001')!;
    const match = calculateJobMatch(fullStackResume, fullStackJob);
    assert.ok(match.explanations.some((e) => e.includes('required skills')));
  });
});
