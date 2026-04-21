import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/format';
import { UserPlus, Users, Eye, Zap, ShieldAlert, Crown } from 'lucide-react';

// Backend roles: admin | bursar | auditor. We label 'auditor' as "Viewer" in the UI
// for consistency with the template's terminology, but the payload uses 'auditor'.
const roleConfig: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  admin: {
    label: 'Admin',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Full access: manage team, providers, subscription, settings, refunds.'
  },
  bursar: {
    label: 'Bursar',
    icon: Zap,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Verify payments, manage students, reconcile. No admin actions.'
  },
  auditor: {
    label: 'Viewer / Auditor',
    icon: Eye,
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Read-only access to dashboard, students, and transactions.'
  },
};

const Team: React.FC = () => {
  const { school, user } = useAuth();
  const { isAdmin } = usePermissions();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'bursar' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (school) load(); /* eslint-disable-line */ }, [school]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await Api.listUsers();
      setMembers(res.users);
    } catch (err: any) {
      toast({ title: 'Could not load team', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await Api.createUser(form);
      toast({ title: 'Team member added', description: `${form.email} can now sign in.` });
      setForm({ fullName: '', email: '', password: '', role: 'bursar' });
      setAddOpen(false);
      load();
    } catch (err: any) {
      toast({ title: 'Could not add member', description: err.message, variant: 'destructive' });
    } finally { setSubmitting(false); }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Admin access required</h2>
          <p className="text-slate-600 mt-2">Only school admins can manage team members.</p>
          <div className="mt-4 text-sm text-slate-500">Your role: <Badge variant="outline" className="capitalize ml-1">{user?.role}</Badge></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team management</h1>
          <p className="text-slate-600 mt-1">Add colleagues and control their access with role-based permissions.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setAddOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add member
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(roleConfig).map(([key, r]) => {
          const count = members.filter(m => m.role === key).length;
          const Icon = r.icon;
          return (
            <Card key={key} className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{r.label}</div>
                  <div className="text-xs text-slate-500">{count} {count === 1 ? 'member' : 'members'}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4" /> Team members
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} active members with access to {school?.name}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Member</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Last login</th>
                <th className="text-left px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading…</td></tr>
              ) : members.map((m) => {
                const isSelf = m.id === user?.id;
                const cfg = roleConfig[m.role] || roleConfig.auditor;
                const RoleIcon = cfg.icon;
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {(m.full_name || m.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                          {m.full_name || '—'}
                          {isSelf && <Badge variant="outline" className="text-xs">You</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{m.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={cfg.color + ' capitalize'}>
                        <RoleIcon className="w-3 h-3 mr-1" />{cfg.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{m.last_login_at ? formatDate(m.last_login_at) : '—'}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(m.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a team member</DialogTitle>
            <DialogDescription>
              They'll be able to sign in to <span className="font-semibold">{school?.name}</span> with the credentials you set below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addMember} className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <Label>Temporary password (min 8)</Label>
              <Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <p className="text-xs text-slate-500 mt-1">Share this securely. The user can change it from Settings after first login.</p>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin"><div className="flex items-center gap-2"><Crown className="w-4 h-4" /> Admin</div></SelectItem>
                  <SelectItem value="bursar"><div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Bursar</div></SelectItem>
                  <SelectItem value="auditor"><div className="flex items-center gap-2"><Eye className="w-4 h-4" /> Auditor (read-only)</div></SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">{roleConfig[form.role]?.desc}</p>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              <UserPlus className="w-4 h-4 mr-2" /> {submitting ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
