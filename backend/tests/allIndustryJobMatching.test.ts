import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateJobMatch } from '../src/services/jobMatchingService';
import { SRI_LANKAN_JOB_LISTINGS } from '../src/services/sriLankanJobService';
import { ParsedResume } from '../src/types';

describe('All-Industry Job Recommendations & Multi-Career Matching Engine', () => {
  // Candidate 1: Accounting & Finance Professional
  const financeResume: ParsedResume = {
    rawText: 'Financial Analysis, Credit Risk Assessment, Cash Flow Modeling, Corporate Banking, CIMA Passed Finalist, Excel Financial Modeling, commercial credit analyst at ABC Bank.',
    fullName: 'Kavinda Perera',
    skills: ['Financial Analysis', 'Credit Risk Assessment', 'Cash Flow Modeling', 'Corporate Banking', 'Excel Financial Modeling', 'CIMA'],
    experience: [
      {
        jobTitle: 'Credit Analyst',
        company: 'National Development Bank',
        startDate: '2021',
        endDate: 'Present',
        bullets: [
          'Evaluated commercial lending proposals and audited corporate cash flows.',
          'Prepared credit appraisal memos adhering to CBSL prudential regulations.',
        ],
      },
    ],
    education: [
      {
        degree: 'Bachelor of Science in Finance',
        institution: 'University of Sri Jayewardenepura',
      },
    ],
    certifications: ['CIMA Passed Finalist'],
    projects: [],
    languages: ['English', 'Sinhala'],
    achievements: [],
    sections: [],
  };

  // Candidate 2: Agronomist & Agribusiness Specialist
  const agriResume: ParsedResume = {
    rawText: 'Agronomy, Crop Protection, Soil Nutrient Analysis, Field Trial Management, GAP Certification, seed production and outgrower management.',
    fullName: 'Saman Kumara',
    skills: ['Agronomy', 'Crop Protection', 'Soil Nutrient Analysis', 'Field Trial Management', 'GAP Certification'],
    experience: [
      {
        jobTitle: 'Field Agricultural Officer',
        company: 'CIC Agri Businesses',
        startDate: '2020',
        endDate: 'Present',
        bullets: [
          'Supervised field trials for organic bio-fertilizers and hybrid seeds.',
          'Conducted soil nutrient testing and educated farmer outgrower clusters on GAP standards.',
        ],
      },
    ],
    education: [
      {
        degree: 'BSc in Agriculture',
        institution: 'University of Peradeniya',
      },
    ],
    certifications: ['GAP Certification Auditor'],
    projects: [],
    languages: ['English', 'Sinhala'],
    achievements: [],
    sections: [],
  };

  // Candidate 3: Healthcare / Clinical Pharmacist
  const healthcareResume: ParsedResume = {
    rawText: 'Clinical Pharmacology, Prescription Auditing, Therapeutic Drug Monitoring, Inpatient Pharmacy Operations, NMRA Regulations, patient counseling.',
    fullName: 'Dr. Niluka Silva',
    skills: ['Clinical Pharmacology', 'Prescription Auditing', 'Therapeutic Drug Monitoring', 'Inpatient Pharmacy Operations'],
    experience: [
      {
        jobTitle: 'Hospital Pharmacist',
        company: 'Lanka Hospitals',
        startDate: '2021',
        endDate: 'Present',
        bullets: ['Dispensed acute medications and conducted therapeutic drug interaction reviews.'],
      },
    ],
    education: [
      {
        degree: 'Bachelor of Pharmacy (BPharm)',
        institution: 'University of Colombo',
      },
    ],
    certifications: ['SLMC Registered Pharmacist'],
    projects: [],
    languages: ['English', 'Sinhala'],
    achievements: [],
    sections: [],
  };

  // Candidate 4: Sparse / Incomplete CV
  const sparseResume: ParsedResume = {
    rawText: 'Interested in business and management jobs in Colombo.',
    fullName: 'New User',
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    languages: [],
    achievements: [],
    sections: [],
  };

  it('1. Recommends Accounting/Finance vacancy with high match (>75%) for finance candidate and lower match (<45%) for unrelated roles', () => {
    const bankingJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000001-0001-4000-8000-000000000001')!; // ComBank Credit Analyst
    const softwareJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000010-0001-4000-8000-000000000001')!; // Sysco Full Stack
    const agriJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000002-0001-4000-8000-000000000001')!; // Hayleys Agronomist

    const bankingMatch = calculateJobMatch(financeResume, bankingJob);
    const softwareMatch = calculateJobMatch(financeResume, softwareJob);
    const agriMatch = calculateJobMatch(financeResume, agriJob);

    assert.ok(bankingMatch.matchScore >= 75, `Expected finance match >= 75%, got ${bankingMatch.matchScore}%`);
    assert.ok(softwareMatch.matchScore < 45, `Expected software match < 45% for finance CV, got ${softwareMatch.matchScore}%`);
    assert.ok(agriMatch.matchScore < 45, `Expected agri match < 45% for finance CV, got ${agriMatch.matchScore}%`);
    assert.ok(bankingMatch.matchScore > softwareMatch.matchScore, 'Banking match should rank significantly above software');
    assert.ok(bankingMatch.matchedSkills.includes('Financial Analysis'));
    assert.ok(bankingMatch.matchedSkills.includes('Credit Risk Assessment'));
  });

  it('2. Recommends Agriculture vacancy with high match (>75%) for agronomist candidate', () => {
    const agriJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000002-0001-4000-8000-000000000001')!; // Hayleys Agronomist
    const bankingJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000001-0001-4000-8000-000000000001')!;

    const agriMatch = calculateJobMatch(agriResume, agriJob);
    const bankingMatch = calculateJobMatch(agriResume, bankingJob);

    assert.ok(agriMatch.matchScore >= 75, `Expected agri match >= 75%, got ${agriMatch.matchScore}%`);
    assert.ok(bankingMatch.matchScore < 45, `Expected banking match < 45% for agri CV, got ${bankingMatch.matchScore}%`);
    assert.ok(agriMatch.matchedSkills.includes('Agronomy'));
    assert.ok(agriMatch.matchedSkills.includes('Crop Protection'));
  });

  it('3. Recommends Healthcare vacancy with high match for clinical pharmacist', () => {
    const pharmacyJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000007-0002-4000-8000-000000000002')!; // Nawaloka Pharmacist
    const match = calculateJobMatch(healthcareResume, pharmacyJob);

    assert.ok(match.matchScore >= 70, `Expected healthcare match >= 70%, got ${match.matchScore}%`);
    assert.ok(match.matchedSkills.includes('Clinical Pharmacology'));
    assert.ok(match.matchedSkills.includes('Prescription Auditing'));
  });

  it('4. Flags incomplete/sparse CV as an estimate and provides clear transparency', () => {
    const bankingJob = SRI_LANKAN_JOB_LISTINGS.find((j) => j.id === 'b1000001-0001-4000-8000-000000000001')!;
    const match = calculateJobMatch(sparseResume, bankingJob);

    assert.strictEqual(match.isEstimate, true, 'Expected isEstimate to be true for sparse resume');
    assert.ok(
      match.explanations.some((e) => e.toLowerCase().includes('estimate')),
      'Explanation must communicate that score is an estimate'
    );
  });

  it('5. Verifies all job listings have authentic, valid URLs, categories, and verified status', () => {
    assert.ok(SRI_LANKAN_JOB_LISTINGS.length >= 15, 'Must have at least 15 verified job listings');

    for (const job of SRI_LANKAN_JOB_LISTINGS) {
      assert.ok(job.title && job.title.length > 5, `Job ${job.id} must have a descriptive title`);
      assert.ok(job.company && job.company.length > 2, `Job ${job.id} must have a company name`);
      assert.ok(job.category && job.category.length > 3, `Job ${job.id} must have an industry category`);
      assert.ok(job.location && job.location.includes('Sri Lanka'), `Job ${job.id} must have Sri Lanka location`);
      assert.ok(
        job.applicationUrl.startsWith('https://'),
        `Job ${job.id} applicationUrl must be a secure https URL`
      );
      assert.strictEqual(job.sourceStatus, 'verified', `Job ${job.id} sourceStatus must be verified`);
      assert.strictEqual(job.isDemo, false, `Job ${job.id} isDemo must be false`);
      assert.ok(job.requiredSkills.length > 0, `Job ${job.id} must have required skills`);
    }
  });

  it('6. Produces distinct match scores across different vacancies for the same candidate', () => {
    const scores = SRI_LANKAN_JOB_LISTINGS.map((j) => calculateJobMatch(financeResume, j).matchScore);
    const uniqueScores = new Set(scores);
    assert.ok(uniqueScores.size >= 5, 'Candidate must receive varied match scores across different roles');
  });
});
