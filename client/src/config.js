// In production (Vite build), use relative path (proxy or same origin)
// In development, use specific URL
export const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
