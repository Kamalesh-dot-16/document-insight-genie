import { useState } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface QuestionInputProps {
  onAskQuestion: (question: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const QuestionInput = ({ onAskQuestion, isLoading, disabled }: QuestionInputProps) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading && !disabled) {
      onAskQuestion(question.trim());
      setQuestion('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const exampleQuestions = [
    "What is the main topic of this document?",
    "Can you summarize the key points?",
    "What are the conclusions mentioned?",
    "Are there any important dates or numbers?"
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Ask a Question
          </h3>
          <p className="text-muted-foreground">
            Ask anything about your uploaded PDF document
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Please upload a PDF first..." : "Type your question here..."}
              disabled={disabled || isLoading}
              className="min-h-[120px] pr-12 resize-none"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!question.trim() || isLoading || disabled}
              className="absolute bottom-3 right-3"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>

        {!disabled && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Example questions:
            </h4>
            <div className="grid gap-2">
              {exampleQuestions.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuestion(example)}
                  disabled={isLoading}
                  className="text-left text-sm p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};