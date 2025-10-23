
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/lib/export-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Service {
  id: string;
  name: string;
  serviceType: string;
  price: number;
}

interface PackageService {
  serviceId: string;
  sessions: number;
}

interface PackageData {
  id?: string;
  name: string;
  description: string;
  totalSessions: number;
  totalPrice: number;
  discountPercent: number;
  validityDays: number;
  isActive: boolean;
  services: PackageService[];
}

export function PackagesView() {
  const [packages, setPackages] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [deletePackageId, setDeletePackageId] = useState<string | null>(null);

  const emptyPackage: PackageData = {
    name: "",
    description: "",
    totalSessions: 0,
    totalPrice: 0,
    discountPercent: 0,
    validityDays: 30,
    isActive: true,
    services: [],
  };

  useEffect(() => {
    fetchPackages();
    fetchServices();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/packages");
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      toast.error("Paketler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data.filter((s: Service) => s));
      }
    } catch (error) {
      console.error("Hizmetler yüklenirken hata:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedPackage) return;

    if (!selectedPackage.name || selectedPackage.totalSessions <= 0 || selectedPackage.totalPrice <= 0) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }

    if (selectedPackage.services.length === 0) {
      toast.error("Lütfen en az bir hizmet seçin");
      return;
    }

    try {
      const url = selectedPackage.id ? `/api/packages/${selectedPackage.id}` : "/api/packages";
      const method = selectedPackage.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedPackage),
      });

      if (response.ok) {
        toast.success(selectedPackage.id ? "Paket güncellendi" : "Paket oluşturuldu");
        setIsDialogOpen(false);
        fetchPackages();
      } else {
        const error = await response.json();
        toast.error(error.error || "Bir hata oluştu");
      }
    } catch (error) {
      toast.error("Paket kaydedilirken hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deletePackageId) return;

    try {
      const response = await fetch(`/api/packages/${deletePackageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Paket silindi");
        setIsDeleteDialogOpen(false);
        setDeletePackageId(null);
        fetchPackages();
      } else {
        toast.error("Paket silinirken hata oluştu");
      }
    } catch (error) {
      toast.error("Paket silinirken hata oluştu");
    }
  };

  const openCreateDialog = () => {
    setSelectedPackage(emptyPackage);
    setIsDialogOpen(true);
  };

  const openEditDialog = (pkg: any) => {
    setSelectedPackage({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || "",
      totalSessions: pkg.totalSessions,
      totalPrice: pkg.totalPrice,
      discountPercent: pkg.discountPercent || 0,
      validityDays: pkg.validityDays,
      isActive: pkg.isActive,
      services: pkg.packageServices?.map((ps: any) => ({
        serviceId: ps.serviceId,
        sessions: ps.sessions,
      })) || [],
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletePackageId(id);
    setIsDeleteDialogOpen(true);
  };

  const toggleServiceInPackage = (serviceId: string) => {
    if (!selectedPackage) return;

    const existingService = selectedPackage.services.find(s => s.serviceId === serviceId);
    
    if (existingService) {
      setSelectedPackage({
        ...selectedPackage,
        services: selectedPackage.services.filter(s => s.serviceId !== serviceId),
      });
    } else {
      setSelectedPackage({
        ...selectedPackage,
        services: [...selectedPackage.services, { serviceId, sessions: 1 }],
      });
    }
  };

  const updateServiceSessions = (serviceId: string, sessions: number) => {
    if (!selectedPackage) return;

    setSelectedPackage({
      ...selectedPackage,
      services: selectedPackage.services.map(s =>
        s.serviceId === serviceId ? { ...s, sessions } : s
      ),
    });
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredPackages.map(pkg => ({
      PaketAdi: pkg.name,
      Aciklama: pkg.description || "",
      SeansSayisi: pkg.totalSessions,
      Fiyat: pkg.totalPrice,
      IndirimOrani: pkg.discountPercent || 0,
      GecerlilikGun: pkg.validityDays,
      Durum: pkg.isActive ? "Aktif" : "Pasif",
      HizmetSayisi: pkg.packageServices?.length || 0
    }));
    
    exportToCSV(exportData, "paketler");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paketler</h1>
          <p className="text-gray-500 mt-1">Hizmet paketlerini yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={filteredPackages.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button onClick={openCreateDialog} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Paket
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Paket ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>Henüz paket bulunmuyor</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paket Adı</TableHead>
                  <TableHead>Seans Sayısı</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>İndirim</TableHead>
                  <TableHead>Geçerlilik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{pkg.totalSessions} seans</TableCell>
                    <TableCell>₺{pkg.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      {pkg.discountPercent ? `%${pkg.discountPercent}` : "-"}
                    </TableCell>
                    <TableCell>{pkg.validityDays} gün</TableCell>
                    <TableCell>
                      <Badge variant={pkg.isActive ? "default" : "secondary"}>
                        {pkg.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(pkg.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPackage?.id ? "Paket Düzenle" : "Yeni Paket"}
            </DialogTitle>
            <DialogDescription>
              Paket bilgilerini doldurun
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Paket Adı *</Label>
                  <Input
                    id="name"
                    value={selectedPackage.name}
                    onChange={(e) =>
                      setSelectedPackage({ ...selectedPackage, name: e.target.value })
                    }
                    placeholder="Örn: 10 Seans Paketi"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Textarea
                    id="description"
                    value={selectedPackage.description}
                    onChange={(e) =>
                      setSelectedPackage({ ...selectedPackage, description: e.target.value })
                    }
                    placeholder="Paket açıklaması..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="totalSessions">Toplam Seans *</Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    min="1"
                    value={selectedPackage.totalSessions}
                    onChange={(e) =>
                      setSelectedPackage({
                        ...selectedPackage,
                        totalSessions: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="totalPrice">Toplam Fiyat (₺) *</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={selectedPackage.totalPrice}
                    onChange={(e) =>
                      setSelectedPackage({
                        ...selectedPackage,
                        totalPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="discountPercent">İndirim Oranı (%)</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedPackage.discountPercent}
                    onChange={(e) =>
                      setSelectedPackage({
                        ...selectedPackage,
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="validityDays">Geçerlilik (Gün) *</Label>
                  <Input
                    id="validityDays"
                    type="number"
                    min="1"
                    value={selectedPackage.validityDays}
                    onChange={(e) =>
                      setSelectedPackage({
                        ...selectedPackage,
                        validityDays: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={selectedPackage.isActive}
                      onCheckedChange={(checked) =>
                        setSelectedPackage({ ...selectedPackage, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">Aktif</Label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">
                  Paket Hizmetleri *
                </Label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {services.map((service) => {
                    const isSelected = selectedPackage.services.some(
                      (s) => s.serviceId === service.id
                    );
                    const packageService = selectedPackage.services.find(
                      (s) => s.serviceId === service.id
                    );

                    return (
                      <div
                        key={service.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleServiceInPackage(service.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">₺{service.price}</p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Seans:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={packageService?.sessions || 1}
                              onChange={(e) =>
                                updateServiceSessions(
                                  service.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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
            <AlertDialogTitle>Paketi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu paketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
    </div>
  );
}
