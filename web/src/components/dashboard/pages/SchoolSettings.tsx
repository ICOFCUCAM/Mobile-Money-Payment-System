import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Save, Building2, Globe, Webhook, Key, Trash2, Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import TwoFactorCard from '@/components/dashboard/TwoFactorCard';

const SchoolSettings: React.FC = () => {
  const { school, user, refresh, logout } = useAuth();
  const { isAdmin } = usePermissions();

  const [profile, setProfile] = useState({
    name: school?.name || '',
    phone: school?.phone || ''
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  const [rotating, setRotating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = (provider: string) => `${origin}/webhooks/${provider}/${school?.subdomain || '<slug>'}`;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    try {
      await Api.updateSchool({ name: profile.name, phone: profile.phone });
      await refresh();
      toast({ title: 'Profile saved' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Must be at least 8 characters.', variant: 'destructive' });
      return;
    }
    setChangingPw(true);
    try {
      await Api.changePassword(pwForm);
      toast({ title: 'Password updated' });
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast({ title: 'Password change failed', description: err.message, variant: 'destructive' });
    } finally { setChangingPw(false); }
  };

  const rotateKey = async () => {
    if (!confirm('Rotate the school API key? The current key will stop working immediately.')) return;
    setRotating(true);
    try {
      const res = await Api.rotateApiKey();
      setNewApiKey(res.apiKey);
      toast({ title: 'API key rotated', description: 'Save the new key — it is shown only once.' });
    } catch (err: any) {
      toast({ title: 'Rotation failed', description: err.message, variant: 'destructive' });
    } finally { setRotating(false); }
  };

  const deleteSchool = async () => {
    if (deleteConfirm !== school?.subdomain) return;
    setDeleting(true);
    try {
      await Api.deleteSchool();
      toast({ title: 'School deleted', description: 'All tenant data has been removed.' });
      logout();
    } catch (err: any) {
      toast({ title: 'Deletion failed', description: err.message, variant: 'destructive' });
    } finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">School settings</h1>
        <p className="text-slate-600 mt-1">Manage profile, credentials, and tenant lifecycle.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Profile</h2>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <Label>School name</Label>
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={!isAdmin} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={!isAdmin} />
          </div>
          {isAdmin ? (
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save changes'}
            </Button>
          ) : (
            <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Admin-only</p>
          )}
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Tenant</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">School ID</span>
            <span className="font-mono text-xs text-slate-900">{school?.id}</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Slug</span>
            <span className="font-mono text-slate-900">{school?.subdomain}</span>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Plan</span>
            <Badge className="capitalize">{school?.subscription_plan}</Badge>
          </div>
          <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Your role</span>
            <Badge variant="outline" className="capitalize">{user?.role}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Webhook className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">Webhook endpoints</h2>
        </div>
        <p className="text-sm text-slate-600 mb-3">Point your providers at these URLs. They are HMAC-signed against your stored `api_secret` per provider.</p>
        <div className="space-y-2">
          {['MTN', 'ORANGE'].map((p) => (
            <div key={p} className="flex items-center gap-2">
              <Badge variant="outline" className="w-16 justify-center">{p}</Badge>
              <Input readOnly value={webhookUrl(p)} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(webhookUrl(p));
                toast({ title: 'Copied to clipboard' });
              }}>Copy</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">API key</h2>
        </div>
        <p className="text-sm text-slate-600 mb-3">For machine integrations. The plaintext is shown only at creation or rotation; only its SHA-256 hash is stored.</p>
        {isAdmin ? (
          <Button variant="outline" onClick={rotateKey} disabled={rotating}>
            <Key className="w-4 h-4 mr-2" /> {rotating ? 'Rotating…' : 'Rotate API key'}
          </Button>
        ) : (
          <p className="text-xs text-slate-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Admin-only</p>
        )}
        {newApiKey && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-xs font-semibold text-amber-900 mb-1">New API key (shown once)</div>
            <code className="block font-mono text-xs break-all text-amber-900">{newApiKey}</code>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <form onSubmit={changePassword} className="space-y-3">
          <h2 className="font-semibold text-slate-900 mb-2">Change password</h2>
          <div>
            <Label>Current password</Label>
            <Input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div>
            <Label>New password (min 8 chars)</Label>
            <Input type="password" minLength={8} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
          </div>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={changingPw}>
            {changingPw ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>

      {/* Per-user TOTP 2FA. Self-contained state machine — reads status
           from /auth/me on mount, drives enroll / verify / backup-codes /
           disable flows internally, and shows a policy banner for platform
           admins who haven't enrolled yet. */}
      <TwoFactorCard />

      {isAdmin && (
        <Card className="p-6 border-red-200">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger zone</h2>
          <p className="text-sm text-slate-600 mb-4">Permanently delete this school and everything attached (students, transactions, provider configs, users, audit logs).</p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>Delete this school</Button>
        </Card>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {school?.name}?</DialogTitle>
            <DialogDescription>
              This is permanent. Type the school slug <span className="font-mono font-semibold">{school?.subdomain}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={school?.subdomain} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteConfirm !== school?.subdomain || deleting} onClick={deleteSchool}>
              {deleting ? 'Deleting…' : 'Delete forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolSettings;
