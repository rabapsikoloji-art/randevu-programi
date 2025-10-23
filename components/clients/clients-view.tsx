
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, Search, Eye, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/lib/export-utils";
import { ImportDialog } from "@/components/import-dialog";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ClientData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  emergencyContact: string;
  emergencyPhone: string;
  isActive: boolean;
  kvkk_consent: boolean;
}

export function ClientsView() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [viewClient, setViewClient] = useState<any | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  const emptyClient: ClientData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    emergencyContact: "",
    emergencyPhone: "",
    isActive: true,
    kvkk_consent: false,
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      toast.error("Danışanlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedClient) return;

    if (!selectedClient.firstName || !selectedClient.lastName || !selectedClient.email) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }

    try {
      const url = selectedClient.id ? `/api/clients/${selectedClient.id}` : "/api/clients";
      const method = selectedClient.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedClient),
      });

      if (response.ok) {
        toast.success(selectedClient.id ? "Danışan güncellendi" : "Danışan oluşturuldu");
        setIsDialogOpen(false);
        fetchClients();
      } else {
        const error = await response.json();
        toast.error(error.error || "Bir hata oluştu");
      }
    } catch (error) {
      toast.error("Danışan kaydedilirken hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteClientId) return;

    try {
      const response = await fetch(`/api/clients/${deleteClientId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Danışan silindi");
        setIsDeleteDialogOpen(false);
        setDeleteClientId(null);
        fetchClients();
      } else {
        const error = await response.json();
        toast.error(error.error || "Danışan silinirken hata oluştu");
      }
    } catch (error) {
      toast.error("Danışan silinirken hata oluştu");
    }
  };

  const openCreateDialog = () => {
    setSelectedClient(emptyClient);
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: any) => {
    setSelectedClient({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.user?.email || "",
      phone: client.phone || "",
      dateOfBirth: client.dateOfBirth ? format(new Date(client.dateOfBirth), "yyyy-MM-dd") : "",
      emergencyContact: client.emergencyContact || "",
      emergencyPhone: client.emergencyPhone || "",
      isActive: client.isActive,
      kvkk_consent: client.kvkk_consent,
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setViewClient(data);
        setIsViewDialogOpen(true);
      }
    } catch (error) {
      toast.error("Danışan bilgileri yüklenirken hata oluştu");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteClientId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredClients = clients.filter(client =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredClients.map(client => ({
      AdSoyad: `${client.firstName} ${client.lastName}`,
      Eposta: client.user?.email || "",
      Telefon: client.phone || "",
      DogumTarihi: client.dateOfBirth ? format(new Date(client.dateOfBirth), "dd/MM/yyyy") : "",
      AcilDurumKisi: client.emergencyContact || "",
      AcilDurumTelefon: client.emergencyPhone || "",
      Durum: client.isActive ? "Aktif" : "Pasif",
      KVKKOnay: client.kvkk_consent ? "Evet" : "Hayır",
      KayitTarihi: format(new Date(client.createdAt), "dd/MM/yyyy", { locale: tr })
    }));
    
    exportToCSV(exportData, "danisanlar");
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/clients/import", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "İçe aktarma başarısız");
    }

    const result = await response.json();
    
    // Reload clients
    await fetchClients();
    
    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danışanlar</h1>
          <p className="text-gray-500 mt-1">Danışan kayıtlarını yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={filteredClients.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button onClick={openCreateDialog} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Danışan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Danışan ara..."
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
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>Henüz danışan bulunmuyor</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.firstName} {client.lastName}
                    </TableCell>
                    <TableCell>{client.user?.email || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(client.createdAt), "dd MMM yyyy", { locale: tr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.isActive ? "default" : "secondary"}>
                        {client.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(client.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(client.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedClient?.id ? "Danışan Düzenle" : "Yeni Danışan"}
            </DialogTitle>
            <DialogDescription>
              Danışan bilgilerini doldurun
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ad *</Label>
                  <Input
                    id="firstName"
                    value={selectedClient.firstName}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, firstName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Soyad *</Label>
                  <Input
                    id="lastName"
                    value={selectedClient.lastName}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, lastName: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedClient.email}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, email: e.target.value })
                    }
                    disabled={!!selectedClient.id}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={selectedClient.phone}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Doğum Tarihi</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={selectedClient.dateOfBirth}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, dateOfBirth: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Acil Durum Kişisi</Label>
                  <Input
                    id="emergencyContact"
                    value={selectedClient.emergencyContact}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, emergencyContact: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Acil Durum Telefon</Label>
                  <Input
                    id="emergencyPhone"
                    value={selectedClient.emergencyPhone}
                    onChange={(e) =>
                      setSelectedClient({ ...selectedClient, emergencyPhone: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="kvkk_consent"
                      checked={selectedClient.kvkk_consent}
                      onCheckedChange={(checked) =>
                        setSelectedClient({ ...selectedClient, kvkk_consent: checked })
                      }
                    />
                    <Label htmlFor="kvkk_consent">KVKK Onayı</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={selectedClient.isActive}
                      onCheckedChange={(checked) =>
                        setSelectedClient({ ...selectedClient, isActive: checked })
                      }
                    />
                    <Label htmlFor="isActive">Aktif</Label>
                  </div>
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

      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewClient?.firstName} {viewClient?.lastName}
            </DialogTitle>
            <DialogDescription>Danışan detay bilgileri</DialogDescription>
          </DialogHeader>

          {viewClient && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Bilgiler</TabsTrigger>
                <TabsTrigger value="appointments">Randevular</TabsTrigger>
                <TabsTrigger value="payments">Ödemeler</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="font-medium">{viewClient.user?.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{viewClient.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doğum Tarihi</p>
                    <p className="font-medium">
                      {viewClient.dateOfBirth
                        ? format(new Date(viewClient.dateOfBirth), "dd MMMM yyyy", { locale: tr })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kayıt Tarihi</p>
                    <p className="font-medium">
                      {format(new Date(viewClient.createdAt), "dd MMMM yyyy", { locale: tr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Acil Durum Kişisi</p>
                    <p className="font-medium">{viewClient.emergencyContact || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Acil Durum Telefon</p>
                    <p className="font-medium">{viewClient.emergencyPhone || "-"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appointments">
                {viewClient.appointments && viewClient.appointments.length > 0 ? (
                  <div className="space-y-3">
                    {viewClient.appointments.map((apt: any) => (
                      <Card key={apt.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{apt.service?.name}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(apt.appointmentDate), "dd MMM yyyy HH:mm", {
                                  locale: tr,
                                })}
                              </p>
                              <p className="text-sm text-gray-500">
                                Psikolog: {apt.personnel?.firstName} {apt.personnel?.lastName}
                              </p>
                            </div>
                            <Badge>{apt.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Henüz randevu bulunmuyor</p>
                )}
              </TabsContent>

              <TabsContent value="payments">
                {viewClient.transactions && viewClient.transactions.length > 0 ? (
                  <div className="space-y-3">
                    {viewClient.transactions.map((tx: any) => (
                      <Card key={tx.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">₺{tx.amount.toFixed(2)}</p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(tx.transactionDate), "dd MMM yyyy", {
                                  locale: tr,
                                })}
                              </p>
                              <p className="text-sm text-gray-500">{tx.paymentMethod}</p>
                            </div>
                            <Badge variant={tx.type === "INCOME" ? "default" : "secondary"}>
                              {tx.type === "INCOME" ? "Gelir" : "Gider"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Henüz ödeme bulunmuyor</p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Danışanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu danışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

      {/* Import Dialog */}
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        title="Danışanları İçe Aktar"
        description="CSV dosyasından danışan kayıtlarını toplu olarak içe aktarın"
        templateFields={[
          "firstName",
          "lastName",
          "email",
          "phone",
          "dateOfBirth",
          "emergencyContact",
          "emergencyPhone"
        ]}
        onImport={handleImport}
      />
    </div>
  );
}
