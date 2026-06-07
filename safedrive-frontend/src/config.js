// Backend adresi. Yerelde varsayılan localhost:5000; deploy'da Vercel'de
// VITE_API_URL ortam değişkeni ile production backend adresi verilir.
export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';
