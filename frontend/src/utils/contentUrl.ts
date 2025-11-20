/**
 * Helper function to properly construct content URLs for uploaded files
 * Handles both development (with proxy) and production environments
 */
export function getContentUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's already a full URL (http:// or https://), use it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path starting with /uploads
  if (url.startsWith('/uploads/')) {
    // In production, we need to use the full backend URL
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    if (apiUrl.startsWith('http')) {
      // Extract base URL from API URL (remove /api suffix)
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      return `${baseUrl}${url}`;
    }
    
    // In development, the proxy will handle it
    return url;
  }
  
  // Return as is for any other format
  return url;
}
