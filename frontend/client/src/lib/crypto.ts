/**
 * Computes a standard SHA-256 hexadecimal checksum for a browser File or Blob
 * using the native browser Web Crypto API.
 */
export async function computeFileSHA256(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return computeBufferSHA256(buffer);
}

/**
 * Computes a standard SHA-256 hexadecimal checksum for an ArrayBuffer.
 */
export async function computeBufferSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Computes a standard SHA-256 hexadecimal checksum for a string.
 */
export async function computeStringSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(text);
  return computeBufferSHA256(buffer.buffer);
}

/**
 * Converts a File to a Base64 string for transmission over JSON/tRPC.
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip off the data URL prefix (e.g. "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
