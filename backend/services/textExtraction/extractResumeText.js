/**
 * extractResumeText.js
 *
 * Strategy:
 *  1. If it's a DOCX -> use mammoth (reliable, resumes are rarely "scanned" DOCX).
 *  2. If it's a PDF  -> try pdf-parse first (cheap, fast, works when there's a real text layer).
 *     If the extracted text is suspiciously short/empty -> treat as a scanned/image PDF
 *     and fall back to OCR (tesseract.js) on rendered page images.
 *  3. Always return a confidence flag so low-quality parses can be routed to manual review
 *     instead of silently trusting garbage output.
 *
 * npm install pdf-parse mammoth tesseract.js
 *
 * OCR fallback for scanned PDFs is currently disabled: it previously used
 * pdf-poppler to rasterize pages, but that package hard-exits the whole
 * process on any platform other than Windows/Mac (including Linux, e.g.
 * Render), which isn't viable for deployment. Direct-text PDFs and DOCX are
 * unaffected. See ocrPdfPages() below.
 */

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

const MIN_ACCEPTABLE_CHARS = 200; // below this, assume the PDF has no real text layer

async function extractFromDocx(filePath) {
    const { value: text } = await mammoth.extractRawText({ path: filePath });
    return { text, method: "docx-direct", confidence: text.length > MIN_ACCEPTABLE_CHARS ? "high" : "low" };
}

async function extractFromPdfDirect(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
}

async function ocrPdfPages(filePath) {
    // Disabled - see file header. Previously rendered each PDF page to a PNG
    // via pdf-poppler, then OCR'd each image with Tesseract.
    throw new Error(
        "This PDF appears to be scanned/image-based and OCR fallback is currently unavailable. " +
            "Please upload a PDF with selectable text, or a DOCX file."
    );
}

function looksParsed(text) {
    // crude heuristic: real resumes almost always mention at least one of these section words
    const sectionSignals = /experience|education|skills|projects|employment/i;
    return text.length > MIN_ACCEPTABLE_CHARS && sectionSignals.test(text);
}

async function extractResumeText(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".docx") {
        return extractFromDocx(filePath);
    }

    if (ext === ".pdf") {
        const directText = await extractFromPdfDirect(filePath);

        if (looksParsed(directText)) {
            return { text: directText, method: "pdf-direct", confidence: "high" };
        }

        // Likely a scanned/image-based PDF -> fall back to OCR
        const ocrText = await ocrPdfPages(filePath);
        return {
            text: ocrText,
            method: "pdf-ocr-fallback",
            confidence: looksParsed(ocrText) ? "medium" : "low", // OCR is never "high" confidence
        };
    }

    throw new Error(`Unsupported file type: ${ext}`);
}

module.exports = { extractResumeText };

// Example usage:
// extractResumeText("./candidate.pdf").then(result => {
//   console.log(result.method, result.confidence);
//   console.log(result.text.slice(0, 500));
// });