import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, Zap } from "lucide-react";

interface ScoreDisplayProps {
  label: string;
  score: number;
  maxScore?: number;
  type: 'readability' | 'seo' | 'keyword';
  icon?: React.ReactNode;
}

export function ScoreDisplay({ label, score, maxScore = 100, type, icon }: ScoreDisplayProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good"; 
    if (score >= 40) return "score-fair";
    return "score-poor";
  };

  const getGradientClass = (score: number) => {
    if (score >= 80) return "gradient-success";
    if (score >= 60) return "from-blue-500 to-blue-600";
    if (score >= 40) return "gradient-warning";
    return "gradient-error";
  };

  const defaultIcons = {
    readability: <Target className="w-5 h-5" />,
    seo: <TrendingUp className="w-5 h-5" />,
    keyword: <Zap className="w-5 h-5" />
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${getGradientClass(score)}`}>
            {icon || defaultIcons[type]}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground">Current performance</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-sm text-muted-foreground">
            / {maxScore}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className="h-3 bg-muted"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>
    </div>
  );
}