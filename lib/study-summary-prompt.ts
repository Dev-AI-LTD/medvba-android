import type { Question } from '@/mocks/questions';
import { STUDY_SUMMARY_SECTIONS } from '@/lib/study-summary-sections';

const TOPIC_STYLE_RULES = `
Formatting rules (strict):
- Put a blank line after every ## heading.
- "Concepte cheie" / "Key concepts": 4–7 bullets, each starting with **Termen scurt**: explicație concisă (bold label before colon).
- Opening section: exactly 2 sentences focused on this sub-topic only; do NOT start with "În acest capitol" / "In this chapter you will explore".
- "Legături clinice" / "Clinical and exam connections": 2–3 bullets with **bold** lead terms.
- "Capcane frecvente" / "Common exam pitfalls": 2–4 bullets.
- "Mini-rezumat" / "Mini-summary": one short paragraph (3–5 lines max), no bullet list.
- No numbered lists; use "-" bullets only where specified.
- 250–450 words total.
`.trim();

const STYLE_RULES = `
Formatting rules (strict):
- Put a blank line after every ## heading.
- "Concepte cheie" / "Key concepts": 6–10 bullets, each starting with **Termen scurt**: explicație concisă (bold label before colon).
- Opening section: exactly 2–3 sentences; do NOT start with "În acest capitol" / "In this chapter you will explore".
- "Mini-rezumat" / "Mini-summary": one short paragraph (5–7 lines max), no bullet list.
- No numbered lists; use "-" bullets only where specified.
- 500–900 words total.
`.trim();

export function buildChapterSummaryPrompt(params: {
  chapterTitle: string;
  moduleId: string;
  questions: Question[];
  locale: 'ro' | 'en';
}): string {
  const { chapterTitle, moduleId, questions, locale } = params;
  const sample = questions.slice(0, 12).map((q, i) => {
    const opts = (q.options ?? []).map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join('\n');
    return `Q${i + 1}: ${q.question}\n${opts}\nCorrect: ${String.fromCharCode(65 + (q.correctAnswer ?? 0))}`;
  });

  const lang = locale === 'ro' ? 'Romanian' : 'English';
  const s = STUDY_SUMMARY_SECTIONS[locale];

  return `You are a medical education author preparing admission-exam study material.

Write a chapter summary in ${lang} for:
- Module: ${moduleId}
- Chapter: ${chapterTitle}

Use EXACTLY this markdown structure (keep ## markers; headings must match exactly):

## ${s.learn}
(2-3 sentences)

## ${s.concepts}
- **Term**: short explanation
(6-10 bullets)

## ${s.clinical}
- (3-5 bullets with **bold** lead terms)

## ${s.pitfalls}
- (3-5 bullets)

## ${s.mini}
(5-7 lines, one paragraph)

${STYLE_RULES}

Rules:
- Accurate, undergraduate medical level
- Do NOT invent facts not supported by the quiz items below
- Output ONLY markdown, no code fences

Quiz items from this chapter:
${sample.join('\n\n')}`;
}

export function buildTopicSummaryPrompt(params: {
  chapterTitle: string;
  moduleId: string;
  questions: Question[];
  locale: 'ro' | 'en';
  parentChapterTitle?: string;
  parentSummaryMarkdown?: string;
}): string {
  const {
    chapterTitle,
    moduleId,
    questions,
    locale,
    parentChapterTitle,
    parentSummaryMarkdown,
  } = params;
  const sample = questions.slice(0, 12).map((q, i) => {
    const opts = (q.options ?? []).map((o, j) => `${String.fromCharCode(65 + j)}. ${o}`).join('\n');
    return `Q${i + 1}: ${q.question}\n${opts}\nCorrect: ${String.fromCharCode(65 + (q.correctAnswer ?? 0))}`;
  });

  const lang = locale === 'ro' ? 'Romanian' : 'English';
  const s = STUDY_SUMMARY_SECTIONS[locale];

  const parentBlock =
    parentSummaryMarkdown && parentChapterTitle
      ? `
Parent chapter reference (${parentChapterTitle}) — use for style and factual alignment only; do NOT copy unrelated sections; focus ONLY on the sub-topic "${chapterTitle}":
---
${parentSummaryMarkdown.slice(0, 4000)}
---
`
      : '';

  return `You are a medical education author preparing admission-exam study material in Barron's style.

Write a focused TOPIC summary in ${lang} for ONE quiz sub-chapter:
- Module: ${moduleId}
- Sub-chapter: ${chapterTitle}
${parentChapterTitle ? `- Part of parent chapter: ${parentChapterTitle}` : ''}

Use EXACTLY this markdown structure (keep ## markers; headings must match exactly):

## ${s.learn}
(2 sentences — scope of this sub-topic only)

## ${s.concepts}
- **Term**: short explanation
(4-7 bullets)

## ${s.clinical}
- (2-3 bullets with **bold** lead terms)

## ${s.pitfalls}
- (2-4 bullets)

## ${s.mini}
(3-5 lines, one paragraph)

${TOPIC_STYLE_RULES}
${parentBlock}

Rules:
- Accurate, undergraduate medical level
- Cover ONLY this sub-topic; do NOT summarize the entire parent chapter
- Do NOT invent facts not supported by the quiz items below
- Output ONLY markdown, no code fences

Quiz items from this sub-chapter:
${sample.join('\n\n')}`;
}

export function buildReformatSummaryPrompt(params: {
  chapterTitle: string;
  locale: 'ro' | 'en';
  existingMarkdown: string;
  referenceMarkdown: string;
}): string {
  const { chapterTitle, locale, existingMarkdown, referenceMarkdown } = params;
  const lang = locale === 'ro' ? 'Romanian' : 'English';
  const s = STUDY_SUMMARY_SECTIONS[locale];

  return `Reformat this ${lang} medical chapter summary to match the REFERENCE layout and style exactly.

Chapter: ${chapterTitle}

REFERENCE (style only — do not copy unrelated facts):
---
${referenceMarkdown}
---

CURRENT (preserve accurate facts, fix structure and tone):
---
${existingMarkdown}
---

Output markdown with these exact headings:
## ${s.learn}
## ${s.concepts}
## ${s.clinical}
## ${s.pitfalls}
## ${s.mini}

${STYLE_RULES}

Output ONLY markdown, no code fences.`;
}
