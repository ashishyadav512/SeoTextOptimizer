import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface OptimizationTip {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

interface OptimizationTipCardProps {
  tip: OptimizationTip;
}

export function OptimizationTipCard({ tip }: OptimizationTipCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-500/10';
      case 'warning': return 'border-l-yellow-500 bg-yellow-500/10';
      case 'error': return 'border-l-red-500 bg-red-500/10';
      default: return 'border-l-blue-500 bg-blue-500/10';
    }
  };

  return (
    <Card className={`border-l-4 ${getBorderColor(tip.type)} transition-all duration-300 hover:scale-[1.02] hover-glow`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(tip.type)}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-foreground text-sm">
              {tip.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tip.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}