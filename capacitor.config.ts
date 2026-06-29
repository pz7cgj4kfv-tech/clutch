import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.clutch.lausanne',
  appName: 'Clutch',
  webDir: 'out',
  // 🎨 Fond de la WebView native = prune (pas de flash blanc natif avant la 1re peinture). Cf. globals.css.
  backgroundColor: '#2a1020',
  ios: { backgroundColor: '#2a1020' },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
