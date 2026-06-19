// PDF + WhatsApp slip generation.
// Build a styled HTML node, snapshot with html2canvas, embed in jsPDF, download.
// Then open wa.me with the farmer/buyer phone — they hit Send and attach the file.

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateSlipPDF(node, filename = 'slip.pdf') {
  if (!node) throw new Error('No node to render');
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#F5EFE0',
    useCORS: true,
    logging: false,
  });
  const img = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const ratio = canvas.height / canvas.width;
  let w = pw - 10;
  let h = w * ratio;
  if (h > ph - 10) { h = ph - 10; w = h / ratio; }
  const x = (pw - w) / 2;
  const y = (ph - h) / 2;
  pdf.addImage(img, 'PNG', x, y, w, h);
  pdf.save(filename);
  return { canvas, pdf };
}

export function openWhatsApp(phone, message) {
  const clean = (phone || '').replace(/[^\d]/g, '');
  const num = clean.length === 10 ? '91' + clean : clean;
  const url = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
}
