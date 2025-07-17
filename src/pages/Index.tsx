import { useState, useEffect } from 'react';
import { Brain, FileText, MessageSquare, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PDFUpload } from '@/components/PDFUpload';
import { QuestionInput } from '@/components/QuestionInput';
import { AnswerDisplay } from '@/components/AnswerDisplay';


interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sources?: string[];
}


const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQAHistory] = useState<QAItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const { toast } = useToast();

  // Backend API configuration - these would typically come from environment variables
  const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }

      const result = await response.json();
      setUploadedFile(file);
      
      toast({
        title: "PDF uploaded successfully",
        description: `${file.name} has been processed and is ready for questions.`,
      });

      // Clear previous Q&A history when new file is uploaded
      setQAHistory([]);
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload and process the PDF. Please check your backend connection.",
        variant: "destructive",
      });
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  const handleFileRemove = () => {
  setUploadedFile(null);
  const fileInput = document.getElementById('pdf-upload') as HTMLInputElement | null;
  if (fileInput) fileInput.value = '';
};

  const handleAskQuestion = async (question: string) => {
    if (!uploadedFile) {
      toast({
        title: "No PDF uploaded",
        description: "Please upload a PDF first before asking questions.",
        variant: "destructive",
      });
      return;
    }

    setIsAsking(true);
    setCurrentQuestion(question);

    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const result = await response.json();
      
      const newQA: QAItem = {
        id: Date.now().toString(),
        question,
        answer: result.answer,
        timestamp: new Date(),
        sources: result.sources || [],
      };

      setQAHistory(prev => [newQA, ...prev]);
      
      toast({
        title: "Question answered",
        description: "Your question has been processed successfully.",
      });

    } catch (error) {
      toast({
        title: "Failed to get answer",
        description: "Could not process your question. Please check your backend connection.",
        variant: "destructive",
      });
      console.error('Question error:', error);
    } finally {
      setIsAsking(false);
      setCurrentQuestion('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">RAG PDF Q&A</h1>
                <p className="text-sm text-muted-foreground">Ask questions about your documents</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  backendStatus === 'connected' ? 'bg-success' : 
                  backendStatus === 'disconnected' ? 'bg-destructive' : 'bg-warning'
                }`} />
                <span className="text-sm text-muted-foreground">
                  Backend {backendStatus === 'checking' ? 'checking...' : backendStatus}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkBackendStatus}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Backend Status Warning */}
      {backendStatus === 'disconnected' && (
        <div className="bg-warning/10 border-b border-warning/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center space-x-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Backend Disconnected</span>
              <span className="text-warning/80">- Please ensure your FastAPI server is running on {API_BASE_URL}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {uploadedFile ? '1' : '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">PDF Uploaded</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {qaHistory.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Questions Answered</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {backendStatus === 'connected' ? 'Ready' : 'Offline'}
                  </div>
                  <div className="text-sm text-muted-foreground">AI Status</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Upload & Question */}
            <div className="space-y-6">
              <PDFUpload
                uploadedFile={uploadedFile}
                isUploading={isUploading}
                 onFileUpload={handleFileUpload}
                 onFileRemove={handleFileRemove}
/>

              <QuestionInput
                onAskQuestion={handleAskQuestion}
                isLoading={isAsking}
                disabled={!uploadedFile || backendStatus !== 'connected'}
              />
            </div>

            {/* Right Column - Answers */}
            <div>
              <AnswerDisplay
                qaHistory={qaHistory}
                isLoading={isAsking}
                currentQuestion={currentQuestion}
              />
            </div>
          </div>

          {/* Setup Instructions */}
          {backendStatus === 'disconnected' && (
            <Card className="mt-8 p-6 border-warning/20 bg-warning/5">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Backend Setup Required</span>
                </h3>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>To use this application, you need to set up the FastAPI backend:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Create a FastAPI server with endpoints: <code>/upload</code>, <code>/ask</code>, <code>/health</code></li>
                    <li>Install dependencies: PyMuPDF, LangChain, FAISS, sentence-transformers</li>
                    <li>Configure your local LLM endpoint (e.g., Ollama on localhost:11434)</li>
                    <li>Start the server on <code>{API_BASE_URL}</code></li>
                  </ol>
                  <p className="mt-3">
                    <strong>Note:</strong> This frontend is ready to connect once your backend is running!
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
