
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useState, useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
