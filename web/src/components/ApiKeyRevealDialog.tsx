import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Copy, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * One-time API key reveal, mounted at the app root so it survives the
 * guest→authenticated auth-state flip that happens right after register().
 *
 * Reads `justIssuedApiKey` from AuthContext. The AuthContext sets it inside
 * register(); we render the modal, the user copies the key, and dismissing
 * calls `clearJustIssuedApiKey()` to null it out.
 */
export const ApiKeyRevealDialog: React.FC = () => {
  const { justIssuedApiKey, clearJustIssuedApiKey } = useAuth();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!justIssuedApiKey) return;
    navigator.clipboard.writeText(justIssuedApiKey).then(() => {
      setCopied(true);
      toast({ title: 'API key copied' });
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const dismiss = () => {
    clearJustIssuedApiKey();
    toast({ title: 'Welcome to SchoolPay' });
    setCopied(false);
  };

  return (
    <Dialog open={!!justIssuedApiKey} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            School created · Save your API key
          </DialogTitle>
          <DialogDescription className="pt-2">
            Use this key for server-to-server integration (REST API, webhooks, widget.js).
            <b className="text-red-600"> This is the only time we'll show it.</b> If you lose
            it, rotate a fresh key from <span className="underline">Settings → API keys</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[13px] text-amber-900">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            Store this somewhere safe (password manager, CI secret, your backend's env file).
            Anyone with this key can verify payments on behalf of your school.
          </div>
        </div>

        <div className="mt-3 relative">
          <div className="p-4 pr-16 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[13px] break-all leading-relaxed">
            {justIssuedApiKey}
          </div>
          <button
            onClick={copy}
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/15"
            aria-label="Copy API key"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <Button onClick={dismiss} className="w-full mt-4 bg-navy hover:bg-navy-800 text-white font-semibold">
          I've saved it — continue
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyRevealDialog;
