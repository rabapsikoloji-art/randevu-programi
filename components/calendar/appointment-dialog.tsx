
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, User, Settings, Video, ExternalLink, Send } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  userRole: string;
  appointment?: any;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export function AppointmentDialog({ 
  open, 
  onClose, 
  userRole, 
  appointment 
}: AppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    personnelId: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 50,
    notes: '',
    price: 0,
    isOnline: false
  });
  
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
      if (appointment) {
        // Populate form for editing
        const date = new Date(appointment.appointmentDate);
        setFormData({
          clientId: appointment.clientId,
          personnelId: appointment.personnelId,
          serviceId: appointment.serviceId,
          appointmentDate: format(date, 'yyyy-MM-dd'),
          appointmentTime: format(date, 'HH:mm'),
          duration: appointment.duration,
          notes: appointment.notes || '',
          price: appointment.price || 0,
          isOnline: appointment.isOnline || false
        });
      } else {
        // Reset form for new appointment
        setFormData({
          clientId: '',
          personnelId: '',
          serviceId: '',
          appointmentDate: '',
          appointmentTime: '',
          duration: 50,
          notes: '',
          price: 0,
          isOnline: false
        });
        setWhatsappLink(null);
      }
    }
  }, [open, appointment]);

  const fetchData = async () => {
    try {
      const [clientsRes, personnelRes, servicesRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/personnel'),
        fetch('/api/services')
      ]);

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }

      if (personnelRes.ok) {
        const personnelData = await personnelRes.json();
        setPersonnel(personnelData);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setFormData(prev => ({
        ...prev,
        serviceId,
        duration: service.duration,
        price: service.price
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      
      const data = {
        ...formData,
        appointmentDate: appointmentDateTime.toISOString(),
      };

      const url = appointment 
        ? `/api/appointments/${appointment.id}` 
        : '/api/appointments';
      
      const method = appointment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Online randevu oluşturulduysa WhatsApp linki göster
        if (result.whatsappLink && formData.isOnline) {
          setWhatsappLink(result.whatsappLink);
          toast.success('Randevu oluşturuldu! WhatsApp mesajı gönderebilirsiniz.', {
            duration: 5000,
          });
        } else {
          toast.success(appointment ? 'Randevu güncellendi!' : 'Randevu oluşturuldu!');
          onClose();
          window.location.reload(); // Refresh calendar
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            {appointment ? 'Randevuyu Düzenle' : 'Yeni Randevu'}
          </DialogTitle>
          <DialogDescription>
            {appointment ? 'Randevu bilgilerini güncelleyin' : 'Yeni bir randevu oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Danışan *</Label>
              <Select
                value={formData.clientId || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Danışan seçin" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {client.firstName} {client.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personnel">Psikolog *</Label>
              <Select
                value={formData.personnelId || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, personnelId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Psikolog seçin" />
                </SelectTrigger>
                <SelectContent>
                  {personnel?.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {person.firstName} {person.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Hizmet *</Label>
            <Select
              value={formData.serviceId || ""}
              onValueChange={handleServiceChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Hizmet seçin" />
              </SelectTrigger>
              <SelectContent>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {service.name}
                      </div>
                      <span className="text-sm text-gray-500">
                        {service.duration}dk - {service.price.toLocaleString('tr-TR')}₺
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Tarih *</Label>
              <Input
                id="date"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Saat *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Süre (dakika)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                min="15"
                max="180"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Ücret (₺)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="isOnline" className="flex items-center gap-2">
                <Video className="h-4 w-4 text-teal-600" />
                Online Seans
              </Label>
              <Switch
                id="isOnline"
                checked={formData.isOnline}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOnline: checked }))}
              />
            </div>
            <p className="text-xs text-gray-500">
              {formData.isOnline 
                ? 'Bu randevu için otomatik Google Meet linki oluşturulacaktır.' 
                : 'Randevu yüz yüze gerçekleştirilecektir.'}
            </p>
          </div>

          {/* Meet Link Gösterimi (Düzenleme Modunda) */}
          {appointment?.meetLink && (
            <div className="space-y-2 p-3 bg-teal-50 rounded-lg border border-teal-200">
              <Label className="text-teal-700 font-semibold">Google Meet Linki</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={appointment.meetLink}
                  readOnly
                  className="bg-white"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    window.open(appointment.meetLink, '_blank');
                  }}
                  title="Linki aç"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(appointment.meetLink);
                    toast.success('Link kopyalandı!');
                  }}
                  title="Linki kopyala"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </Button>
              </div>
            </div>
          )}

          {/* WhatsApp Mesajı Gönder Butonu */}
          {whatsappLink && (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Label className="text-green-700 font-semibold">WhatsApp Mesajı Gönder</Label>
              <p className="text-sm text-gray-600 mb-2">
                Danışana randevu detayları ve Meet linkini WhatsApp ile gönderin.
              </p>
              <Button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  window.open(whatsappLink, '_blank');
                  setTimeout(() => {
                    onClose();
                    window.location.reload();
                  }, 1000);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                WhatsApp ile Gönder
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Randevu notları..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loading ? 'Kaydediliyor...' : (appointment ? 'Güncelle' : 'Oluştur')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
