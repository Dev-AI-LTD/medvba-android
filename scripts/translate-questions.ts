import "dotenv/config";
import { z } from "zod";
import { sampleQuestions, Question } from "@/mocks/questions";
import { llmGenerateObjectJson } from "@/lib/llm-generate-object-json";
import * as fs from "fs";
import * as path from "path";

const BATCH_SIZE = 10;
const DELAY_MS = 1000;

interface TranslationProgress {
  language: string;
  category: string;
  completed: number;
  total: number;
  batchNumber: number;
  totalBatches: number;
  errors: string[];
}

interface QuestionTranslation {
  id: string;
  question: string;
  options: string[];
  explanation: string;
}

interface CategoryQuestions {
  [category: string]: Question[];
}

const translationSchema = z.object({
  translations: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()).length(5),
      explanation: z.string(),
    })
  ),
});

function groupQuestionsByCategory(questions: Question[]): CategoryQuestions {
  const grouped: CategoryQuestions = {};
  
  questions.forEach((q) => {
    if (!grouped[q.category]) {
      grouped[q.category] = [];
    }
    grouped[q.category].push(q);
  });
  
  return grouped;
}

function logProgress(progress: TranslationProgress) {
  const percentage = ((progress.completed / progress.total) * 100).toFixed(1);
  console.log(
    `[${progress.language.toUpperCase()}] ${progress.category} - ` +
    `Batch ${progress.batchNumber}/${progress.totalBatches} - ` +
    `${progress.completed}/${progress.total} (${percentage}%)`
  );
  
  if (progress.errors.length > 0) {
    console.error(`⚠️  Errors: ${progress.errors.length}`);
  }
}

async function translateBatch(
  batch: Question[],
  targetLanguage: "Spanish" | "Portuguese"
): Promise<QuestionTranslation[]> {
  const questionsForTranslation = batch.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    explanation: q.explanation,
  }));

  const languageCode = targetLanguage === "Spanish" ? "Spanish (ES)" : "Portuguese (PT)";
  
  const prompt = `You are a medical translator specializing in anatomy and medical terminology.

Translate the following anatomy quiz questions from English to ${languageCode}.

CRITICAL REQUIREMENTS:
1. Medical terminology must be accurate and professional
2. Maintain the educational tone
3. Each question MUST have exactly 5 options (A-E)
4. Preserve all anatomical terms with proper translation
5. Explanations must be clear and educational
6. Use standard medical terminology for ${targetLanguage}

Questions to translate:
${JSON.stringify(questionsForTranslation, null, 2)}

Return the translations in the same JSON structure with all fields translated.`;

  const translation = await llmGenerateObjectJson(prompt, translationSchema);

  return translation.translations;
}

