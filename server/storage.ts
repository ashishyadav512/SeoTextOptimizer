import { seoAnalyses, type SeoAnalysis, type InsertSeoAnalysis, type KeywordSuggestion, type OptimizationTip } from "@shared/schema";

export interface IStorage {
  createSeoAnalysis(analysis: InsertSeoAnalysis): Promise<SeoAnalysis>;
  getSeoAnalysis(id: number): Promise<SeoAnalysis | undefined>;
  getAllSeoAnalyses(): Promise<SeoAnalysis[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, SeoAnalysis>;
  private currentId: number;

  constructor() {
    this.analyses = new Map();
    this.currentId = 1;
  }

  async createSeoAnalysis(insertAnalysis: InsertSeoAnalysis): Promise<SeoAnalysis> {
    const id = this.currentId++;
    const analysis: SeoAnalysis = {
      ...insertAnalysis,
      id,
      readabilityScore: null,
      seoScore: null,
      keywordDensity: null,
      suggestedKeywords: null,
      optimizationTips: null,
      analysisResults: null,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getSeoAnalysis(id: number): Promise<SeoAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async getAllSeoAnalyses(): Promise<SeoAnalysis[]> {
    return Array.from(this.analyses.values());
  }
}

export const storage = new MemStorage();
