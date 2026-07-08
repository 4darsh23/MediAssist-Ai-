export function generatePdfBuffer(report) {
  const { name, email, date, scanType, result, confidence, severity, symptoms, recommendations } = report;

  const titleText = "MEDASSIST AI - MEDICAL REPORT";
  const divider = "--------------------------------------------------";

  const lines = [
    `Report ID:      RPT-${Date.now().toString().slice(-6)}`,
    `Date:           ${date}`,
    `Patient Name:   ${name}`,
    `Email:          ${email}`,
    divider,
    `SCAN ANALYSIS DETAILS`,
    divider,
    `Scan Type:      ${scanType}`,
    `Diagnosis:      ${result}`,
    `Confidence:     ${confidence}%`,
    `Severity:       ${severity.toUpperCase()}`,
    `Symptoms:       ${symptoms || "None"}`,
    divider,
    `RECOMMENDATIONS`,
    divider,
    ...recommendations.map((rec, i) => `${i + 1}. ${rec}`),
    divider,
    `DISCLAIMER`,
    divider,
    "This analysis is AI-generated for educational purposes only.",
    "Do not use in place of professional medical advice."
  ];

  // Map each line to PDF text operators
  let yOffset = 700;
  const streamContent = [
    "BT",
    "/F1 16 Tf",
    `72 ${yOffset} Td`,
    `(${titleText}) Tj`,
    "/F1 10 Tf",
    "0 -24 Td"
  ];

  yOffset -= 24;

  for (const line of lines) {
    // Sanitize string to prevent breaking PDF syntax
    const cleanLine = line.replace(/[()\\\r\n]/g, "");
    streamContent.push(`(${cleanLine}) Tj`, "0 -16 Td");
    yOffset -= 16;
  }

  streamContent.push("ET");
  const contentStream = streamContent.join("\n");

  const pdfBody = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [ 0 0 612 792 ] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj
5 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000250 00000 n 
0000000320 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;

  return Buffer.from(pdfBody, "utf-8");
}
