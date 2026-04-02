import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dynamically generates and injects a PWA manifest based on the company's branding.
 * This makes the app installable with the company's name and logo.
 */
export function usePwaManifest() {
  const { company } = useAuth();

  useEffect(() => {
    if (!company) return;

    const generateManifest = async () => {
      // Fetch company theme for display name
      const { data: theme } = await supabase
        .from('company_themes')
        .select('company_display_name')
        .eq('company_id', company.id)
        .maybeSingle();

      const appName = theme?.company_display_name || company.name;
      const iconUrl = company.logo_url || '/placeholder.svg';

      const manifest = {
        name: appName,
        short_name: appName.substring(0, 12),
        description: `Sistema ${appName}`,
        start_url: '/empresa/dashboard',
        display: 'standalone' as const,
        background_color: '#080808',
        theme_color: '#080808',
        icons: [
          { src: iconUrl, sizes: '192x192', type: 'image/png' },
          { src: iconUrl, sizes: '512x512', type: 'image/png' },
        ],
      };

      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Remove existing manifest link
      const existing = document.querySelector('link[rel="manifest"]');
      if (existing) existing.remove();

      // Inject new manifest
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = url;
      document.head.appendChild(link);

      // Update theme-color meta
      let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = '#080808';

      // Update apple-touch-icon
      let apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
      }
      apple.href = iconUrl;

      return () => URL.revokeObjectURL(url);
    };

    generateManifest();
  }, [company]);
}
