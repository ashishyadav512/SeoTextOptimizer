import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { debounce, countWords, countCharacters, highlightKeywords } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { KeywordCard } from "@/components/KeywordCard";
import { OptimizationTipCard } from "@/components/OptimizationTipCard";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  TrendingUp,
  Copy,
  RotateCcw,
  Sparkles,
  Search,
  BarChart3,
  FileText,
  Zap,
  Target,
  ChevronRight,
  Download,
  Upload
} from "lucide-react";

interface KeywordSuggestion {
  term: string;
  volume: string;
  difficulty: 'Low' | 'Medium' | 'High';
  inserted: boolean;
}

interface OptimizationTip {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

interface AnalysisResponse {
  readabilityScore: number;
  seoScore: number;
  keywordDensity: number;
  suggestedKeywords: KeywordSuggestion[];
  optimizationTips: OptimizationTip[];
  analysisResults: Record<string, any>;
}

export default function SEOAnalyzer() {
  const [content, setContent] = useState("");
  const [optimizedContent, setOptimizedContent] = useState("");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResponse | null>(null);
  const [insertedKeywords, setInsertedKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [insertionMode, setInsertionMode] = useState<'individual' | 'bulk'>('individual');
  const { toast } = useToast();

  const wordCount = countWords(content);
  const charCount = countCharacters(content);

  // SEO Analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/analyze", { content: text });
      return response.json() as Promise<AnalysisResponse>;
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      setOptimizedContent(content);
      toast({
        title: "Analysis Complete",
        description: "Your content has been analyzed for SEO optimization.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Keyword insertion mutation
  const insertKeywordMutation = useMutation({
    mutationFn: async ({ keyword }: { keyword: string }) => {
      const response = await apiRequest("POST", "/api/insert-keyword", {
        content: optimizedContent || content,
        keyword,
      });
      return response.json() as Promise<{ optimizedContent: string }>;
    },
    onSuccess: (data, variables) => {
      setOptimizedContent(data.optimizedContent);
      setInsertedKeywords(prev => [...prev, variables.keyword]);
      
      // Update the keyword as inserted in analysis results
      if (analysisResults) {
        const updatedKeywords = analysisResults.suggestedKeywords.map(k => 
          k.term === variables.keyword ? { ...k, inserted: true } : k
        );
        setAnalysisResults({
          ...analysisResults,
          suggestedKeywords: updatedKeywords,
        });
      }
      
      toast({
        title: "Keyword Inserted",
        description: `"${variables.keyword}" has been added to your content.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Insertion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Debounced analysis trigger
  const debouncedAnalyze = useCallback(
    debounce((text: string) => {
      if (text.trim().length > 50) {
        analysisMutation.mutate(text);
      }
    }, 1500),
    []
  );

  // Auto-analyze on content change
  useEffect(() => {
    if (content.trim()) {
      debouncedAnalyze(content);
    }
  }, [content, debouncedAnalyze]);

  const handleAnalyze = () => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some content to analyze.",
        variant: "destructive",
      });
      return;
    }
    analysisMutation.mutate(content);
  };

  const handleInsertKeyword = (keyword: string) => {
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please enter some content before inserting keywords.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if keyword already exists
    const keywordRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (keywordRegex.test(optimizedContent || content)) {
      toast({
        title: "Keyword Already Present",
        description: `"${keyword}" already exists in your content.`,
        variant: "destructive",
      });
      return;
    }
    
    insertKeywordMutation.mutate({ keyword });
  };

  const handleClearText = () => {
    setContent("");
    setOptimizedContent("");
    setAnalysisResults(null);
    setInsertedKeywords([]);
    setSelectedKeywords([]);
  };

  const handleSelectKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword) 
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleSelectAllKeywords = () => {
    if (!analysisResults?.suggestedKeywords) return;
    
    const availableKeywords = analysisResults.suggestedKeywords
      .filter(k => !k.inserted)
      .map(k => k.term);
    
    setSelectedKeywords(
      selectedKeywords.length === availableKeywords.length ? [] : availableKeywords
    );
  };

  // Bulk keyword insertion mutation
  const bulkInsertMutation = useMutation({
    mutationFn: async ({ keywords }: { keywords: string[] }) => {
      const response = await apiRequest("POST", "/api/insert-keywords-bulk", {
        content: optimizedContent || content,
        keywords,
      });
      return response.json() as Promise<{ 
        optimizedContent: string; 
        insertedKeywords: string[]; 
        skippedKeywords: string[];
        totalInserted: number;
      }>;
    },
    onSuccess: (data) => {
      setOptimizedContent(data.optimizedContent);
      setInsertedKeywords(prev => [...prev, ...data.insertedKeywords]);
      
      // Update inserted keywords in analysis results
      if (analysisResults) {
        const updatedKeywords = analysisResults.suggestedKeywords.map(k => 
          data.insertedKeywords.includes(k.term) ? { ...k, inserted: true } : k
        );
        setAnalysisResults({
          ...analysisResults,
          suggestedKeywords: updatedKeywords,
        });
      }
      
      const successMessage = data.totalInserted > 0 
        ? `${data.totalInserted} keywords inserted successfully` 
        : "No new keywords were added";
      
      const warningMessage = data.skippedKeywords.length > 0 
        ? ` (${data.skippedKeywords.length} already existed)` 
        : "";
      
      toast({
        title: "Bulk Insertion Complete",
        description: successMessage + warningMessage,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Insertion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInsertSelectedKeywords = () => {
    if (selectedKeywords.length === 0) return;
    bulkInsertMutation.mutate({ keywords: selectedKeywords });
    setSelectedKeywords([]);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(optimizedContent || content);
      toast({
        title: "Copied!",
        description: "Content copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleRevertChanges = () => {
    setOptimizedContent(content);
    setInsertedKeywords([]);
    setSelectedKeywords([]);
    if (analysisResults) {
      const resetKeywords = analysisResults.suggestedKeywords.map(k => ({ ...k, inserted: false }));
      setAnalysisResults({
        ...analysisResults,
        suggestedKeywords: resetKeywords,
      });
    }
    toast({
      title: "Changes Reverted",
      description: "Content restored to original version.",
    });
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      toast({
        title: "Content Pasted",
        description: "Content has been pasted from clipboard.",
      });
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: "Failed to paste from clipboard.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">SEO Analyzer</h1>
                <p className="text-xs text-muted-foreground">Professional Content Optimization</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <FileText className="w-4 h-4 mr-2" />
                Features
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Support</a>
              <Button>Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">Optimize Your Content for Better SEO</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Analyze your blog posts, newsletters, tweets, and social media captions to improve readability, 
            discover keyword opportunities, and boost your search engine rankings.
          </p>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Input */}
          <div className="lg:col-span-3 space-y-6">
            {/* Text Input Card */}
            <Card className="glass-effect border-border/50 hover-glow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Content Input</CardTitle>
                      <p className="text-sm text-muted-foreground">Paste your content for SEO analysis</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <Badge variant="outline" className="bg-background/50">
                      {wordCount} words
                    </Badge>
                    <Badge variant="outline" className="bg-background/50">
                      {charCount} chars
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Paste your blog post, newsletter, tweet, or any content you want to optimize for SEO..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-80 resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  />
                  {content && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Ready for analysis
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={handleClearText} size="sm" className="hover-glow">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button variant="outline" onClick={handlePasteFromClipboard} size="sm" className="hover-glow">
                      <Upload className="w-4 h-4 mr-2" />
                      Paste
                    </Button>
                  </div>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!content.trim() || analysisMutation.isPending}
                    className="gradient-primary hover:opacity-90 transition-all duration-300 shadow-lg"
                  >
                    {analysisMutation.isPending ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze Content
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card - Always show when content exists */}
            {content.trim() && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {insertedKeywords.length > 0 ? "Optimized Preview" : "Content Preview"}
                      {insertedKeywords.length > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                          {insertedKeywords.length} keywords added
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy {insertedKeywords.length > 0 ? "Optimized" : "Original"}
                      </Button>
                      {insertedKeywords.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleRevertChanges}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Revert Changes
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className="prose prose-sm max-w-none p-4 bg-muted rounded-lg border min-h-[200px] whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeywords(optimizedContent || content, insertedKeywords)
                      }}
                    />
                    
                    {insertedKeywords.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-green-700 dark:text-green-300">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="font-medium">Keywords Added:</span>
                            <span className="ml-2">{insertedKeywords.join(", ")}</span>
                          </div>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            +{Math.round(insertedKeywords.length * 3.8)}% SEO boost
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analysis Overview */}
            {analysisResults && (
              <Card className="glass-effect border-border/50 hover-glow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">SEO Analysis</CardTitle>
                      <p className="text-sm text-muted-foreground">Content performance metrics</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ScoreDisplay
                    label="Readability Score"
                    score={analysisResults.readabilityScore}
                    type="readability"
                    icon={<Target className="w-5 h-5" />}
                  />
                  
                  <ScoreDisplay
                    label="SEO Score"
                    score={analysisResults.seoScore}
                    type="seo"
                    icon={<TrendingUp className="w-5 h-5" />}
                  />
                  
                  <ScoreDisplay
                    label="Keyword Density"
                    score={analysisResults.keywordDensity}
                    maxScore={5}
                    type="keyword"
                    icon={<Zap className="w-5 h-5" />}
                  />
                </CardContent>
              </Card>
            )}

            {/* Keyword Suggestions */}
            {analysisResults?.suggestedKeywords && (
              <Card className="glass-effect border-border/50 hover-glow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Keyword Suggestions</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {analysisResults.suggestedKeywords.filter(k => !k.inserted).length} opportunities available
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-background/50">
                      {analysisResults.suggestedKeywords.filter(k => !k.inserted).length} available
                    </Badge>
                  </div>
                  
                  {/* Insertion Mode Selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground">Insertion mode:</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={insertionMode === 'individual' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setInsertionMode('individual');
                            setSelectedKeywords([]);
                          }}
                          className="text-xs"
                        >
                          Individual
                        </Button>
                        <Button
                          variant={insertionMode === 'bulk' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setInsertionMode('bulk');
                            setSelectedKeywords([]);
                          }}
                          className="text-xs"
                        >
                          Bulk Select
                        </Button>
                      </div>
                    </div>
                    
                    {insertionMode === 'bulk' && analysisResults.suggestedKeywords.filter(k => !k.inserted).length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSelectAllKeywords}
                        className="text-xs"
                      >
                        {selectedKeywords.length === analysisResults.suggestedKeywords.filter(k => !k.inserted).length 
                          ? "Deselect All" 
                          : "Select All"}
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {insertionMode === 'individual' 
                      ? "Click any keyword to insert it individually into your content"
                      : "Select multiple keywords and insert them all at once"
                    }
                  </p>
                  
                  {/* Bulk insertion controls */}
                  {insertionMode === 'bulk' && (
                    <div className="mt-3 space-y-3">
                      {selectedKeywords.length > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                              {selectedKeywords.length} keywords selected
                            </span>
                            <Button 
                              size="sm"
                              onClick={handleInsertSelectedKeywords}
                              disabled={bulkInsertMutation.isPending || insertKeywordMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {bulkInsertMutation.isPending ? (
                                <>
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                  Inserting...
                                </>
                              ) : (
                                `Insert Selected (${selectedKeywords.length})`
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Quick insert all button */}
                      {analysisResults.suggestedKeywords.filter(k => !k.inserted).length > 1 && (
                        <div className="flex justify-center">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const availableKeywords = analysisResults.suggestedKeywords
                                .filter(k => !k.inserted)
                                .map(k => k.term);
                              bulkInsertMutation.mutate({ keywords: availableKeywords });
                            }}
                            disabled={bulkInsertMutation.isPending || insertKeywordMutation.isPending}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            {bulkInsertMutation.isPending ? (
                              <>
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                                Inserting...
                              </>
                            ) : (
                              `Insert All Available (${analysisResults.suggestedKeywords.filter(k => !k.inserted).length})`
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResults.suggestedKeywords.map((keyword, index) => (
                    <KeywordCard
                      key={index}
                      keyword={keyword}
                      onInsert={handleInsertKeyword}
                      onToggleSelect={handleSelectKeyword}
                      isSelected={selectedKeywords.includes(keyword.term)}
                      isInserting={insertKeywordMutation.isPending && insertKeywordMutation.variables?.keyword === keyword.term}
                    />
                  ))}
                  
                  {/* Bulk Selection Controls */}
                  {insertionMode === 'bulk' && selectedKeywords.length > 0 && (
                    <div className="mt-4 p-4 glass-effect rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            {selectedKeywords.length} selected
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Ready for bulk insertion
                          </span>
                        </div>
                        <Button 
                          onClick={handleInsertSelectedKeywords}
                          disabled={bulkInsertMutation.isPending}
                          className="gradient-primary hover:opacity-90"
                          size="sm"
                        >
                          {bulkInsertMutation.isPending ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                              Inserting...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Insert Selected
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {analysisResults.suggestedKeywords.filter(k => k.inserted).length > 0 && (
                    <div className="mt-4 p-4 gradient-success rounded-lg text-white">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {analysisResults.suggestedKeywords.filter(k => k.inserted).length} keywords successfully added
                        </span>
                        <ChevronRight className="w-4 h-4" />
                        <span>
                          +{Math.round(analysisResults.suggestedKeywords.filter(k => k.inserted).length * 3.8)}% SEO boost
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Optimization Tips */}
            {analysisResults?.optimizationTips && (
              <Card className="glass-effect border-border/50 hover-glow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Optimization Tips</CardTitle>
                      <p className="text-sm text-muted-foreground">Actionable recommendations</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResults.optimizationTips.map((tip, index) => (
                    <OptimizationTipCard key={index} tip={tip} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Loading state */}
            {analysisMutation.isPending && (
              <Card className="glass-effect border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center space-x-3 py-8">
                    <Sparkles className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-lg font-medium">Analyzing your content...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center glass-effect border-border/50 hover-glow">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">Real-time Analysis</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">Get instant SEO insights with our advanced TextRazor-powered analysis engine.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center glass-effect border-border/50 hover-glow">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">Smart Keyword Insertion</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">Intelligently place keywords while maintaining natural flow and readability.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center glass-effect border-border/50 hover-glow">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 gradient-warning rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-foreground">Professional Insights</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">Discover optimization opportunities and strategies for better search rankings.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
