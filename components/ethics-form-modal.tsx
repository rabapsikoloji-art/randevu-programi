
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getEthicsFormByRole } from "@/lib/ethics-forms";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export function EthicsFormModal() {
  const { data: session, update } = useSession() || {};
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session?.user?.role) {
    return null;
  }

  // Eğer kullanıcı etik formu onaylamışsa modal'ı gösterme
  if ((session.user as any).ethicsFormAccepted) {
    return null;
  }

  const ethicsForm = getEthicsFormByRole(session.user.role);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error("Lütfen etik kuralları kabul edin");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ethics-form/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Etik form onayı kaydedilemedi");
      }

      // Session'ı güncelle
      await update();
      
      toast.success("Etik kurallar başarıyla onaylandı");
      router.refresh();
    } catch (error) {
      console.error("Ethics form acceptance error:", error);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {ethicsForm.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            Sistemi kullanabilmek için lütfen aşağıdaki etik kuralları okuyun ve kabul edin
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {ethicsForm.content.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  {section.section}
                </h3>
                <ul className="space-y-2 pl-7">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-700 leading-relaxed">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="accept-ethics"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
            />
            <label
              htmlFor="accept-ethics"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Yukarıda belirtilen tüm etik kuralları ve sorumlulukları okudum, anladım ve
              kabul ediyorum. Bu kurallara uymayı taahhüt ederim.
            </label>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!accepted || isSubmitting}
            className="w-full bg-teal-600 hover:bg-teal-700"
            size="lg"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kabul Ediyorum ve Devam Et"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
