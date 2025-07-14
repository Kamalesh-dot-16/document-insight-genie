import { useState } from 'react';
import { MessageSquare, Copy, CheckCircle2, FileText, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sources?: string[];
}

interface AnswerDisplayProps {
  qaHistory: QAItem[];
  isLoading: boolean;
  currentQuestion?: string;
}

export const AnswerDisplay = ({ qaHistory, isLoading, currentQuestion }: AnswerDisplayProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Answer has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (qaHistory.length === 0 && !isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Questions Yet
            </h3>
            <p className="text-muted-foreground">
              Upload a PDF and ask your first question to get started
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Q&A History</span>
        </h3>
        {qaHistory.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {qaHistory.length} question{qaHistory.length !== 1 ? 's' : ''} answered
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {/* Current loading question */}
        {isLoading && currentQuestion && (
          <Card className="p-6 border-primary/20 bg-primary/5">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground mb-2">You asked:</div>
                  <div className="text-foreground bg-background/50 rounded-lg p-3">
                    {currentQuestion}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground mb-2">AI is thinking...</div>
                  <div className="bg-accent/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-accent-foreground">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150"></div>
                      <span className="ml-2">Analyzing your document...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Q&A History */}
        {qaHistory.map((qa) => (
          <Card key={qa.id} className="p-6">
            <div className="space-y-4">
              {/* Question */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-foreground">You asked:</div>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(qa.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-foreground bg-muted/30 rounded-lg p-3">
                    {qa.question}
                  </div>
                </div>
              </div>

              {/* Answer */}
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-success-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-foreground">AI Answer:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(qa.answer, qa.id)}
                      className="h-8 px-2"
                    >
                      {copiedId === qa.id ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-foreground bg-success/10 border border-success/20 rounded-lg p-4 whitespace-pre-wrap">
                    {qa.answer}
                  </div>
                  
                  {qa.sources && qa.sources.length > 0 && (
                    <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                      <div className="text-sm font-medium text-accent-foreground mb-1">
                        Sources:
                      </div>
                      <div className="text-sm text-accent-foreground/80">
                        {qa.sources.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {qaHistory.length > 3 && (
        <div className="text-center">
          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Scroll up to see older questions and answers
          </div>
        </div>
      )}
    </div>
  );
};