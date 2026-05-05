import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function downloadReceiptPdf(
  element: HTMLDivElement,
  filename: string,
) {
  if (typeof document !== "undefined" && "fonts" in document) {
    await (document.fonts as FontFaceSet).ready;
  }

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width / 2, canvas.height / 2],
    compress: true,
  });

  pdf.addImage(imageData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}
