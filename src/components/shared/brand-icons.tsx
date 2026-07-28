/**
 * Simplified inline brand glyphs — lucide-react ships no brand/logo icons,
 * so this follows the exact same approach already used elsewhere
 * (FacebookIcon/WhatsAppIcon in share-button.tsx, GoogleIcon in
 * google-signin-button.tsx): a small inline SVG, no extra icon package.
 * Centralized here so it's defined once instead of per-component.
 */
export function FacebookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.9h2.54V9.86c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94z" />
    </svg>
  );
}

export function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedinIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.77-2 4.03 0 4.78 2.6 4.78 6V21H17.6v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.45-2.16 2.96V21H9z" />
    </svg>
  );
}

export function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.3 14.1c-.22.63-1.28 1.2-1.77 1.24-.45.04-.9.2-3.06-.64-2.59-1.02-4.26-3.68-4.39-3.86-.13-.18-1.05-1.4-1.05-2.67 0-1.27.67-1.89.9-2.15.22-.26.5-.32.66-.32.17 0 .33 0 .48.01.15.01.36-.06.56.43.22.53.73 1.83.8 1.96.06.13.1.28.02.46-.09.18-.13.29-.26.44-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.26.68 1.12 1.46 1.82 1 .9 1.85 1.18 2.11 1.31.26.13.41.11.56-.07.15-.17.63-.73.8-.98.17-.26.34-.21.56-.13.22.09 1.42.67 1.67.79.24.13.4.19.46.29.06.11.06.61-.16 1.2z" />
    </svg>
  );
}
