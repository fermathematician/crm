/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Importante para o toggle manual
  theme: {
    extend: {
      colors: {
        // Cores da Marca 
        primary: {
          DEFAULT: '#4f46e5', // Indigo 600
          hover: '#4338ca',   // Indigo 700
        },
        // Cores de Fundo (Backgrounds)
        background: {
          light: '#f8fafc', // Slate 50
          dark: '#0f172a',  // Slate 900
        },
        surface: {
          light: '#ffffff', // White
          dark: '#1e293b',  // Slate 800
        },
        // Cores de Texto e Bordas
        text: {
          main: { light: '#0f172a', dark: '#f1f5f9' }, // Slate 900 / Slate 100
          muted: { light: '#64748b', dark: '#94a3b8' }, // Slate 500 / Slate 400
        },
        border: {
          light: '#e2e8f0', // Slate 200
          dark: '#334155',  // Slate 700
        }
      },
    },
  },
  plugins: [],
}