
// Utility functions for exporting data to CSV

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert("Dışa aktarılacak veri bulunmuyor");
    return;
  }

  // Get all unique keys from all objects
  const keys = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  );

  // Create CSV header
  const csvHeader = keys.join(',');

  // Create CSV rows
  const csvRows = data.map(item => {
    return keys.map(key => {
      const value = item[key];
      
      // Handle nested objects
      if (value && typeof value === 'object') {
        return JSON.stringify(value).replace(/,/g, ';');
      }
      
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      
      return value ?? '';
    }).join(',');
  });

  // Combine header and rows
  const csv = [csvHeader, ...csvRows].join('\n');

  // Create blob and download
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      flattened[newKey] = value.join('; ');
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
}
