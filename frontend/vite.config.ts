import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Redirect react-native imports to react-native-web
            'react-native': 'react-native-web',
        },
        // Also support .web.tsx and .web.ts files if needed
        extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
    },
})