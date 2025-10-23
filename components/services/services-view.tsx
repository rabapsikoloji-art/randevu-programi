
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Plus, 
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  serviceType: string;
  createdAt: string;
}

interface ServiceData {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  serviceType: string;
}

interface ServicesViewProps {
  userRole: string;
}

const serviceTypeLabels: Record<string, string> = {
  INDIVIDUAL_THERAPY: "Bireysel Terapi",
  COUPLES_THERAPY: "Çift Terapisi",
  FAMILY_THERAPY: "Aile Terapisi",
  CHILD_ADOLESCENT_THERAPY: "Çocuk/Ergen Terapisi",
  ONLINE_THERAPY: "Online Terapi",
  GROUP_THERAPY: "Grup Terapisi"
};

const serviceTypeColors: Record<string, string> = {
  INDIVIDUAL_THERAPY: "bg-blue-100 text-blue-700",
  COUPLES_THERAPY: "bg-pink-100 text-pink-700",
  FAMILY_THERAPY: "bg-green-100 text-green-700",
  CHILD_ADOLESCENT_THERAPY: "bg-purple-100 text-purple-700",
  ONLINE_THERAPY: "bg-orange-100 text-orange-700",
  GROUP_THERAPY: "bg-indigo-100 text-indigo-700"
};

export function ServicesView({ userRole }: ServicesViewProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const emptyService: ServiceData = {
    name: "",
    description: "",
    duration: 50,
    price: 0,
    serviceType: "INDIVIDUAL_THERAPY"
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = services.map(s => ({
      HizmetAdi: s.name,
      Aciklama: s.description || "",
      Tip: serviceTypeLabels[s.serviceType] || s.serviceType,
      Sure: s.duration,
      Fiyat: s.price,
      OlusturmaTarihi: new Date(s.createdAt).toLocaleDateString('tr-TR')
    }));
    
    exportToCSV(exportData, "hizmetler");
  };

  const openCreateDialog = () => {
    setSelectedService(emptyService);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setSelectedService({
      id: service.id,
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price,
      serviceType: service.serviceType
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteServiceId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedService) return;

    if (!selectedService.name || selectedService.price <= 0 || selectedService.duration <= 0) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }

    try {
      const url = selectedService.id ? `/api/services/${selectedService.id}` : "/api/services";
      const method = selectedService.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedService),
      });

      if (response.ok) {
        toast.success(selectedService.id ? "Hizmet güncellendi" : "Hizmet oluşturuldu");
        setIsDialogOpen(false);
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || "Bir hata oluştu");
      }
    } catch (error) {
      toast.error("Hizmet kaydedilirken hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteServiceId) return;

    try {
      const response = await fetch(`/api/services/${deleteServiceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Hizmet silindi");
        setIsDeleteDialogOpen(false);
        setDeleteServiceId(null);
        fetchServices();
      } else {
        const error = await response.json();
        toast.error(error.error || "Hizmet silinirken hata oluştu");
      }
    } catch (error) {
      toast.error("Hizmet silinirken hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Settings className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Hizmet Listesi
              </h2>
              <p className="text-gray-600">
                {services?.length || 0} aktif hizmet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={services.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>

            <Button 
              className="bg-teal-600 hover:bg-teal-700"
              onClick={openCreateDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Hizmet
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        {services?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">Henüz hizmet bulunmuyor</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services?.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg text-gray-900">
                        {service.name}
                      </CardTitle>
                      <Badge className={serviceTypeColors[service.serviceType] || "bg-gray-100 text-gray-700"}>
                        {serviceTypeLabels[service.serviceType] || service.serviceType}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => openDeleteDialog(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {service.duration} dk
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-semibold text-green-600">
                        {service.price?.toLocaleString('tr-TR')}₺
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Oluşturulma: {service.createdAt ? new Date(service.createdAt).toLocaleDateString('tr-TR') : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedService?.id ? "Hizmet Düzenle" : "Yeni Hizmet"}
            </DialogTitle>
            <DialogDescription>
              Hizmet bilgilerini doldurun
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Hizmet Adı *</Label>
                <Input
                  id="name"
                  value={selectedService.name}
                  onChange={(e) =>
                    setSelectedService({ ...selectedService, name: e.target.value })
                  }
                  placeholder="Örn: Bireysel Terapi"
                />
              </div>

              <div>
                <Label htmlFor="serviceType">Hizmet Tipi *</Label>
                <Select
                  value={selectedService.serviceType}
                  onValueChange={(value) =>
                    setSelectedService({ ...selectedService, serviceType: value })
                  }
                >
                  <SelectTrigger id="serviceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={selectedService.description}
                  onChange={(e) =>
                    setSelectedService({ ...selectedService, description: e.target.value })
                  }
                  placeholder="Hizmet açıklaması..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Süre (dakika) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={selectedService.duration}
                    onChange={(e) =>
                      setSelectedService({
                        ...selectedService,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="price">Fiyat (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedService.price}
                    onChange={(e) =>
                      setSelectedService({
                        ...selectedService,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
