'use client';

import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { QrCode, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfileQrCode({ url }: { url: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <QrCode className="h-4 w-4" />
        كود QR
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong relative rounded-4xl p-8"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute left-4 top-4 text-brand-500"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="rounded-3xl bg-white p-4">
                <QRCodeSVG value={url} size={220} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
