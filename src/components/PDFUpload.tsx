import { useState, useCallback } from 'react';
import { Upload, File, AlertCircle, CheckCircle2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PDFUploadProps {
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  isUploading: boolean;
  uploadedFile: File | null;
}

export const PDFUpload = ({ onFileUpload, onFileRemove, isUploading, uploadedFile }: PDFUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileUpload(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
      }
    }
  }, [onFileUpload, toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileUpload(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
      }
    }
  }, [onFileUpload, toast]);

  return (
    <Card className="p-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Upload PDF Document
          </h3>
          <p className="text-muted-foreground">
            Upload a PDF document to start asking questions about its content
          </p>
        </div>

        {uploadedFile ? (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <File className="w-5 h-5" />
                <span className="font-medium">{uploadedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={onFileRemove}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Remove file"
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-success/80 mt-1">
              Ready for questions! Upload a new PDF to replace.
            </p>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-primary/2'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <File className={`w-12 h-12 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>

              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  Drag and drop your PDF here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>

              <Button 
                variant="outline" 
                disabled={isUploading}
                onClick={() => document.getElementById('pdf-upload')?.click()}
                className="mt-4"
              >
                {isUploading ? 'Processing...' : 'Choose PDF File'}
              </Button>
            </div>
          </div>
        )}

        <input
          id="pdf-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        {!uploadedFile && (
          <div className="bg-accent/50 border border-accent rounded-lg p-4">
            <div className="flex items-start space-x-2 text-accent-foreground">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Supported format:</p>
                <p>PDF files only. Maximum size: 10MB</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
