import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Save, Building2, Globe, Webhook } from 'lucide-react';

const SchoolSettings: React.FC = () => {
  const { school, user } = useAuth();
  const [form, setForm] = useState({
    name: school?.name || '',
    email: school?.email || '',
    phone: school?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    await supabase.from('schools').update(form).eq('id', school.id);
    const session = JSON.parse(localStorage.getItem('sps_session') || '{}');
    session.school = { ...session.school, ...form };
    localStorage.setItem('sps_session', JSON.stringify(session));
    toast({ title: 'Settings saved' });
    setSaving(false);
  };

  const webhookUrl = `https://api.schoolpay.app/v1/webhooks/${school?.id}`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">School Settings</h1>
        <p className="text-slate-600 mt-1">Manage your school's profile and integration details.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">School Profile</h2>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label>School Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Admin Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Tenant Details</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">School ID</span>
            <span className="font-mono text-slate-900">{school?.id}</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Subdomain</span>
            <span className="font-mono text-slate-900">{school?.subdomain}.schoolpay.app</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Plan</span>
            <Badge className="capitalize">{school?.subscription_plan}</Badge>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Your Role</span>
            <Badge variant="outline" className="capitalize">{user?.role}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Webhook className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Webhook Endpoint</h2>
        </div>
        <p className="text-sm text-slate-600 mb-3">Configure your mobile money providers to send notifications to this URL. Our system will auto-route and credit the correct student.</p>
        <div className="flex items-center gap-2">
          <Input readOnly value={webhookUrl} className="font-mono text-sm" />
          <Button variant="outline" onClick={() => {
            navigator.clipboard.writeText(webhookUrl);
            toast({ title: 'Copied to clipboard' });
          }}>Copy</Button>
        </div>
      </Card>
    </div>
  );
};

export default SchoolSettings;
