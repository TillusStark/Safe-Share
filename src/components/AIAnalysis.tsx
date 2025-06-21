
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, TrendingUp, MessageCircle, Eye } from 'lucide-react';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AIAnalysisProps {
  type: 'comment' | 'story';
  content: string;
  context?: string;
  trigger?: React.ReactNode;
}

const AIAnalysis = ({ type, content, context, trigger }: AIAnalysisProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { analyzeContent, isAnalyzing } = useAIAnalysis();

  const handleAnalyze = async () => {
    const result = await analyzeContent(type, content, context);
    if (result?.success) {
      setAnalysis(result.analysis);
    }
  };

  const formatAnalysis = (analysisText: string) => {
    try {
      const parsed = JSON.parse(analysisText);
      return parsed;
    } catch {
      return analysisText;
    }
  };

  const renderAnalysisContent = () => {
    if (!analysis) return null;

    const formatted = formatAnalysis(analysis);
    
    if (typeof formatted === 'object') {
      return (
        <div className="space-y-4">
          {Object.entries(formatted).map(([key, value]) => (
            <div key={key} className="border-b pb-2">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <p className="mt-1 text-sm">{String(value)}</p>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap">{analysis}</p>;
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Brain className="h-4 w-4" />
      {type === 'comment' ? 'Analyze Comment' : 'Analyze Story'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI {type === 'comment' ? 'Comment' : 'Story'} Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!analysis && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get AI-powered insights about this {type}
              </p>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
            </div>
          )}

          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {type === 'comment' ? <MessageCircle className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderAnalysisContent()}
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Re-analyze
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAnalysis;
