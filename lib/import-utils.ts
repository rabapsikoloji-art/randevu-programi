
import { parse } from 'csv-parse/sync';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export async function parseCSV(file: File): Promise<any[]> {
  const text = await file.text();
  
  try {
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
    });
    
    return records;
  } catch (error) {
    throw new Error('CSV dosyası okunamadı. Lütfen dosya formatını kontrol edin.');
  }
}

export function validateClientData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push('Ad alanı boş olamaz');
  }
  if (!data.lastName || data.lastName.trim() === '') {
    errors.push('Soyad alanı boş olamaz');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateServiceData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Hizmet adı boş olamaz');
  }
  if (!data.price || isNaN(Number(data.price))) {
    errors.push('Geçerli bir fiyat girilmeli');
  }
  if (!data.duration || isNaN(Number(data.duration))) {
    errors.push('Geçerli bir süre girilmeli');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validatePackageData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Paket adı boş olamaz');
  }
  if (!data.price || isNaN(Number(data.price))) {
    errors.push('Geçerli bir fiyat girilmeli');
  }
  if (!data.sessionCount || isNaN(Number(data.sessionCount))) {
    errors.push('Geçerli bir seans sayısı girilmeli');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validatePersonnelData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push('Ad alanı boş olamaz');
  }
  if (!data.lastName || data.lastName.trim() === '') {
    errors.push('Soyad alanı boş olamaz');
  }
  if (!data.email || !data.email.includes('@')) {
    errors.push('Geçerli bir email adresi girilmeli');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateAppointmentData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.clientId) {
    errors.push('Danışan ID boş olamaz');
  }
  if (!data.personnelId) {
    errors.push('Psikolog ID boş olamaz');
  }
  if (!data.serviceId) {
    errors.push('Hizmet ID boş olamaz');
  }
  if (!data.startTime) {
    errors.push('Başlangıç tarihi boş olamaz');
  }
  
  return { valid: errors.length === 0, errors };
}
