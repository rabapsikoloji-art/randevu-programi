
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stethoscope, Calendar, Users, BarChart3, CreditCard } from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Stethoscope className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Klinik Yönetim Sistemi
              </h1>
              <p className="text-sm text-gray-600">
                Psikolojik Danışmanlık
              </p>
            </div>
          </div>
          <Link href="/auth/signin">
            <Button className="bg-teal-600 hover:bg-teal-700">
              Giriş Yap
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Klinik Yönetiminizi
            <span className="text-teal-600"> Kolaylaştırın</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Randevu yönetimi, hasta takibi, finansal raporlama ve daha fazlası 
            için tasarlanmış kapsamlı klinik yönetim sistemi.
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-3">
              Hemen Başlayın
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-3 bg-teal-100 rounded-xl w-fit mx-auto mb-4">
              <Calendar className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Randevu Yönetimi</h3>
            <p className="text-gray-600">
              Kolay randevu oluşturma, düzenleme ve takip sistemi
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Hasta Yönetimi</h3>
            <p className="text-gray-600">
              Kapsamlı hasta profilleri ve tıbbi kayıt sistemi
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Finansal Yönetim</h3>
            <p className="text-gray-600">
              Gelir-gider takibi ve finansal raporlama
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">İstatistikler</h3>
            <p className="text-gray-600">
              Detaylı analiz ve performans raporları
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 Klinik Yönetim Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
