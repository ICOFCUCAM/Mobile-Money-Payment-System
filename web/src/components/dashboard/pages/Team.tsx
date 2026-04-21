import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@/lib/format';
import {
  UserPlus, Mail, Trash2, Copy, RotateCw, Users, Eye, Zap,
  ShieldAlert, CheckCircle2, Clock, XCircle, Crown, AlertCircle
} from 'lucide-react';

const roleConfig: Record<string, { icon: any; color: string; desc: string }> = {
  admin: {
    icon: Crown,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Full access: manage team, providers, subscription, and settings.'
  },
  bursar: {
    icon: Zap,
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    desc: 'Can verify payments and view students/transactions. No admin actions.'
  },
  viewer: {
    icon: Eye,
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Read-only access to dashboard, students, and transactions.'
  },
};

const Team: React.FC = () => {
  const { school, user } = useAuth();
  const { isAdmin } = usePermissions();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'bursar' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (school) load(); }, [school]);

  const load = async () => {
    if (!school) return;
    setLoading(true);
    const [mRes, iRes] = await Promise.all([
      supabase.from('school_users').select('*').eq('school_id', school.id).order('created_at'),
      supabase.from('school_invites').select('*').eq('school_id', school.id).order('invited_at', { ascending: false })
    ]);
    setMembers(mRes.data || []);
    setInvites(iRes.data || []);
    setLoading(false);
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user) return;
    setSubmitting(true);

    const existingMember = members.find(m => m.email.toLowerCase() === inviteForm.email.toLowerCase());
    if (existingMember) {
      toast({ title: 'Already a member', description: `${inviteForm.email} is already on your team.`, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const existingInvite = invites.find(i => i.email.toLowerCase() === inviteForm.email.toLowerCase() && i.status === 'pending');
    if (existingInvite) {
      toast({ title: 'Invite already sent', description: `A pending invite already exists for ${inviteForm.email}.`, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('school_invites').insert({
      school_id: school.id,
      email: inviteForm.email.toLowerCase(),
      role: inviteForm.role,
      invited_by_email: user.email,
      status: 'pending'
    });

    setSubmitting(false);
    if (error) {
      toast({ title: 'Failed to send invite', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Invitation sent!', description: `${inviteForm.email} has been invited as ${inviteForm.role}.` });
      setInviteForm({ email: '', role: 'bursar' });
      setInviteOpen(false);
      load();
    }
  };

  const cancelInvite = async (id: string) => {
    await supabase.from('school_invites').update({ status: 'cancelled' }).eq('id', id);
    toast({ title: 'Invite cancelled' });
    load();
  };

  const resendInvite = async (inv: any) => {
    const newToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await supabase.from('school_invites').update({
      invite_token: newToken,
      expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      invited_at: new Date().toISOString()
    }).eq('id', inv.id);
    toast({ title: 'Invite resent', description: `A fresh invitation link was generated for ${inv.email}.` });
    load();
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Invite link copied!' });
  };

  const removeMember = async (member: any) => {
    if (member.id === user?.id) {
      toast({ title: 'Cannot remove yourself', variant: 'destructive' });
      return;
    }
    if (!confirm(`Remove ${member.full_name} from the team?`)) return;
    await supabase.from('school_users').delete().eq('id', member.id);
    toast({ title: 'Team member removed' });
    load();
  };

  const changeRole = async (member: any, newRole: string) => {
    if (member.id === user?.id) {
      toast({ title: 'Cannot change your own role', variant: 'destructive' });
      return;
    }
    await supabase.from('school_users').update({ role: newRole }).eq('id', member.id);
    toast({ title: 'Role updated', description: `${member.full_name} is now ${newRole}.` });
    load();
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Card className="p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900">Admin access required</h2>
          <p className="text-slate-600 mt-2">Only school admins can manage team members and invitations.</p>
          <div className="mt-4 text-sm text-slate-500">Your role: <Badge variant="outline" className="capitalize ml-1">{user?.role}</Badge></div>
        </Card>
      </div>
    );
  }

  const pendingInvites = invites.filter(i => i.status === 'pending');
  const historyInvites = invites.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-slate-600 mt-1">Invite colleagues and control their access with role-based permissions.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
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
                  <div className="font-semibold text-slate-900 capitalize">{key}</div>
                  <div className="text-xs text-slate-500">{count} {count === 1 ? 'member' : 'members'}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4" /> Team Members
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{members.length} active members with access to {school?.name}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Member</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : members.map((m) => {
                const isSelf = m.id === user?.id;
                const RoleIcon = roleConfig[m.role]?.icon || Eye;
                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {m.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {m.full_name}
                            {isSelf && <Badge variant="outline" className="text-xs">You</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{m.email}</td>
                    <td className="px-5 py-3">
                      {isSelf ? (
                        <Badge variant="outline" className={roleConfig[m.role]?.color + ' capitalize'}>
                          <RoleIcon className="w-3 h-3 mr-1" />{m.role}
                        </Badge>
                      ) : (
                        <Select value={m.role} onValueChange={(v) => changeRole(m, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="bursar">Bursar</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(m.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      {!isSelf && (
                        <Button variant="ghost" size="icon" onClick={() => removeMember(m)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Pending Invitations
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {pendingInvites.length} awaiting acceptance
            </p>
          </div>
        </div>
        {pendingInvites.length === 0 ? (
          <div className="p-10 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <div className="text-slate-600 font-medium">No pending invitations</div>
            <div className="text-xs text-slate-500 mt-1">Click "Invite Member" above to get started.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Invited By</th>
                  <th className="text-left px-5 py-3">Sent</th>
                  <th className="text-left px-5 py-3">Expires</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingInvites.map((inv) => {
                  const expired = new Date(inv.expires_at) < new Date();
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{inv.email}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={roleConfig[inv.role]?.color + ' capitalize'}>
                          {inv.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{inv.invited_by_email}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(inv.invited_at)}</td>
                      <td className="px-5 py-3 text-xs">
                        {expired ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="w-3 h-3 mr-1" /> Expired
                          </Badge>
                        ) : (
                          <span className="text-slate-600">{formatDate(inv.expires_at)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyInviteLink(inv.invite_token)} title="Copy invite link">
                            <Copy className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => resendInvite(inv)} title="Resend / refresh">
                            <RotateCw className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => cancelInvite(inv.id)} title="Cancel invite">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {historyInvites.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Invitation History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {historyInvites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-900">{inv.email}</td>
                    <td className="px-5 py-3 capitalize text-slate-700">{inv.role}</td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={
                        inv.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'cancelled' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }>
                        {inv.status === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {inv.status === 'cancelled' && <XCircle className="w-3 h-3 mr-1" />}
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{formatDate(inv.accepted_at || inv.invited_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Team Member</DialogTitle>
            <DialogDescription>
              They'll receive an email with a link to join <span className="font-semibold">{school?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="colleague@school.edu"
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2"><Crown className="w-4 h-4" /> Admin — full access</div>
                  </SelectItem>
                  <SelectItem value="bursar">
                    <div className="flex items-center gap-2"><Zap className="w-4 h-4" /> Bursar — verify payments</div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2"><Eye className="w-4 h-4" /> Viewer — read-only</div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">{roleConfig[inviteForm.role]?.desc}</p>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
              <Mail className="w-4 h-4 mr-2" /> {submitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Team;
