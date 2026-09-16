import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface TempFile {
  name: string;
  type: string;
  base64: string;
  preview?: string;
}

interface TemporaryUploadProps {
  language: 'ar' | 'en';
  onFilesChange: (files: TempFile[]) => void;
  tempFiles: TempFile[];
  maxFiles?: number;
}

const TemporaryUpload: React.FC<TemporaryUploadProps> = ({
  language,
  onFilesChange,
  tempFiles,
  maxFiles = 3
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (tempFiles.length + files.length > maxFiles) {
      toast.error(t(
        `يمكنك رفع ${maxFiles} ملفات كحد أقصى`,
        `You can upload maximum ${maxFiles} files`
      ));
      return;
    }

    setIsProcessing(true);

    try {
      const newFiles: TempFile[] = [];

      for (const file of Array.from(files)) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(t(
            `الملف ${file.name} كبير جداً (الحد الأقصى 10 ميجا)`,
            `File ${file.name} is too large (max 10MB)`
          ));
          continue;
        }

        const base64 = await fileToBase64(file);
        const preview = file.type.startsWith('image/') 
          ? URL.createObjectURL(file)
          : undefined;

        newFiles.push({
          name: file.name,
          type: file.type,
          base64,
          preview
        });
      }

      onFilesChange([...tempFiles, ...newFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error(t('حدث خطأ في معالجة الملفات', 'Error processing files'));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeFile = (index: number) => {
    const file = tempFiles[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onFilesChange(tempFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing || tempFiles.length >= maxFiles}
        className="gap-2"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {t('رفع ملف مؤقت', 'Upload Temp File')}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Temp Files Preview */}
      {tempFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tempFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt=""
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                getFileIcon(file.type)
              )}
              <span className="max-w-[100px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-muted-foreground">
        {t(
          'الملفات المؤقتة لا تُحفظ وتُستخدم فقط في هذه المحادثة',
          'Temporary files are not saved and only used in this conversation'
        )}
      </p>
    </div>
  );
};

export default TemporaryUpload;
