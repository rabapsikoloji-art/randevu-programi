
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { TransactionDialog } from "./transaction-dialog";
import { exportToCSV, flattenObject } from "@/lib/export-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  paymentMethod: string;
  description?: string;
  category?: string;
  transactionDate: string;
  appointment?: {
    client: {
      firstName: string;
      lastName: string;
    };
  };
}

interface CashRegisterViewProps {
  userRole: string;
}

interface FilterState {
  type: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
}

const typeLabels: Record<string, string> = {
  INCOME: "Gelir",
  EXPENSE: "Gider"
};

const typeColors: Record<string, string> = {
  INCOME: "bg-green-100 text-green-700",
  EXPENSE: "bg-red-100 text-red-700"
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Nakit",
  CREDIT_CARD: "Kredi Kartı", 
  BANK_TRANSFER: "Havale",
  PACKAGE: "Paket"
};

export function CashRegisterView({ userRole }: CashRegisterViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransaction, setShowNewTransaction] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    paymentMethod: "all",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: ""
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
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

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Filter by payment method
    if (filters.paymentMethod !== "all") {
      filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
    }

    // Filter by date range
    if (filters.startDate) {
      filtered = filtered.filter(t => 
        new Date(t.transactionDate) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => 
        new Date(t.transactionDate) <= new Date(filters.endDate)
      );
    }

    // Filter by amount range
    if (filters.minAmount) {
      filtered = filtered.filter(t => t.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.amount <= parseFloat(filters.maxAmount));
    }

    setFilteredTransactions(filtered);
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      paymentMethod: "all",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: ""
    });
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      Tarih: format(new Date(t.transactionDate), "dd/MM/yyyy HH:mm", { locale: tr }),
      Tip: typeLabels[t.type],
      Tutar: t.amount,
      OdemeYontemi: paymentMethodLabels[t.paymentMethod],
      Aciklama: t.description || "",
      Kategori: t.category || "",
      Danisan: t.appointment?.client ? `${t.appointment.client.firstName} ${t.appointment.client.lastName}` : ""
    }));
    
    exportToCSV(exportData, "kasa_islemleri");
  };

  const totalIncome = filteredTransactions?.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpenses = filteredTransactions?.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0) || 0;
  const netBalance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Gelir
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalIncome.toLocaleString('tr-TR')}₺
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Toplam Gider
              </CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalExpenses.toLocaleString('tr-TR')}₺
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Bakiye
              </CardTitle>
              <div className={`p-2 rounded-lg ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <CreditCard className={`h-4 w-4 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netBalance.toLocaleString('tr-TR')}₺
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">İşlemler</h2>
            <p className="text-gray-600 mt-1">
              {filteredTransactions.length} kayıt gösteriliyor
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilterDialog(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrele
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Dışa Aktar
            </Button>

            <Button 
              onClick={() => setShowNewTransaction(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni İşlem
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <Card>
          <CardContent className="p-0">
            {filteredTransactions?.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Henüz işlem bulunmuyor</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTransactions?.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={typeColors[transaction.type]}>
                            {typeLabels[transaction.type]}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {paymentMethodLabels[transaction.paymentMethod]}
                          </span>
                        </div>
                        
                        <p className="font-medium text-gray-900">
                          {transaction.description || "Açıklama yok"}
                        </p>
                        
                        {transaction.appointment && (
                          <p className="text-sm text-gray-600">
                            {transaction.appointment.client.firstName} {transaction.appointment.client.lastName}
                          </p>
                        )}
                        
                        {transaction.category && (
                          <p className="text-sm text-gray-500">
                            Kategori: {transaction.category}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(transaction.transactionDate), "d MMM yyyy, HH:mm", { locale: tr })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${
                          transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "INCOME" ? "+" : "-"}{transaction.amount.toLocaleString('tr-TR')}₺
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşlemleri Filtrele</DialogTitle>
            <DialogDescription>
              Filtreleme kriterlerini seçin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-type">İşlem Tipi</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="INCOME">Gelir</SelectItem>
                  <SelectItem value="EXPENSE">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-payment">Ödeme Yöntemi</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
              >
                <SelectTrigger id="filter-payment">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="CASH">Nakit</SelectItem>
                  <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Havale</SelectItem>
                  <SelectItem value="PACKAGE">Paket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Başlangıç Tarihi</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Bitiş Tarihi</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-amount">Min. Tutar</Label>
                <Input
                  id="min-amount"
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="max-amount">Maks. Tutar</Label>
                <Input
                  id="max-amount"
                  type="number"
                  placeholder="9999"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Sıfırla
            </Button>
            <Button onClick={() => setShowFilterDialog(false)} className="bg-teal-600 hover:bg-teal-700">
              Uygula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showNewTransaction && (
        <TransactionDialog
          open={showNewTransaction}
          onClose={() => setShowNewTransaction(false)}
          onSave={fetchTransactions}
        />
      )}
    </>
  );
}
