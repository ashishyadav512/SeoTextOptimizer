import { pgTable, text, serial, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const seoAnalyses = pgTable("seo_analyses", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  readabilityScore: real("readability_score"),
  seoScore: real("seo_score"),
  keywordDensity: real("keyword_density"),
  suggestedKeywords: jsonb("suggested_keywords").$type<KeywordSuggestion[]>(),
  optimizationTips: jsonb("optimization_tips").$type<OptimizationTip[]>(),
  analysisResults: jsonb("analysis_results").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSeoAnalysisSchema = createInsertSchema(seoAnalyses).pick({
  content: true,
});

export type InsertSeoAnalysis = z.infer<typeof insertSeoAnalysisSchema>;
export type SeoAnalysis = typeof seoAnalyses.$inferSelect;

export interface KeywordSuggestion {
  term: string;
  volume: string;
  difficulty: 'Low' | 'Medium' | 'High';
  inserted: boolean;
}

export interface OptimizationTip {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

export interface AnalysisRequest {
  content: string;
}

export interface AnalysisResponse {
  readabilityScore: number;
  seoScore: number;
  keywordDensity: number;
  suggestedKeywords: KeywordSuggestion[];
  optimizationTips: OptimizationTip[];
  analysisResults: Record<string, any>;
}
