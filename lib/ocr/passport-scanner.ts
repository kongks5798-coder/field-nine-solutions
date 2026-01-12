/**
 * K-UNIVERSAL Passport OCR Engine
 * Tesla/Apple-grade document scanning with MRZ extraction
 */

import Tesseract from 'tesseract.js';

export interface PassportData {
  passportNumber: string;
  mrzCode: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  expiryDate: string;
  documentType: 'P' | 'ID' | 'V'; // Passport, ID Card, Visa
  issuingCountry: string;
  sex: 'M' | 'F' | 'X';
}

export interface OCRResult {
  success: boolean;
  data?: PassportData;
  confidence: number;
  error?: string;
}

/**
 * Extract MRZ (Machine Readable Zone) from passport image
 * MRZ Format (2 lines):
 * Line 1: P<COUNTRY<SURNAME<<NAMES<<<<<<<<<<<<<<<<<<
 * Line 2: PASSPORT_NO<NATIONALITY<DOB<SEX<EXPIRY<PERSONAL_NO
 */
export class PassportScanner {
  private worker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
  }

  async scanPassport(imageFile: File | string): Promise<OCRResult> {
    try {
      if (!this.worker) {
        await this.initialize();
      }

      // Perform OCR
      const { data } = await this.worker!.recognize(imageFile);
      const text = data.text;

      // Extract MRZ lines (usually last 2-3 lines of passport)
      const mrzLines = this.extractMRZ(text);
      
      if (mrzLines.length < 2) {
        return {
          success: false,
          confidence: 0,
          error: 'MRZ not detected. Please ensure the passport data page is clearly visible.',
        };
      }

      // Parse MRZ data
      const passportData = this.parseMRZ(mrzLines);
      
      // Validate parsed data
      const isValid = this.validatePassportData(passportData);
      
      return {
        success: isValid,
        data: isValid ? passportData : undefined,
        confidence: data.confidence,
        error: isValid ? undefined : 'Invalid passport data detected',
      };
    } catch (error) {
      return {
        success: false,
        confidence: 0,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  }

  private extractMRZ(text: string): string[] {
    // MRZ lines start with 'P<' or contain specific patterns
    const lines = text.split('\n');
    const mrzLines: string[] = [];

    for (const line of lines) {
      const cleanLine = line.replace(/\s/g, '').toUpperCase();
      
      // MRZ line 1: Starts with P< (Passport)
      if (cleanLine.startsWith('P<') && cleanLine.length >= 44) {
        mrzLines.push(cleanLine);
      }
      // MRZ line 2: Contains passport number pattern
      else if (cleanLine.length >= 44 && /^[A-Z0-9<]+$/.test(cleanLine)) {
        mrzLines.push(cleanLine);
      }
    }

    return mrzLines.slice(0, 2); // Return first 2 valid MRZ lines
  }

  private parseMRZ(mrzLines: string[]): PassportData {
    const line1 = mrzLines[0];
    const line2 = mrzLines[1];

    // Parse Line 1: P<COUNTRY<SURNAME<<NAMES
    const documentType = line1[0] as 'P' | 'ID' | 'V';
    const issuingCountry = line1.substring(2, 5).replace(/</g, '');
    const nameSection = line1.substring(5).replace(/</g, ' ').trim();
    const [surname, ...names] = nameSection.split('  ');
    const fullName = `${names.join(' ')} ${surname}`.trim();

    // Parse Line 2: PASSPORT_NO<NATIONALITY<DOB<SEX<EXPIRY
    const passportNumber = line2.substring(0, 9).replace(/</g, '');
    const nationality = line2.substring(10, 13).replace(/</g, '');
    const dobRaw = line2.substring(13, 19);
    const sex = line2.substring(20, 21) as 'M' | 'F' | 'X';
    const expiryRaw = line2.substring(21, 27);

    // Format dates (YYMMDD → YYYY-MM-DD)
    const dateOfBirth = this.formatMRZDate(dobRaw);
    const expiryDate = this.formatMRZDate(expiryRaw);

    return {
      passportNumber,
      mrzCode: mrzLines.join('\n'),
      fullName,
      dateOfBirth,
      nationality,
      expiryDate,
      documentType,
      issuingCountry,
      sex,
    };
  }

  private formatMRZDate(mrzDate: string): string {
    // MRZ date format: YYMMDD
    const year = parseInt(mrzDate.substring(0, 2));
    const month = mrzDate.substring(2, 4);
    const day = mrzDate.substring(4, 6);

    // Assume years 00-30 are 2000s, 31-99 are 1900s
    const fullYear = year <= 30 ? 2000 + year : 1900 + year;

    return `${fullYear}-${month}-${day}`;
  }

  private validatePassportData(data: PassportData): boolean {
    // Basic validation rules
    if (!data.passportNumber || data.passportNumber.length < 6) return false;
    if (!data.fullName || data.fullName.length < 3) return false;
    if (!data.nationality || data.nationality.length !== 3) return false;
    
    // Check expiry date is in the future
    const expiryDate = new Date(data.expiryDate);
    const today = new Date();
    if (expiryDate < today) return false;

    return true;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * Server-side OCR using Google Vision API (more accurate for production)
 */
export async function scanPassportWithGoogleVision(
  imageBase64: string
): Promise<OCRResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      confidence: 0,
      error: 'Google Vision API key not configured',
    };
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    );

    const result = await response.json();
    const text = result.responses[0]?.textAnnotations[0]?.description || '';

    // Use same MRZ extraction logic
    const scanner = new PassportScanner();
    const mrzLines = scanner['extractMRZ'](text);
    
    if (mrzLines.length < 2) {
      return {
        success: false,
        confidence: 0,
        error: 'MRZ not detected',
      };
    }

    const passportData = scanner['parseMRZ'](mrzLines);
    const isValid = scanner['validatePassportData'](passportData);

    return {
      success: isValid,
      data: isValid ? passportData : undefined,
      confidence: result.responses[0]?.textAnnotations[0]?.confidence || 0.95,
    };
  } catch (error) {
    return {
      success: false,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Google Vision API failed',
    };
  }
}
