
import { SignInForm } from "@/components/auth/signin-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Stethoscope } from "lucide-react";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-teal-100 rounded-xl shadow-lg">
              <Stethoscope className="h-8 w-8 text-teal-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Klinik Yönetim Sistemi
          </h1>
          <p className="text-gray-600">
            Sisteme giriş yapın
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SignInForm />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Klinik Yönetim Sistemi. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}
