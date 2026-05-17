import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

const pdfExtract = new PDFExtract();

/**
 * Extract text from PDF buffer
 */
export const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfExtract.extractBuffer(buffer, {});
    return data.pages
      .map(page => page.content.map(item => item.str).join(' '))
      .join('\n');
  } catch (error) {
    console.error('Error extracting PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

/**
 * Extract text from DOCX buffer
 */
export const extractTextFromDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};
