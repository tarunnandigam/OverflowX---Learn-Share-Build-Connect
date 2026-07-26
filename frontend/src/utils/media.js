/**
 * Resolves media URLs by prepending the API base URL for relative paths.
 * Excludes absolute URLs (e.g. Google OAuth avatars, external links).
 * 
 * @param {string} url - The URL to resolve
 * @returns {string} The fully qualified URL
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  
  // Get API URL from env and extract the base domain URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
  
  // Ensure correct slash joining
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};
