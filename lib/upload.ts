import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './constants';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Validate file
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB 이하여야 합니다`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다',
    };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9가-힣]/g, '_');

  return `${timestamp}_${random}_${safeName}${ext}`;
}

/**
 * Upload file to server
 */
export async function uploadFile(file: File): Promise<{
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const fileName = generateFileName(file.name);
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    await writeFile(filePath, buffer);

    // Return relative path (for storing in DB)
    const relativePath = `/uploads/${fileName}`;

    return {
      success: true,
      filePath: relativePath,
      fileName: file.name,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: '파일 업로드 중 오류가 발생했습니다',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files: File[]): Promise<{
  success: boolean;
  uploads?: Array<{ filePath: string; fileName: string }>;
  errors?: string[];
}> {
  const results = await Promise.all(files.map((file) => uploadFile(file)));

  const uploads = results
    .filter((r) => r.success && r.filePath && r.fileName)
    .map((r) => ({ filePath: r.filePath!, fileName: r.fileName! }));

  const errors = results.filter((r) => !r.success).map((r) => r.error!);

  return {
    success: errors.length === 0,
    uploads,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
