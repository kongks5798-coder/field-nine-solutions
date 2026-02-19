// PDF 변환 샘플 함수 (jsPDF 사용)
// npm install jspdf 필요 (실제 배포 시)
import { jsPDF } from 'jspdf';

export function generatePDFReport(title: string, content: string): Uint8Array {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  doc.text(content, 20, 40);
  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
  return new Uint8Array(arrayBuffer);
}