async function translateCategory(
  category: string,
  questions: Question[],
  targetLanguage: "Spanish" | "Portuguese"
): Promise<QuestionTranslation[]> {
  const results: QuestionTranslation[] = [];
  const errors: string[] = [];
  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);

  console.log(`\n📚 Starting ${targetLanguage} translation for: ${category}`);
  console.log(`   Total questions: ${questions.length}`);
  console.log(`   Batches: ${totalBatches}\n`);

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

    try {
      logProgress({
        language: targetLanguage === "Spanish" ? "es" : "pt",
        category,
        completed: i,
        total: questions.length,
        batchNumber,
        totalBatches,
        errors,
      });

      const translations = await translateBatch(batch, targetLanguage);
      results.push(...translations);

      logProgress({
        language: targetLanguage === "Spanish" ? "es" : "pt",
        category,
        completed: i + batch.length,
        total: questions.length,
        batchNumber,
        totalBatches,
        errors,
      });

      if (i + BATCH_SIZE < questions.length) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    } catch (error) {
      const errorMsg = `Batch ${batchNumber} failed: ${error}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
      
      // Retry once after a longer delay
      try {
        console.log(`🔄 Retrying batch ${batchNumber}...`);
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS * 3));
        const translations = await translateBatch(batch, targetLanguage);
        results.push(...translations);
        console.log(`✅ Retry successful for batch ${batchNumber}`);
      } catch (retryError) {
        console.error(`❌ Retry failed for batch ${batchNumber}: ${retryError}`);
      }
    }
  }

  console.log(`✅ Completed ${category}: ${results.length}/${questions.length} questions\n`);
  
  return results;
}

function generateTypeScriptFile(
  translations: QuestionTranslation[],
  originalQuestions: Question[],
  language: "es" | "pt"
): string {
  const translationMap = new Map(translations.map((t) => [t.id, t]));
  
  const questionsWithTranslations = originalQuestions.map((q) => {
    const translation = translationMap.get(q.id);
    
    if (!translation) {
      console.warn(`⚠️  No translation found for question: ${q.id}`);
      return q;
    }

    return {
      ...q,
      [`question_${language}`]: translation.question,
      [`options_${language}`]: translation.options,
      [`explanation_${language}`]: translation.explanation,
    };
  });

  return `// Auto-generated translation file for ${language.toUpperCase()}
// Generated on: ${new Date().toISOString()}

import { Question } from './questions';

export const questions_${language}: Question[] = ${JSON.stringify(questionsWithTranslations, null, 2)};
`;
}

function generateByChapterFiles(
  categoryGroups: CategoryQuestions,
  translations: Map<string, QuestionTranslation>,
  language: "es" | "pt"
): Map<string, string> {
  const files = new Map<string, string>();

  for (const [category, questions] of Object.entries(categoryGroups)) {
    const safeCategory = category.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    const questionsWithTranslations = questions.map((q) => {
      const translation = translations.get(q.id);
      
      if (!translation) {
        return q;
      }

      return {
        ...q,
        [`question_${language}`]: translation.question,
        [`options_${language}`]: translation.options,
        [`explanation_${language}`]: translation.explanation,
      };
    });

    const content = `// ${language.toUpperCase()} translations for category: ${category}
// Generated on: ${new Date().toISOString()}

import { Question } from './questions';

export const ${safeCategory}_questions_${language}: Question[] = ${JSON.stringify(questionsWithTranslations, null, 2)};
`;

    files.set(`questions_${safeCategory}_${language}.ts`, content);
  }

  return files;
}

async function main() {
  console.log("🚀 Starting Medical Anatomy Questions Translation\n");
  console.log(`📊 Total questions to translate: ${sampleQuestions.length}\n`);

  const categoryGroups = groupQuestionsByCategory(sampleQuestions);
  const categories = Object.keys(categoryGroups).sort();

  console.log(`📁 Categories found: ${categories.length}`);
  categories.forEach((cat) => {
    console.log(`   - ${cat}: ${categoryGroups[cat].length} questions`);
  });

  const languages: { name: "Spanish" | "Portuguese"; code: "es" | "pt" }[] = [
    { name: "Spanish", code: "es" },
    { name: "Portuguese", code: "pt" },
  ];

  for (const lang of languages) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`🌐 Starting ${lang.name.toUpperCase()} Translation`);
    console.log(`${"=".repeat(80)}\n`);

    const allTranslations: QuestionTranslation[] = [];

    for (const category of categories) {
      const questions = categoryGroups[category];
      const translations = await translateCategory(category, questions, lang.name);
      allTranslations.push(...translations);
    }

    console.log(`\n✨ ${lang.name} Translation Summary:`);
    console.log(`   Total translated: ${allTranslations.length}/${sampleQuestions.length}`);
    console.log(`   Success rate: ${((allTranslations.length / sampleQuestions.length) * 100).toFixed(1)}%\n`);

    // Generate main translation file
    const mainFile = generateTypeScriptFile(allTranslations, sampleQuestions, lang.code);
    const mainFilePath = path.join(process.cwd(), "mocks", `questions_${lang.code}.ts`);
    fs.writeFileSync(mainFilePath, mainFile, "utf-8");
    console.log(`✅ Written: mocks/questions_${lang.code}.ts`);

    // Generate by-chapter files
    const translationMap = new Map(allTranslations.map((t) => [t.id, t]));
    const chapterFiles = generateByChapterFiles(categoryGroups, translationMap, lang.code);
    
    const chaptersDir = path.join(process.cwd(), "mocks", "chapters", lang.code);
    if (!fs.existsSync(chaptersDir)) {
      fs.mkdirSync(chaptersDir, { recursive: true });
    }

    for (const [fileName, content] of chapterFiles) {
      const filePath = path.join(chaptersDir, fileName);
      fs.writeFileSync(filePath, content, "utf-8");
    }
    
    console.log(`✅ Written ${chapterFiles.size} chapter files to mocks/chapters/${lang.code}/`);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("🎉 Translation Complete!");
  console.log(`${"=".repeat(80)}\n`);
  console.log("📁 Generated files:");
  console.log("   - mocks/questions_es.ts (Spanish)");
  console.log("   - mocks/questions_pt.ts (Portuguese)");
  console.log("   - mocks/chapters/es/ (Spanish by chapter)");
  console.log("   - mocks/chapters/pt/ (Portuguese by chapter)");
  console.log("\n✅ All translations completed successfully!\n");
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
