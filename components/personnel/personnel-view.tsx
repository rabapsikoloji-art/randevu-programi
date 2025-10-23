
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  UserCheck, 
  Plus, 
  Users,
  Mail,
  Phone,
  Briefcase,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";

interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specialization?: string;
  photo?: string;
  createdAt: string;
  user: {
    email: string;
    role: string;
  };
}

interface PersonnelViewProps {
  userRole: string;
}

const roleLabels: Record<string, string> = {
  PSYCHOLOGIST: "Psikolog",
  COORDINATOR: "Koordinatör"
};

const roleColors: Record<string, string> = {
  PSYCHOLOGIST: "bg-blue-100 text-blue-700",
  COORDINATOR: "bg-green-100 text-green-700"
};

export function PersonnelView({ userRole }: PersonnelViewProps) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      const response = await fetch("/api/personnel/all");
      if (response.ok) {
        const data = await response.json();
        setPersonnel(data);
      }
    } catch (error) {
      console.error("Error fetching personnel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = personnel.map(person => ({
      AdSoyad: `${person.firstName} ${person.lastName}`,
      Eposta: person.user.email,
      Telefon: person.phone || "",
      Rol: roleLabels[person.user.role],
      Uzmanlik: person.specialization || "",
      KatilimTarihi: new Date(person.createdAt).toLocaleDateString('tr-TR')
    }));
    
    exportToCSV(exportData, "personel");
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 rounded-xl">
            <Users className="h-6 w-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Personel Listesi
            </h2>
            <p className="text-gray-600">
              {personnel.length} aktif personel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={personnel.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Personel
          </Button>
        </div>
      </div>

      {/* Personnel Grid */}
      {personnel.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Henüz personel bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {personnel.map((person) => (
            <Card key={person.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={person.photo || ""} />
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {person.firstName.charAt(0)}
                        {person.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-gray-900">
                        {person.firstName} {person.lastName}
                      </CardTitle>
                      <Badge className={roleColors[person.user.role]}>
                        {roleLabels[person.user.role]}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{person.user.email}</span>
                  </div>
                  
                  {person.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{person.phone}</span>
                    </div>
                  )}
                  
                  {person.specialization && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{person.specialization}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Katılım: {new Date(person.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
