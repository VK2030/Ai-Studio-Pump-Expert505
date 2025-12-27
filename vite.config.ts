import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Загружаем все переменные, включая те, что без префикса VITE_ (благодаря третьему аргументу '')
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // ИСПРАВЛЕНИЕ: Мы определяем весь объект process.env целиком.
      // Это предотвращает ошибку "process is not defined".
      'process.env': JSON.stringify({
        // Прокидываем нужные ключи внутрь
        GEMINI_API_KEY: env.GEMINI_API_KEY,
        API_KEY: env.GEMINI_API_KEY, // дублируем на всякий случай
        NODE_ENV: mode, // полезно для многих библиотек
      }),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // Обычно алиас ведет в src, но если у вас файлы в корне, оставьте '.'
      },
    },
  };
});
