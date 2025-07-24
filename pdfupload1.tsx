import { useState, useCallback, useRef } from 'react';
import { Upload, File, CheckCircle2, Trash, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PDFUploadProps {
  onFilesUpload: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onRemoveAll: () => void; // use this name consistently
  isUploading: boolean;
  uploadedFiles: File[];
  selectedFileIndex: number | null;
  onSelectFile: (index: number) => void;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  uploadedFiles,
  selectedFileIndex,
  onFilesUpload,
  onFileRemove,
  onRemoveAll,
  isUploading,
  onSelectFile,
}) => {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const allowedExtensions = ['.txt', '.pdf', '.docx', '.md'];

      function isAllowedFile(file: File) {
            return allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}


      const files = Array.from(e.dataTransfer.files).filter(isAllowedFile);
  
      if (files.length === 0) {
       toast.toast({
           title: 'Invalid file type',
           description: 'Please upload only .txt, .pdf, .docx, or .md files.',
           variant: 'destructive',
        });
        return;
      }

      onFilesUpload(files);
    },
    [onFilesUpload, toast]
  );

  const handleFileInput = useCallback(

    
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const allowedExtensions = ['.txt', '.pdf', '.docx', '.md'];

function isAllowedFile(file: File) {
  return allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

      if (e.target.files) {
      const files = Array.from(e.target.files).filter(isAllowedFile);

        if (files.length === 0) {
          toast.toast({
            title: 'Invalid file type',
            description: 'Please upload only .txt, .pdf, .docx, or .md files.',
            variant: 'destructive',
          });
          return;
        }

        onFilesUpload(files);
      }
    },
    [onFilesUpload, toast]
  );

  // Clear all files and reset file input value
  const handleRemoveAllClick = () => {
    onRemoveAll();
    if (fileInput.current) {
      fileInput.current.value = '';
    }
  };

  return (
    <Card className="p-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Upload  Documents</h3>
        <p className="text-muted-foreground text-sm">
          Upload one or more Documents. Click a file below to ask questions about it.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200 ${
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/2'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
      >
        <div className="text-center space-y-2">
          <File className={`w-12 h-12 mx-auto ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="font-medium">Drag and drop files here</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <Button variant="outline" disabled={isUploading} className="mt-2">
            {isUploading ? 'Processing...' : 'Choose a File'}
          </Button>
        </div>
      </div>

      <input
        id="pdf-upload"
        type="file"
        accept=".txt, .pdf, .docx, .md"
        multiple
        className="hidden"
        onChange={handleFileInput}
        ref={fileInput}
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex items-center justify-between border rounded-md p-3 cursor-pointer ${
                selectedFileIndex === index ? 'bg-green-50 border-green-400' : 'bg-muted/5'
              }`}
              onClick={() => onSelectFile(index)}
            >
              <div className="flex items-center gap-2">
                <File className="text-primary w-5 h-5" />
                <span className="font-medium">{file.name}</span>
                {selectedFileIndex === index && (
                  <span className="text-sm text-green-600 ml-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready for questions
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove(index);
                }}
                title="Remove file"
              >
                <Trash className="w-4 h-4 text-red-500 hover:text-red-700" />
              </button>
            </div>
          ))}

          {/* Remove All Button */}
          <div className="text-right">
            <Button
              variant="ghost"
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
              onClick={handleRemoveAllClick}
            >
              <XCircle className="w-4 h-4" />
              Remove All Files
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
