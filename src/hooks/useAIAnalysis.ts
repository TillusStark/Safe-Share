
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  success: boolean;
  analysis: string;
  type: 'comment' | 'story';
  error?: string;
}

export const useAIAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeContent = async (
    type: 'comment' | 'story',
    content: string,
    context?: string
  ): Promise<AnalysisResult | null> => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-analyzer', {
        body: { type, content, context }
      });

      if (error) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze content. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      return data as AnalysisResult;
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeContent,
    isAnalyzing
  };
};
