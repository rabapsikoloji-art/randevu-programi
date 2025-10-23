
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BookOpen,
  FileText,
  Video,
  Headphones,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  notes: string | null;
  clientFeedback: string | null;
  attachments: Array<{ name: string; path: string }> | null;
  submissions: Array<{ name: string; path: string }> | null;
  personnel: {
    firstName: string;
    lastName: string;
  };
}

const typeIcons: Record<string, any> = {
  BOOK: BookOpen,
  READING: FileText,
  WRITING: FileText,
  EXERCISE: CheckCircle2,
  VIDEO: Video,
  AUDIO: Headphones,
  OTHER: FileText,
};

const typeLabels: Record<string, string> = {
  BOOK: "Kitap",
  READING: "Okuma",
  WRITING: "Yazma",
  EXERCISE: "Egzersiz",
  VIDEO: "Video",
  AUDIO: "Ses Kaydı",
  OTHER: "Diğer",
};

const statusLabels: Record<string, string> = {
  PENDING: "Bekliyor",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  OVERDUE: "Gecikmiş",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
};

export function ClientAssignments() {
  const { data: session } = useSession() || {};
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [notes, setNotes] = useState("");
  const [clientFeedback, setClientFeedback] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (!response.ok) throw new Error("Ödevler yüklenemedi");

      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error("Load assignments error:", error);
      toast.error("Ödevler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setNotes(assignment.notes || "");
    setClientFeedback(assignment.clientFeedback || "");
    setFiles([]);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedAssignment) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("notes", notes);
      formData.append("clientFeedback", clientFeedback);
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/assignments/${selectedAssignment.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) throw new Error("Güncelleme başarısız");

      const updated = await response.json();
      setAssignments(prev =>
        prev.map(a => (a.id === updated.id ? updated : a))
      );
      setSelectedAssignment(null);
      toast.success("Ödev durumu güncellendi");
    } catch (error) {
      console.error("Update assignment error:", error);
      toast.error("Güncelleme sırasında bir hata oluştu");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedAssignment) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("notes", notes);
      formData.append("clientFeedback", clientFeedback);
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`/api/assignments/${selectedAssignment.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) throw new Error("Kaydetme başarısız");

      const updated = await response.json();
      setAssignments(prev =>
        prev.map(a => (a.id === updated.id ? updated : a))
      );
      setSelectedAssignment(updated);
      setFiles([]);
      toast.success("İlerlemeniz kaydedildi");
    } catch (error) {
      console.error("Save progress error:", error);
      toast.error("Kaydetme sırasında bir hata oluştu");
    } finally {
      setUploading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handleDownloadFile = async (path: string, fileName: string) => {
    try {
      const response = await fetch(`/api/assignments/download?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error("Download failed");
      
      const signedUrl = await response.text();
      const link = document.createElement("a");
      link.href = signedUrl;
      link.target = "_blank";
      link.click();
      
      toast.success("Dosya indiriliyor");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Dosya indirilemedi");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ödevler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');
  const overdueAssignments = assignments.filter(a => a.status === 'OVERDUE');

  return (
    <>
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Ödev
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-600">
                Bekleyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">
                {pendingAssignments.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">
                Tamamlanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {completedAssignments.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">
                Gecikmiş
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {overdueAssignments.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Assignments */}
        {overdueAssignments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Gecikmiş Ödevler
            </h3>
            <div className="grid gap-4">
              {overdueAssignments.map(assignment => {
                const Icon = typeIcons[assignment.type] || FileText;
                return (
                  <Card
                    key={assignment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-red-200"
                    onClick={() => handleOpenAssignment(assignment)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Icon className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {assignment.title}
                            </CardTitle>
                            <CardDescription>
                              {assignment.personnel.firstName}{" "}
                              {assignment.personnel.lastName}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={statusColors[assignment.status]}>
                          {statusLabels[assignment.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.description}
                      </p>
                      {assignment.dueDate && (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Son tarih:{" "}
                          {format(new Date(assignment.dueDate), "dd MMMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending & In Progress Assignments */}
        {pendingAssignments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Aktif Ödevler
            </h3>
            <div className="grid gap-4">
              {pendingAssignments.map(assignment => {
                const Icon = typeIcons[assignment.type] || FileText;
                return (
                  <Card
                    key={assignment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleOpenAssignment(assignment)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-100 rounded-lg">
                            <Icon className="h-5 w-5 text-teal-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {assignment.title}
                            </CardTitle>
                            <CardDescription>
                              {assignment.personnel.firstName}{" "}
                              {assignment.personnel.lastName}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={statusColors[assignment.status]}>
                          {statusLabels[assignment.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.description}
                      </p>
                      {assignment.dueDate && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Son tarih:{" "}
                          {format(new Date(assignment.dueDate), "dd MMMM yyyy", {
                            locale: tr,
                          })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Assignments */}
        {completedAssignments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Tamamlanan Ödevler
            </h3>
            <div className="grid gap-4">
              {completedAssignments.map(assignment => {
                const Icon = typeIcons[assignment.type] || FileText;
                return (
                  <Card
                    key={assignment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                    onClick={() => handleOpenAssignment(assignment)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {assignment.title}
                            </CardTitle>
                            <CardDescription>
                              {assignment.personnel.firstName}{" "}
                              {assignment.personnel.lastName}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={statusColors[assignment.status]}>
                          {statusLabels[assignment.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {assignment.description}
                      </p>
                      {assignment.completedAt && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          {format(new Date(assignment.completedAt), "dd MMMM yyyy", {
                            locale: tr,
                          })}{" "}
                          tarihinde tamamlandı
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {assignments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Henüz ödev bulunmuyor</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assignment Detail Dialog */}
      {selectedAssignment && (
        <Dialog
          open={!!selectedAssignment}
          onOpenChange={() => setSelectedAssignment(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = typeIcons[selectedAssignment.type] || FileText;
                  return (
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Icon className="h-6 w-6 text-teal-600" />
                    </div>
                  );
                })()}
                <div>
                  <DialogTitle>{selectedAssignment.title}</DialogTitle>
                  <DialogDescription>
                    {typeLabels[selectedAssignment.type]} •{" "}
                    {selectedAssignment.personnel.firstName}{" "}
                    {selectedAssignment.personnel.lastName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Badge className={statusColors[selectedAssignment.status]}>
                  {statusLabels[selectedAssignment.status]}
                </Badge>
              </div>

              {selectedAssignment.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Son Tarih:{" "}
                    {format(new Date(selectedAssignment.dueDate), "dd MMMM yyyy", {
                      locale: tr,
                    })}
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Açıklama</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedAssignment.description}
                </p>
              </div>

              {selectedAssignment.attachments &&
                selectedAssignment.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Psikoloğun Eklediği Dosyalar
                    </h4>
                    <div className="space-y-2">
                      {selectedAssignment.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {file.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file.path, file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Notlarınız
                </h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ödev hakkında notlarınızı buraya yazabilirsiniz..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Geribildiriminiz
                </h4>
                <Textarea
                  value={clientFeedback}
                  onChange={(e) => setClientFeedback(e.target.value)}
                  placeholder="Ödevi nasıl yaptığınız, ne öğrendiğiniz hakkında detaylı geribildirim yazın..."
                  rows={5}
                  className="resize-none"
                />
              </div>

              {selectedAssignment.submissions &&
                selectedAssignment.submissions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Yüklediğiniz Dosyalar
                    </h4>
                    <div className="space-y-2">
                      {selectedAssignment.submissions.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-teal-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-teal-600" />
                            <span className="text-sm text-gray-700">
                              {file.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(file.path, file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <Label htmlFor="files">Dosya Yükle (Görseller, Videolar, Belgeler)</Label>
                <Input
                  id="files"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  className="mt-2"
                />
                {files.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {files.length} dosya seçildi
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleSaveProgress} 
                  disabled={uploading}
                >
                  {uploading ? "Kaydediliyor..." : "İlerlemeyi Kaydet"}
                </Button>
                {selectedAssignment.status !== 'COMPLETED' && (
                  <>
                    {selectedAssignment.status === 'PENDING' && (
                      <Button
                        onClick={() => handleUpdateStatus('IN_PROGRESS')}
                        disabled={uploading}
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        Başladım
                      </Button>
                    )}
                    <Button
                      onClick={() => handleUpdateStatus('COMPLETED')}
                      disabled={uploading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {uploading ? "Gönderiliyor..." : "Tamamlandı Olarak İşaretle"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
