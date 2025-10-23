
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  photo: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  serviceType: string;
}

const serviceTypeLabels: Record<string, string> = {
  INDIVIDUAL_THERAPY: "Bireysel Terapi",
  COUPLES_THERAPY: "Çift Terapisi",
  FAMILY_THERAPY: "Aile Terapisi",
  CHILD_ADOLESCENT_THERAPY: "Çocuk ve Ergen Terapisi",
  ONLINE_THERAPY: "Online Terapi",
  GROUP_THERAPY: "Grup Terapisi",
};

export function BookAppointment() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    personnelId: "",
    serviceId: "",
    appointmentDate: "",
    appointmentTime: "",
    isOnline: false,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [personnelRes, servicesRes] = await Promise.all([
        fetch("/api/personnel"),
        fetch("/api/services"),
      ]);

      if (personnelRes.ok) {
        const data = await personnelRes.json();
        setPersonnel(data.filter((p: Personnel & { isActive: boolean }) => p.isActive));
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.filter((s: Service & { isActive: boolean }) => s.isActive));
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Veriler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find((s) => s.id === formData.serviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.personnelId || !formData.serviceId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnelId: formData.personnelId,
          serviceId: formData.serviceId,
          appointmentDate: appointmentDateTime.toISOString(),
          duration: selectedService?.duration || 50,
          isOnline: formData.isOnline,
          notes: formData.notes || undefined,
          price: selectedService?.price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Randevu oluşturulamadı");
      }

      toast.success("Randevu başarıyla oluşturuldu");
      router.push("/client/appointments");
    } catch (error: any) {
      console.error("Create appointment error:", error);
      toast.error(error.message || "Randevu oluşturulurken bir hata oluştu");
    } finally {
      setSubmitting(false);
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

  const selectedPersonnel = personnel.find((p) => p.id === formData.personnelId);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Psikolog Seçin</CardTitle>
                <CardDescription>Görüşmek istediğiniz psikoloğu seçin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {personnel.length === 0 ? (
                    <p className="text-sm text-gray-500">Aktif psikolog bulunmuyor</p>
                  ) : (
                    personnel.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.personnelId === p.id
                            ? "border-teal-600 bg-teal-50"
                            : "border-gray-200 hover:border-teal-400"
                        }`}
                        onClick={() => setFormData({ ...formData, personnelId: p.id })}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={p.photo || ""} />
                          <AvatarFallback className="bg-teal-100 text-teal-700">
                            {p.firstName.charAt(0)}
                            {p.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {p.firstName} {p.lastName}
                          </p>
                          {p.specialization && (
                            <p className="text-sm text-gray-500">{p.specialization}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hizmet Seçin</CardTitle>
                <CardDescription>Almak istediğiniz hizmeti seçin</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hizmet seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{service.name}</span>
                          <span className="ml-2 text-gray-500">
                            ({service.duration} dk - {service.price}₺)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedService && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Süre:</span>
                      <span className="text-sm font-medium">{selectedService.duration} dakika</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ücret:</span>
                      <span className="text-sm font-medium text-teal-600">{selectedService.price}₺</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tür:</span>
                      <Badge variant="outline">
                        {serviceTypeLabels[selectedService.serviceType]}
                      </Badge>
                    </div>
                    {selectedService.description && (
                      <div className="pt-2 mt-2 border-t">
                        <p className="text-sm text-gray-600">{selectedService.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tarih ve Saat</CardTitle>
                <CardDescription>Randevu tarihi ve saati belirleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Tarih *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    min={format(new Date(), "yyyy-MM-dd")}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time">Saat *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {formData.isOnline ? (
                      <Video className="h-5 w-5 text-teal-600" />
                    ) : (
                      <MapPin className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <Label htmlFor="online" className="cursor-pointer">
                        Online Görüşme
                      </Label>
                      <p className="text-xs text-gray-500">
                        {formData.isOnline
                          ? "Google Meet ile online görüşme"
                          : "Klinikte yüz yüze görüşme"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="online"
                    checked={formData.isOnline}
                    onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
                <CardDescription>Özel bir notunuz varsa buraya yazabilirsiniz</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Randevunuzla ilgili not ekleyin (opsiyonel)"
                  rows={4}
                />
              </CardContent>
            </Card>

            {selectedPersonnel && selectedService && (
              <Card className="border-teal-200 bg-teal-50">
                <CardHeader>
                  <CardTitle className="text-lg">Randevu Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedPersonnel.photo || ""} />
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {selectedPersonnel.firstName.charAt(0)}
                        {selectedPersonnel.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedPersonnel.firstName} {selectedPersonnel.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{selectedService.name}</p>
                    </div>
                  </div>

                  {formData.appointmentDate && formData.appointmentTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(formData.appointmentDate), "d MMMM yyyy", { locale: tr })}
                      </span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{formData.appointmentTime}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    {formData.isOnline ? (
                      <>
                        <Video className="h-4 w-4 text-teal-600" />
                        <span className="text-teal-600">Online Görüşme</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">Yüz Yüze Görüşme</span>
                      </>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Toplam Ücret:</span>
                      <span className="text-lg font-bold text-teal-600">{selectedService.price}₺</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="lg"
              disabled={submitting || !formData.personnelId || !formData.serviceId || !formData.appointmentDate || !formData.appointmentTime}
            >
              {submitting ? "Randevu Oluşturuluyor..." : "Randevu Oluştur"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
