
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, XCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  templateFields: string[];
  onImport: (file: File) => Promise<{ success: boolean; imported: number; failed: number; errors: string[] }>;
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateFields,
  onImport,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Lütfen CSV dosyası seçin');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    setImporting(true);
    try {
      const importResult = await onImport(file);
      setResult(importResult);
      
      if (importResult.success && importResult.failed === 0) {
        toast.success(`${importResult.imported} kayıt başarıyla içe aktarıldı`);
      } else if (importResult.imported > 0) {
        toast.warning(
          `${importResult.imported} kayıt içe aktarıldı, ${importResult.failed} kayıt başarısız`
        );
      } else {
        toast.error('İçe aktarma başarısız');
      }
    } catch (error: any) {
      toast.error(error.message || 'İçe aktarma sırasında bir hata oluştu');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = templateFields.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'import_template.csv';
    link.click();
    toast.success('Şablon dosyası indirildi');
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  CSV Şablonu İndirin
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Doğru formatta içe aktarma yapmak için önce şablon dosyasını indirin ve
                  doldurun.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Şablon İndir
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                {file ? file.name : 'CSV dosyası seçin'}
              </p>
              <p className="text-xs text-gray-500">
                veya dosyayı buraya sürükleyin
              </p>
            </label>
          </div>

          {/* Import Result */}
          {result && (
            <div
              className={`border rounded-lg p-4 ${
                result.success && result.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : result.imported > 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success && result.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900 mb-2">
                    İçe Aktarma Sonucu
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-green-700">
                      ✓ Başarılı: {result.imported} kayıt
                    </p>
                    {result.failed > 0 && (
                      <p className="text-red-700">✗ Başarısız: {result.failed} kayıt</p>
                    )}
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-gray-700 mb-1">Hatalar:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {result.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              {result ? 'Kapat' : 'İptal'}
            </Button>
            {!result && (
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {importing ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
