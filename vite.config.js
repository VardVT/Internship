import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' generates relative asset paths so the build works when hosted
// at https://<user>.github.io/<repo>/ without needing to hardcode the repo name.
export default defineConfig({
  plugins: [react()],
  base: './',
})
