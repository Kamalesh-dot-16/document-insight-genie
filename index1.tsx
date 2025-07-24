import { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, FileText, MessageSquare, Settings, AlertTriangle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PDFUpload } from '@/components/PDFUpload';
import { QuestionInput } from '@/components/QuestionInput';
import { AnswerDisplay } from '@/components/AnswerDisplay';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface QAItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sources?: string[];
}

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQAHistory] = useState<QAItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const onFilesUpload = (files: File[]) => {
  setUploadedFiles((prev) => [...prev, ...files]);
};
const onFileRemove = (index: number) => {
  setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  setSelectedFileIndex((prev) => {
    if (prev === null) return null;
    if (index === prev) return null;
    if (index < prev) return prev - 1;
    return prev;
  });
};
  const checkBackendStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/health`);
      setBackendStatus(res.status === 200 ? 'connected' : 'disconnected');
    } catch {
      setBackendStatus('disconnected');
    }
  };

  const handleFilesUpload = async (files: File[]) => {
    setIsUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.status === 200) {
          setUploadedFiles(prev => [...prev, file]);
          toast.success(`${file.name} is ready for questions.`);
          if (selectedFileIndex === null) setSelectedFileIndex(0);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      toast.error('Error uploading files. Check backend connection.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileRemove = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null);
      setQAHistory([]);
    } else if (selectedFileIndex && selectedFileIndex > index) {
      setSelectedFileIndex(selectedFileIndex - 1);
    }
  };

 const handleRemoveAllFiles = () => {
  setUploadedFiles([]);         // clear the files array state
  setSelectedFileIndex(null);  // clear selected index
};
const onSelectFile = (index: number) => {
  setSelectedFileIndex(index);
};


  const handleAskQuestion = async (question: string) => {
    if (selectedFileIndex === null || !uploadedFiles[selectedFileIndex]) {
      toast.error('Please select a PDF to ask questions.');
      return;
    }

    setIsAsking(true);
    setCurrentQuestion(question);

    try {
      const response = await axios.post(`${API_BASE_URL}/ask`, {
        question,
      });

      const result = response.data;

      const newQA: QAItem = {
        id: Date.now().toString(),
        question,
        answer: result.answer,
        timestamp: new Date(),
        sources: result.sources || [],
      };

      setQAHistory(prev => [newQA, ...prev]);
    } catch (error) {
      toast.error('Failed to get answer from server.');
      console.error(error);
    } finally {
      setIsAsking(false);
      setCurrentQuestion('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />

      {/* Header */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-50 px-4 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">RAG DOCUMENTS Q&A</h1>
              <p className="text-sm text-muted-foreground">Upload, select & ask questions</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  backendStatus === 'connected'
                    ? 'bg-green-500'
                    : backendStatus === 'disconnected'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {backendStatus === 'checking' ? 'Checking...' : backendStatus}
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={checkBackendStatus}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Backend Warning */}
      {backendStatus === 'disconnected' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 text-yellow-800">
          <AlertTriangle className="inline-block w-5 h-5 mr-2" />
          Backend disconnected — ensure FastAPI server is running at {API_BASE_URL}
        </div>
      )}

      {/* Main */}
      <main className="px-4 py-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <div className="text-xl font-bold">{uploadedFiles.length}</div>
                <div className="text-sm text-muted-foreground">Documents's Uploaded</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <MessageSquare className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-xl font-bold">{qaHistory.length}</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <Brain className="w-6 h-6 text-accent-foreground" />
              <div>
                <div className="text-xl font-bold">
                  {backendStatus === 'connected' ? 'Ready' : 'Offline'}
                </div>
                <div className="text-sm text-muted-foreground">AI Status</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upload and Ask */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PDFUpload
              uploadedFiles={uploadedFiles}
              selectedFileIndex={selectedFileIndex}
              onFilesUpload={handleFilesUpload}
              onSelectFile={setSelectedFileIndex}
              onFileRemove={handleFileRemove}
              onRemoveAll={handleRemoveAllFiles}
              isUploading={isUploading}
            />

            <QuestionInput
              onAskQuestion={handleAskQuestion}
              isLoading={isAsking}
              disabled={selectedFileIndex === null || backendStatus !== 'connected'}
            />
          </div>

          <div>
            <AnswerDisplay
              qaHistory={qaHistory}
              isLoading={isAsking}
              currentQuestion={currentQuestion}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
