
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Download } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/export-utils";

export function StatisticsView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, appointmentsRes, transactionsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/appointments"),
        fetch("/api/transactions"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData);
      }
    } catch (error) {
      toast.error("İstatistikler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalRevenue = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const completedAppointments = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledAppointments = appointments.filter((a) => a.status === "CANCELLED").length;
  const noShowAppointments = appointments.filter((a) => a.status === "NO_SHOW").length;

  const cancellationRate =
    appointments.length > 0
      ? (((cancelledAppointments + noShowAppointments) / appointments.length) * 100).toFixed(1)
      : "0";

  // Service popularity
  const serviceCount: { [key: string]: number } = {};
  appointments.forEach((apt) => {
    if (apt.service?.name) {
      serviceCount[apt.service.name] = (serviceCount[apt.service.name] || 0) + 1;
    }
  });

  const popularServices = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleExport = () => {
    const exportData = [
      {
        Kategori: "Genel İstatistikler",
        ToplamRandevu: stats?.totalAppointments || 0,
        TamamlananRandevu: completedAppointments,
        IptalEdilenRandevu: cancelledAppointments,
        GelmeyenRandevu: noShowAppointments,
        IptalOrani: `%${cancellationRate}`,
        AktifDanisan: stats?.activeClients || 0,
        ToplamGelir: totalRevenue,
        ToplamGider: totalExpenses,
        NetKarZarar: totalRevenue - totalExpenses
      }
    ];
    
    exportToCSV(exportData, "istatistikler");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İstatistikler</h1>
          <p className="text-gray-500 mt-1">Klinik performans raporları ve analizler</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          disabled={loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Dışa Aktar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Randevu</CardTitle>
                <Calendar className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalAppointments || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {completedAppointments} tamamlandı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktif Danışan</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Kayıtlı danışan sayısı</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₺{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Net: ₺{(totalRevenue - totalExpenses).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">İptal Oranı</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">%{cancellationRate}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {cancelledAppointments + noShowAppointments} iptal/gelme
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Details */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Popular Services */}
            <Card>
              <CardHeader>
                <CardTitle>Popüler Hizmetler</CardTitle>
                <CardDescription>En çok talep edilen hizmetler</CardDescription>
              </CardHeader>
              <CardContent>
                {popularServices.length > 0 ? (
                  <div className="space-y-4">
                    {popularServices.map(([service, count], index) => (
                      <div key={service}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{service}</span>
                          <span className="text-sm text-gray-500">{count} randevu</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full"
                            style={{
                              width: `${(count / appointments.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Henüz veri bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            {/* Appointment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Randevu Durumu</CardTitle>
                <CardDescription>Randevu dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Tamamlandı</span>
                      <span className="text-sm text-gray-500">
                        {completedAppointments} randevu
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width:
                            appointments.length > 0
                              ? `${(completedAppointments / appointments.length) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">İptal Edildi</span>
                      <span className="text-sm text-gray-500">
                        {cancelledAppointments} randevu
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width:
                            appointments.length > 0
                              ? `${(cancelledAppointments / appointments.length) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Gelmedi</span>
                      <span className="text-sm text-gray-500">{noShowAppointments} randevu</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width:
                            appointments.length > 0
                              ? `${(noShowAppointments / appointments.length) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue vs Expenses */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Finansal Özet</CardTitle>
                <CardDescription>Gelir ve gider karşılaştırması</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-green-600">Toplam Gelir</span>
                      <span className="text-lg font-bold text-green-600">
                        ₺{totalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{
                          width:
                            totalRevenue + totalExpenses > 0
                              ? `${(totalRevenue / (totalRevenue + totalExpenses)) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-600">Toplam Gider</span>
                      <span className="text-lg font-bold text-red-600">
                        ₺{totalExpenses.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-600 h-3 rounded-full"
                        style={{
                          width:
                            totalRevenue + totalExpenses > 0
                              ? `${(totalExpenses / (totalRevenue + totalExpenses)) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold">Net Kar/Zarar</span>
                      <span
                        className={`text-xl font-bold ${
                          totalRevenue - totalExpenses >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₺{(totalRevenue - totalExpenses).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
