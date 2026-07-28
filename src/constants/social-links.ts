import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '@/components/shared/brand-icons';

/**
 * lucide-react ships no brand/logo icons — see brand-icons.tsx, which
 * follows the exact same inline-SVG approach already used by
 * share-button.tsx and google-signin-button.tsx.
 */
export const SOCIAL_LINKS = [
  { label: 'فيسبوك', href: 'https://www.facebook.com/qoulha', icon: FacebookIcon },
  { label: 'إنستجرام', href: 'https://www.instagram.com/qoulha', icon: InstagramIcon },
  {
    label: 'بلّغ عن مشكلة / اقترح ميزة',
    href: 'https://api.whatsapp.com/qr/OHADGUSDLAF2G1',
    icon: WhatsAppIcon,
  },
] as const;
