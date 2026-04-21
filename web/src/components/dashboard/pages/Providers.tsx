import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { CreditCard, Settings, Plus, CheckCircle2, Lock } from 'lucide-react';

const providersCatalog = [
  { id: 'MTN', name: 'MTN Mobile Money', color: 'from-yellow-400 to-yellow-600', desc: 'Accept MTN MoMo payments across 17 African countries.' },
  { id: 'ORANGE', name: 'Orange Money', color: 'from-orange-400 to-orange-600', desc: 'Orange Money integration for West & Central Africa.' },
  { id: 'AIRTEL', name: 'Airtel Money', color: 'from-red-400 to-red-600', desc: 'Airtel Money for East & Southern Africa markets.' },
];

const Providers: React.FC = () => {
  const { school } = useAuth();
  const [configs, setConfigs] = useState<any[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ api_key: '', api_secret: '', merchant_code: '', base_url: '' });

  useEffect(() => { if (school) load(); }, [school]);

  const load = async () => {
    if (!school) return;
    const { data } = await supabase.from('payment_configs').select('*').eq('school_id', school.id);
    setConfigs(data || []);
  };

  const getConfig = (pid: string) => configs.find(c => c.provider === pid);

  const openEdit = (provider: any) => {
    const existing = getConfig(provider.id);
    setEditing(provider);
    setForm({
      api_key: existing?.api_key || '',
      api_secret: existing?.api_secret || '',
      merchant_code: existing?.merchant_code || '',
      base_url: existing?.base_url || ''
    });
    setEditOpen(true);
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !editing) return;
    const existing = getConfig(editing.id);
    if (existing) {
      await supabase.from('payment_configs').update({ ...form, is_active: true }).eq('id', existing.id);
    } else {
      await supabase.from('payment_configs').insert({
        school_id: school.id, provider: editing.id, ...form, is_active: true
      });
    }
    toast({ title: 'Provider configured', description: `${editing.name} is now active.` });
    setEditOpen(false);
    load();
  };

  const toggleActive = async (pid: string, active: boolean) => {
    const c = getConfig(pid);
    if (!c) return;
    await supabase.from('payment_configs').update({ is_active: active }).eq('id', c.id);
    toast({ title: active ? 'Provider enabled' : 'Provider disabled' });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Providers</h1>
        <p className="text-slate-600 mt-1">Configure your mobile money accounts. API keys are encrypted at rest.</p>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-blue-900">Security Notice</div>
            <div className="text-blue-800 mt-1">All API keys are encrypted using AES-256 before storage. Never share your credentials publicly.</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
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
                  <div className="flex justify-between"><span className="text-slate-500">Merchant</span><span className="font-mono">{config.merchant_code || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">API Key</span><span className="font-mono">{config.api_key ? '••••' + config.api_key.slice(-4) : 'not set'}</span></div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                  {configured ? <><Settings className="w-4 h-4 mr-1" /> Configure</> : <><Plus className="w-4 h-4 mr-1" /> Set Up</>}
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
              <Label>Merchant Code</Label>
              <Input value={form.merchant_code} onChange={(e) => setForm({ ...form, merchant_code: e.target.value })} placeholder="MTN-RS-001" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="Your API key" />
            </div>
            <div>
              <Label>API Secret</Label>
              <Input type="password" value={form.api_secret} onChange={(e) => setForm({ ...form, api_secret: e.target.value })} placeholder="Your API secret" />
            </div>
            <div>
              <Label>Base URL (optional)</Label>
              <Input value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.mtn.com/..." />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Save Configuration
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Providers;
