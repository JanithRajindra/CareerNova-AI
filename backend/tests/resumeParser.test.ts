import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseResumeText } from '../src/services/resumeParserService';

describe('Resume Parsing Engine', () => {
  const sampleCvText = `
    Jane Doe
    jane.doe@careers.com | +1 (555) 234-5678 | linkedin.com/in/janedoe

    SUMMARY
    Accomplished Project Manager with 7+ years of experience leading cross-functional tech teams.

    SKILLS
    Agile, Scrum, JIRA, Python, SQL, Stakeholder Management, Budgeting

    WORK EXPERIENCE
    Senior Project Manager
    Acme Software Inc
    2020 - Present
    • Delivered 12 enterprise SaaS releases on schedule and 10% under budget.
    • Managed a team of 15 engineers and designers.

    EDUCATION
    BSc in Information Systems
    Stanford University
    2012 - 2016
  `;

  it('1. Extracts candidate full name, email, and phone number', () => {
    const parsed = parseResumeText(sampleCvText);
    assert.strictEqual(parsed.fullName, 'Jane Doe');
    assert.strictEqual(parsed.email, 'jane.doe@careers.com');
    assert.ok(parsed.phone?.includes('555'));
  });

  it('2. Extracts skills list from standard skills section', () => {
    const parsed = parseResumeText(sampleCvText);
    assert.ok(parsed.skills.includes('Agile'));
    assert.ok(parsed.skills.includes('Scrum'));
    assert.ok(parsed.skills.includes('Python'));
  });

  it('3. Extracts work experience entries and bullets', () => {
    const parsed = parseResumeText(sampleCvText);
    assert.ok(parsed.experience.length > 0);
    const exp = parsed.experience[0];
    assert.ok(exp.bullets.length > 0);
  });

  it('4. Handles unstructured plain text gracefully without throwing', () => {
    const randomText = 'Some arbitrary plain text without clear sections or formatting.';
    const parsed = parseResumeText(randomText);
    assert.ok(parsed);
    assert.strictEqual(parsed.rawText, randomText);
    assert.ok(Array.isArray(parsed.skills));
    assert.ok(Array.isArray(parsed.experience));
  });
});
