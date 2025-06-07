import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Plus, TrendingUp, Volume2 } from "lucide-react";

interface KeywordSuggestion {
  term: string;
  volume: string;
  difficulty: 'Low' | 'Medium' | 'High';
  inserted: boolean;
}

interface KeywordCardProps {
  keyword: KeywordSuggestion;
  onInsert: (keyword: string) => void;
  onToggleSelect: (keyword: string) => void;
  isSelected: boolean;
  isInserting: boolean;
}

export function KeywordCard({ keyword, onInsert, onToggleSelect, isSelected, isInserting }: KeywordCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className={`transition-all duration-300 hover:scale-105 hover-glow ${
      isSelected ? 'ring-2 ring-primary border-primary/50' : ''
    } ${keyword.inserted ? 'bg-green-500/10 border-green-500/30' : 'glass-effect'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm leading-tight">
                {keyword.term}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  {keyword.volume}
                </div>
                <Badge className={`text-xs px-2 py-0.5 ${getDifficultyColor(keyword.difficulty)}`}>
                  {keyword.difficulty}
                </Badge>
              </div>
            </div>
            
            {keyword.inserted && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex gap-2">
            {!keyword.inserted && (
              <>
                <Button
                  size="sm"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onToggleSelect(keyword.term)}
                  className="flex-1 h-8 text-xs"
                >
                  {isSelected ? "Selected" : "Select"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onInsert(keyword.term)}
                  disabled={isInserting}
                  className="px-3 h-8 bg-gradient-to-r gradient-primary hover:opacity-90"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </>
            )}
            
            {keyword.inserted && (
              <div className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <TrendingUp className="w-3 h-3" />
                Inserted
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}