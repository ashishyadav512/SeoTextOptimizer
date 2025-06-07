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
  BarChart3
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">SEO Text Analyzer</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content Input</CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your blog post, newsletter, tweet, or any content you want to optimize for SEO..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-80 resize-none"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={handleClearText}>
                      Clear Text
                    </Button>
                    <Button variant="outline" onClick={handlePasteFromClipboard}>
                      Paste from Clipboard
                    </Button>
                  </div>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={!content.trim() || analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? "Analyzing..." : "Analyze Content"}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    SEO Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Readability Score</span>
                      <span className="text-2xl font-bold text-green-600">{analysisResults.readabilityScore}</span>
                    </div>
                    <Progress value={analysisResults.readabilityScore} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SEO Score</span>
                      <span className="text-2xl font-bold text-primary">{analysisResults.seoScore}</span>
                    </div>
                    <Progress value={analysisResults.seoScore} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Keyword Density</span>
                      <span className="text-2xl font-bold text-yellow-600">{analysisResults.keywordDensity}%</span>
                    </div>
                    <Progress value={analysisResults.keywordDensity * 20} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keyword Suggestions */}
            {analysisResults?.suggestedKeywords && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Recommended Keywords
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {analysisResults.suggestedKeywords.filter(k => !k.inserted).length} available
                    </Badge>
                  </CardTitle>
                  
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
                <CardContent>
                  <div className="space-y-3">
                    {analysisResults.suggestedKeywords.map((keyword, index) => (
                      <div 
                        key={index} 
                        className={`group transition-all duration-200 p-3 rounded-lg border cursor-pointer ${
                          keyword.inserted 
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                            : selectedKeywords.includes(keyword.term)
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                            : 'bg-muted hover:bg-accent border-transparent hover:border-border'
                        }`}
                        onClick={() => {
                          if (keyword.inserted) return;
                          if (insertionMode === 'individual') {
                            handleInsertKeyword(keyword.term);
                          } else {
                            handleSelectKeyword(keyword.term);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 flex items-center space-x-3">
                            {!keyword.inserted && insertionMode === 'bulk' && (
                              <input
                                type="checkbox"
                                checked={selectedKeywords.includes(keyword.term)}
                                onChange={() => handleSelectKeyword(keyword.term)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${
                                  keyword.inserted 
                                    ? 'text-green-700 dark:text-green-300' 
                                    : selectedKeywords.includes(keyword.term)
                                    ? 'text-blue-700 dark:text-blue-300'
                                    : ''
                                }`}>
                                  {keyword.term}
                                </span>
                                {keyword.inserted && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  {keyword.volume}
                                </span>
                                <Badge 
                                  className={`${getDifficultyColor(keyword.difficulty)} text-xs`} 
                                  variant="secondary"
                                >
                                  {keyword.difficulty} difficulty
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {insertionMode === 'individual' && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInsertKeyword(keyword.term);
                              }}
                              disabled={keyword.inserted || insertKeywordMutation.isPending || !content.trim()}
                              variant={keyword.inserted ? "secondary" : "default"}
                              className={`ml-3 transition-all duration-200 ${
                                keyword.inserted 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' 
                                  : 'hover:scale-105'
                              }`}
                            >
                              {insertKeywordMutation.isPending && insertKeywordMutation.variables?.keyword === keyword.term ? (
                                <div className="flex items-center">
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                                  Inserting...
                                </div>
                              ) : keyword.inserted ? (
                                "✓ Inserted"
                              ) : (
                                "Insert Now"
                              )}
                            </Button>
                          )}
                          
                          {insertionMode === 'bulk' && !keyword.inserted && (
                            <div className="ml-3 text-xs text-muted-foreground">
                              {selectedKeywords.includes(keyword.term) ? "Selected for bulk insert" : "Click to select"}
                            </div>
                          )}
                        </div>
                        
                        {keyword.inserted && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                            Successfully added to your content
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {analysisResults.suggestedKeywords.filter(k => k.inserted).length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          {analysisResults.suggestedKeywords.filter(k => k.inserted).length} keywords added
                        </span>
                        <span className="ml-2 text-green-600 dark:text-green-400">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Optimization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResults.optimizationTips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        {getTipIcon(tip.type)}
                        <div>
                          <p className="text-sm font-medium">{tip.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Loading state */}
            {analysisMutation.isPending && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span>Analyzing your content...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Real-time Analysis</h4>
              <p className="text-muted-foreground text-sm">Get instant SEO insights as you type with our advanced text analysis engine.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Smart Keyword Insertion</h4>
              <p className="text-muted-foreground text-sm">Intelligently place keywords while maintaining natural flow and readability.</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Competitive Intelligence</h4>
              <p className="text-muted-foreground text-sm">Discover what keywords and strategies top-ranking content uses in your niche.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
