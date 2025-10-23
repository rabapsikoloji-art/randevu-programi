
/**
 * Google Meet link oluşturma ve WhatsApp mesajı gönderme fonksiyonları
 */

/**
 * Unique Google Meet linki oluşturur
 * Format: https://meet.google.com/xxx-yyyy-zzz
 */
export function generateMeetLink(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  
  const generateSegment = (length: number): string => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const segment1 = generateSegment(3);
  const segment2 = generateSegment(4);
  const segment3 = generateSegment(3);

  return `https://meet.google.com/${segment1}-${segment2}-${segment3}`;
}

/**
 * WhatsApp mesajı için link oluşturur
 * @param phoneNumber - Telefon numarası (90XXXXXXXXXX formatında)
 * @param message - Gönderilecek mesaj
 */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Telefon numarasını temizle (sadece rakamlar)
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Mesajı URL encode et
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Online randevu için WhatsApp mesajı metni oluşturur
 */
export function createAppointmentWhatsAppMessage(
  clientName: string,
  appointmentDate: Date,
  personnelName: string,
  meetLink: string
): string {
  const formattedDate = new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(appointmentDate);

  return `Merhaba ${clientName},

Online seans randevunuz oluşturulmuştur:

📅 Tarih: ${formattedDate}
👨‍⚕️ Psikolog: ${personnelName}

🔗 Toplantı Linki: ${meetLink}

Randevu saatinizde bu linke tıklayarak seansa katılabilirsiniz.

Sağlıklı günler dileriz.`;
}
