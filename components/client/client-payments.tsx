
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  paymentMethod: string;
  description: string | null;
  transactionDate: string;
  appointment?: {
    service: {
      name: string;
    };
    personnel: {
      firstName: string;
      lastName: string;
      photo: string | null;
    };
    appointmentDate: string;
    status: string;
  };
}

const paymentMethodLabels: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı",
  BANK_TRANSFER: "Banka Transferi",
  PACKAGE: "Paket",
};

const appointmentStatusLabels: Record<string, string> = {
  SCHEDULED: "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  NO_SHOW: "Gelmedi",
  IN_PROGRESS: "Devam Ediyor",
};

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
};

export function ClientPayments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/client/transactions");
        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ödemeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const thisMonthPayments = transactions.filter(
    (t) => new Date(t.transactionDate) >= lastMonth
  );
  const thisMonthTotal = thisMonthPayments.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Toplam Ödeme
            </CardTitle>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalPaid.toLocaleString("tr-TR")}₺
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.length} işlem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bu Ay
            </CardTitle>
            <Calendar className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {thisMonthTotal.toLocaleString("tr-TR")}₺
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {thisMonthPayments.length} işlem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Son Ödeme
            </CardTitle>
            <Clock className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <>
                <div className="text-2xl font-bold text-gray-900">
                  {transactions[0].amount.toLocaleString("tr-TR")}₺
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(transactions[0].transactionDate), "d MMM yyyy", {
                    locale: tr,
                  })}
                </p>
              </>
            ) : (
              <div className="text-sm text-gray-500">Henüz ödeme yok</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Henüz ödeme kaydı bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {transaction.appointment?.personnel ? (
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={transaction.appointment.personnel.photo || ""}
                        />
                        <AvatarFallback className="bg-teal-100 text-teal-700">
                          {transaction.appointment.personnel.firstName.charAt(0)}
                          {transaction.appointment.personnel.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {transaction.appointment?.service.name ||
                            transaction.description ||
                            "Ödeme"}
                        </p>
                        {transaction.appointment?.status && (
                          <Badge
                            className={`${
                              statusColors[transaction.appointment.status]
                            } text-xs`}
                          >
                            {appointmentStatusLabels[transaction.appointment.status]}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        {transaction.appointment?.personnel && (
                          <span>
                            {transaction.appointment.personnel.firstName}{" "}
                            {transaction.appointment.personnel.lastName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {paymentMethodLabels[transaction.paymentMethod]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(
                            new Date(transaction.transactionDate),
                            "d MMM yyyy",
                            { locale: tr }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-teal-600">
                      {transaction.amount.toLocaleString("tr-TR")}₺
                    </p>
                    {transaction.appointment?.appointmentDate && (
                      <p className="text-xs text-gray-500">
                        Randevu:{" "}
                        {format(
                          new Date(transaction.appointment.appointmentDate),
                          "d MMM",
                          { locale: tr }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Ödeme Bilgisi</p>
              <p>
                Ödemeleriniz randevu sırasında veya sonrasında nakit, kredi kartı veya
                banka transferi ile yapılabilir. Paket satın aldıysanız, ödemeleriniz
                otomatik olarak paketinizden düşülecektir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
