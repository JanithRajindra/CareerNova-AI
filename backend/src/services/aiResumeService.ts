import { config } from '../config';
import { ParsedResume } from '../types';

export interface AISuggestion {
  section: string;
  originalText: string;
  suggestedText: string;
  explanation: string;
  type: 'improvement' | 'grammar' | 'keywords' | 'action_verbs';
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  overallFeedback: string;
  isAIGenerated: boolean;
  provider?: string;
}

/**
 * AI Resume Improvement Service
 * Uses OpenAI or compatible API when configured.
 * Falls back to rule-based suggestions when AI is unavailable.
 */
export class AIResumeService {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = !!(config.ai.apiKey && config.ai.provider);
  }

  async improveSummary(
    summary: string,
    targetRole?: string,
    skills?: string[]
  ): Promise<AISuggestion> {
    if (this.isAvailable) {
      return this.callAI('summary', summary, targetRole, skills);
    }
    return this.ruleBasedSummaryImprovement(summary, targetRole);
  }

  async improveBulletPoint(
    bullet: string,
    context?: string
  ): Promise<AISuggestion> {
    if (this.isAvailable) {
      return this.callAI('bullet', bullet, context);
    }
    return this.ruleBasedBulletImprovement(bullet);
  }

  async analyzeForJobDescription(
    parsed: ParsedResume,
    jobDescription: string
  ): Promise<AIAnalysisResult> {
    if (this.isAvailable) {
      return this.callAIJobAnalysis(parsed, jobDescription);
    }
    return this.ruleBasedJobAnalysis(parsed, jobDescription);
  }

  async generateSuggestions(parsed: ParsedResume, targetRole?: string): Promise<AIAnalysisResult> {
    if (this.isAvailable) {
      return this.callAIFullAnalysis(parsed, targetRole);
    }
    return this.ruleBasedFullAnalysis(parsed);
  }

  private async callAI(
    type: string,
    text: string,
    context?: string,
    extra?: string[]
  ): Promise<AISuggestion> {
    try {
      const { OpenAI } = await import('openai').catch(() => ({ OpenAI: null }));
      if (!OpenAI) throw new Error('OpenAI not available');

      const client = new OpenAI({ apiKey: config.ai.apiKey });

      let prompt = '';
      if (type === 'summary') {
        prompt = `You are an expert resume writer. Improve the following professional summary${context ? ` for a ${context} role` : ''}. 
RULES: 
- Do NOT invent facts, experience, skills, or achievements not in the original.
- Keep the same facts but make them clearer and more impactful.
- Use active voice and specific language.
- 3-4 sentences maximum.
- Return ONLY a JSON object: {"suggested": "...", "explanation": "..."}

Original summary:
${text}`;
      } else if (type === 'bullet') {
        prompt = `You are an expert resume writer. Improve the following resume bullet point.
RULES:
- Do NOT invent metrics, responsibilities, or achievements.
- If metrics are missing and would help, note them as [ADD YOUR NUMBER HERE].
- Start with a strong action verb.
- Be specific and concise.
- Return ONLY a JSON object: {"suggested": "...", "explanation": "..."}

Original bullet point:
${text}`;
      }

      const response = await client.chat.completions.create({
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0].message.content || '{}';
      const parsed_response = JSON.parse(content);

      return {
        section: type === 'summary' ? 'summary' : 'experience',
        originalText: text,
        suggestedText: parsed_response.suggested || text,
        explanation: parsed_response.explanation || 'AI-powered improvement',
        type: 'improvement',
      };
    } catch (err) {
      console.error('[AI] Error calling AI API:', (err as Error).message);
      if (type === 'summary') return this.ruleBasedSummaryImprovement(text, context);
      return this.ruleBasedBulletImprovement(text);
    }
  }

  private async callAIJobAnalysis(
    parsed: ParsedResume,
    jobDescription: string
  ): Promise<AIAnalysisResult> {
    try {
      const { OpenAI } = await import('openai').catch(() => ({ OpenAI: null }));
      if (!OpenAI) throw new Error('OpenAI not available');

      const client = new OpenAI({ apiKey: config.ai.apiKey });

      const prompt = `You are an expert career consultant analyzing a resume against a job description.

RULES:
- Identify genuine gaps only — do NOT suggest adding skills the candidate doesn't have.
- Do NOT invent experience or qualifications.
- Be constructive and specific.
- Return ONLY a JSON object with structure:
{
  "suggestions": [
    {"section": "...", "originalText": "...", "suggestedText": "...", "explanation": "...", "type": "improvement|grammar|keywords"}
  ],
  "overallFeedback": "..."
}
Limit to 5 suggestions maximum.

Resume:
${parsed.rawText.substring(0, 3000)}

Job Description:
${jobDescription.substring(0, 2000)}`;

      const response = await client.chat.completions.create({
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
        temperature: 0.2,
      });

      const content = response.choices[0].message.content || '{}';
      const result = JSON.parse(content);

      return {
        suggestions: (result.suggestions || []).slice(0, 5),
        overallFeedback: result.overallFeedback || '',
        isAIGenerated: true,
        provider: config.ai.provider,
      };
    } catch (err) {
      console.error('[AI] Error in job analysis:', (err as Error).message);
      return this.ruleBasedJobAnalysis(parsed, jobDescription);
    }
  }

  private async callAIFullAnalysis(
    parsed: ParsedResume,
    targetRole?: string
  ): Promise<AIAnalysisResult> {
    try {
      const { OpenAI } = await import('openai').catch(() => ({ OpenAI: null }));
      if (!OpenAI) throw new Error('OpenAI not available');

      const client = new OpenAI({ apiKey: config.ai.apiKey });

      const prompt = `You are an expert resume writer and ATS specialist.

RULES:
- Do NOT invent experience, skills, education, metrics, or qualifications.
- If a bullet point would benefit from a metric, use [ADD SPECIFIC NUMBER].
- Focus on improving clarity, impact, and ATS compatibility.
- Return ONLY a JSON object:
{
  "suggestions": [
    {"section": "summary|experience|skills|education", "originalText": "...", "suggestedText": "...", "explanation": "...", "type": "improvement|grammar|keywords|action_verbs"}
  ],
  "overallFeedback": "..."
}
Limit to 6 suggestions.

Target role: ${targetRole || 'Not specified'}
Resume:
${parsed.rawText.substring(0, 3500)}`;

      const response = await client.chat.completions.create({
        model: config.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.2,
      });

      const content = response.choices[0].message.content || '{}';
      const result = JSON.parse(content);

      return {
        suggestions: (result.suggestions || []).slice(0, 6),
        overallFeedback: result.overallFeedback || '',
        isAIGenerated: true,
        provider: config.ai.provider,
      };
    } catch (err) {
      console.error('[AI] Error in full analysis:', (err as Error).message);
      return this.ruleBasedFullAnalysis(parsed);
    }
  }

  // ========================
  // Rule-based fallbacks
  // ========================

  private ruleBasedSummaryImprovement(
    summary: string,
    targetRole?: string
  ): AISuggestion {
    let improved = summary;
    const explanation: string[] = [];

    // Remove "I am" starts
    if (/^I am\s/i.test(improved)) {
      improved = improved.replace(/^I am\s/i, '');
      explanation.push('Removed first-person "I am" opening');
    }

    // Remove "responsible for"
    if (/responsible for/i.test(improved)) {
      improved = improved.replace(/responsible for/gi, 'specializing in');
      explanation.push('Replaced "responsible for" with active language');
    }

    // Add targetRole if specified and not present
    if (targetRole && !improved.toLowerCase().includes(targetRole.toLowerCase())) {
      improved = `${targetRole} professional with ${improved}`;
      explanation.push(`Added target role: ${targetRole}`);
    }

    return {
      section: 'summary',
      originalText: summary,
      suggestedText: improved,
      explanation: explanation.length > 0
        ? explanation.join('. ')
        : 'Suggestion: Strengthen your summary with specific achievements and your unique value proposition. (Configure AI provider for advanced improvements.)',
      type: 'improvement',
    };
  }

  private ruleBasedBulletImprovement(bullet: string): AISuggestion {
    let improved = bullet;
    const explanation: string[] = [];

    // Remove leading "Responsible for"
    if (/^responsible for/i.test(improved)) {
      improved = improved.replace(/^responsible for\s*/i, 'Managed ');
      explanation.push('Replaced "Responsible for" with action verb "Managed"');
    }

    // Remove leading "Helped with"
    if (/^helped with/i.test(improved)) {
      improved = improved.replace(/^helped with\s*/i, 'Contributed to ');
      explanation.push('Replaced "Helped with" with "Contributed to"');
    }

    // Capitalize first letter
    if (improved.length > 0) {
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    }

    // Suggest metric if none present
    if (!/\d+/.test(improved)) {
      explanation.push('Consider adding a measurable result (e.g., "by X%" or "for X users")');
    }

    return {
      section: 'experience',
      originalText: bullet,
      suggestedText: improved,
      explanation: explanation.length > 0
        ? explanation.join('. ')
        : 'Tip: Start with a strong action verb and quantify your impact where possible.',
      type: 'action_verbs',
    };
  }

  private ruleBasedJobAnalysis(
    parsed: ParsedResume,
    jobDescription: string
  ): AIAnalysisResult {
    const suggestions: AISuggestion[] = [];
    const jdLower = jobDescription.toLowerCase();
    const resumeLower = parsed.rawText.toLowerCase();

    // Find keywords in JD not in resume
    const jdKeywords = jobDescription
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .filter((w, i, a) => a.indexOf(w) === i)
      .filter((w) => !resumeLower.includes(w.toLowerCase()))
      .slice(0, 5);

    if (jdKeywords.length > 0) {
      suggestions.push({
        section: 'skills',
        originalText: parsed.skills.join(', '),
        suggestedText: '',
        explanation: `The job description mentions these terms not found in your CV: ${jdKeywords.join(', ')}. If you have experience with any of these, consider adding them.`,
        type: 'keywords',
      });
    }

    // Summary improvement
    if (parsed.summary) {
      const fallback = this.ruleBasedSummaryImprovement(parsed.summary);
      suggestions.push(fallback);
    }

    return {
      suggestions,
      overallFeedback: 'Rule-based analysis complete. Configure an AI provider (OpenAI API key) for advanced natural language suggestions.',
      isAIGenerated: false,
    };
  }

  private ruleBasedFullAnalysis(parsed: ParsedResume): AIAnalysisResult {
    const suggestions: AISuggestion[] = [];

    // Bullet point improvements
    const weakBullets = parsed.experience
      .flatMap((e) => e.bullets)
      .filter((b) => /^(responsible for|helped|worked on|assisted)/i.test(b))
      .slice(0, 3);

    for (const bullet of weakBullets) {
      suggestions.push(this.ruleBasedBulletImprovement(bullet));
    }

    // Summary
    if (parsed.summary) {
      suggestions.push(this.ruleBasedSummaryImprovement(parsed.summary));
    }

    return {
      suggestions,
      overallFeedback: 'Basic rule-based suggestions applied. Configure an AI provider for advanced, context-aware improvements.',
      isAIGenerated: false,
    };
  }
}

export const aiResumeService = new AIResumeService();
