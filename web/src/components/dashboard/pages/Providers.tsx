import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Api, type BackendPaymentConfig } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { CreditCard, Settings, Plus, CheckCircle2, Lock } from 'lucide-react';

const providersCatalog = [
  { id: 'MTN', name: 'MTN Mobile Money', color: 'from-yellow-400 to-yellow-600', desc: 'Accept MTN MoMo payments across 17 African countries.' },
  { id: 'ORANGE', name: 'Orange Money', color: 'from-orange-400 to-orange-600', desc: 'Orange Money integration for West & Central Africa.' },
];

const Providers: React.FC = () => {
  const { school } = useAuth();
  const [configs, setConfigs] = useState<BackendPaymentConfig[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({ api_key: '', api_secret: '', base_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (school) load(); /* eslint-disable-line */ }, [school]);

  const load = async () => {
    try {
      const res = await Api.listConfigs();
      setConfigs(res.configs);
    } catch (err: any) {
      toast({ title: 'Could not load providers', description: err.message, variant: 'destructive' });
    }
  };

  const getConfig = (pid: string) => configs.find(c => c.provider === pid);

  const openEdit = (provider: typeof providersCatalog[number]) => {
    setEditing(provider);
    // Note: api_key/api_secret are not returned by the backend (they're encrypted
    // at rest). Fresh fields on every open.
    setForm({ api_key: '', api_secret: '', base_url: '' });
    setEditOpen(true);
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await Api.upsertConfig({
        provider: editing.id,
        api_key: form.api_key,
        api_secret: form.api_secret,
        ...(form.base_url ? { base_url: form.base_url } : {})
      });
      toast({ title: 'Provider configured', description: `${editing.name} is now active. Credentials are encrypted with AES-256-GCM.` });
      setEditOpen(false);
      load();
    } catch (err: any) {
      toast({ title: 'Could not save', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const toggleActive = async (pid: string, active: boolean) => {
    const c = getConfig(pid);
    if (!c) return;
    // We don't have the raw creds in-memory, so toggling requires a re-upsert
    // with a placeholder. For now the backend's is_active flag is only set on
    // upsert — we surface this in a toast and skip until a dedicated endpoint.
    toast({
      title: active ? 'Re-enable via Configure' : 'Disable via Configure',
      description: 'Toggling on this page requires re-entering the credentials. A dedicated enable/disable endpoint is planned.'
    });
    void pid; void c;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Providers</h1>
        <p className="text-slate-600 mt-1">Configure your mobile-money accounts. Credentials are encrypted at rest with AES-256-GCM.</p>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-blue-900">Security notice</div>
            <div className="text-blue-800 mt-1">Provider API keys are encrypted before storage. We never return the plaintext to the client; only whether credentials are set.</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {providersCatalog.map((p) => {
          const config = getConfig(p.id);
          const configured = !!config;
          return (
            <Card key={p.id} className="p-6">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900">{p.name}</h3>
                {configured && (
                  <Badge className={config.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600'}>
                    {config.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-4">{p.desc}</p>

              {configured && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Credentials</span><span className="font-mono">{config.has_credentials ? 'set' : 'missing'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Base URL</span><span className="font-mono">{config.base_url || 'default'}</span></div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                  {configured ? <><Settings className="w-4 h-4 mr-1" /> Configure</> : <><Plus className="w-4 h-4 mr-1" /> Set up</>}
                </Button>
                {configured && (
                  <Switch checked={config.is_active} onCheckedChange={(v) => toggleActive(p.id, v)} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {editing?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveConfig} className="space-y-3">
            <div>
              <Label>API key</Label>
              <Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="Your API key" required />
            </div>
            <div>
              <Label>API secret</Label>
              <Input type="password" value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} placeholder="Your API secret" required />
            </div>
            <div>
              <Label>Base URL (optional)</Label>
              <Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="defaults to sandbox" />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save configuration'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Providers;
