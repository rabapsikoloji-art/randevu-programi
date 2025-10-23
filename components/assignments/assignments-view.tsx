
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  Upload, 
  Download,
  Trash2,
  BookOpen,
  Video,
  Headphones,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  clientFeedback: string | null;
  attachments: Array<{ name: string; path: string }>;
  submissions: Array<{ name: string; path: string }>;
  client: {
    firstName: string;
    lastName: string;
  };
  personnel: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

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

export function AssignmentsView() {
  const { data: session } = useSession() || {};
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    type: "READING" as string,
    dueDate: "",
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsRes, clientsRes] = await Promise.all([
        fetch("/api/assignments/all"),
        fetch("/api/clients"),
      ]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.title || !formData.description) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    setUploading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("clientId", formData.clientId);
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description);
      submitFormData.append("type", formData.type);
      if (formData.dueDate) {
        submitFormData.append("dueDate", formData.dueDate);
      }

      files.forEach((file) => {
        submitFormData.append("files", file);
      });

      const response = await fetch("/api/assignments/create", {
        method: "POST",
        body: submitFormData,
      });

      if (!response.ok) throw new Error("Ödev oluşturulamadı");

      const newAssignment = await response.json();
      setAssignments((prev) => [newAssignment, ...prev]);
      setDialogOpen(false);
      setFormData({
        clientId: "",
        title: "",
        description: "",
        type: "READING",
        dueDate: "",
      });
      setFiles([]);
      toast.success("Ödev başarıyla oluşturuldu");
    } catch (error) {
      console.error("Create assignment error:", error);
      toast.error("Ödev oluşturulurken bir hata oluştu");
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDetailDialogOpen(true);
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
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
  const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ödev Yönetimi</h1>
          <p className="text-gray-600 mt-1">
            Danışanlara ödev oluşturun ve takip edin
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ödev Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Ödev Oluştur</DialogTitle>
              <DialogDescription>
                Danışanınız için bir ödev oluşturun ve dosya ekleyin
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="client">Danışan *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Danışan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.firstName} {client.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Ödev Başlığı *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Örn: Haftalık Duygu Günlüğü"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Ödev Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Açıklama *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ödev detaylarını yazın..."
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Son Tarih</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="files">Dosyalar (Video, Resim, PDF vb.)</Label>
                <Input
                  id="files"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                {files.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    {files.length} dosya seçildi
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {uploading ? "Oluşturuluyor..." : "Ödevi Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
              Aktif Ödevler
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
              {assignments.filter(a => a.status === 'OVERDUE').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ödevler</CardTitle>
          <CardDescription>Danışanlara verilen tüm ödevler</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ödev</TableHead>
                <TableHead>Danışan</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Son Tarih</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Henüz ödev bulunmuyor</p>
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignment.title}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {assignment.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.client.firstName} {assignment.client.lastName}
                    </TableCell>
                    <TableCell>{typeLabels[assignment.type]}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[assignment.status]}>
                        {statusLabels[assignment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.dueDate
                        ? format(new Date(assignment.dueDate), "dd MMM yyyy", {
                            locale: tr,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(assignment)}
                      >
                        Detaylar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      {selectedAssignment && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedAssignment.title}</DialogTitle>
              <DialogDescription>
                {selectedAssignment.client.firstName}{" "}
                {selectedAssignment.client.lastName} için ödev
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedAssignment.status]}>
                  {statusLabels[selectedAssignment.status]}
                </Badge>
                <Badge variant="outline">
                  {typeLabels[selectedAssignment.type]}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Açıklama</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {selectedAssignment.description}
                </p>
              </div>

              {selectedAssignment.dueDate && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Son Tarih</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {format(
                      new Date(selectedAssignment.dueDate),
                      "dd MMMM yyyy",
                      { locale: tr }
                    )}
                  </p>
                </div>
              )}

              {selectedAssignment.attachments &&
                selectedAssignment.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Eklediğiniz Dosyalar
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

              {selectedAssignment.submissions &&
                selectedAssignment.submissions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Danışan Dosyaları
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

              {selectedAssignment.clientFeedback && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Danışan Geribildirimi
                  </h4>
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedAssignment.clientFeedback}
                    </p>
                  </div>
                </div>
              )}

              {selectedAssignment.completedAt && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Tamamlanma Tarihi
                  </h4>
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {format(
                      new Date(selectedAssignment.completedAt),
                      "dd MMMM yyyy HH:mm",
                      { locale: tr }
                    )}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
