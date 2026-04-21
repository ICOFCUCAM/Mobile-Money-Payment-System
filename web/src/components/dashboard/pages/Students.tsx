import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Download, UserPlus, Trash2, Lock } from 'lucide-react';


const Students: React.FC = () => {
  const { school } = useAuth();
  const { can } = usePermissions();
  const canManage = can('manage_students');

  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    student_code: '', full_name: '', grade: '', parent_phone: '', parent_email: '', fee_amount: '0'
  });

  useEffect(() => { if (school) load(); }, [school]);

  const load = async () => {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase.from('students').select('*').eq('school_id', school.id).order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    const { error } = await supabase.from('students').insert({
      school_id: school.id,
      student_code: form.student_code,
      full_name: form.full_name,
      grade: form.grade,
      parent_phone: form.parent_phone,
      parent_email: form.parent_email,
      fee_amount: Number(form.fee_amount) || 0,
      balance: 0
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Student added' });
      setAddOpen(false);
      setForm({ student_code: '', full_name: '', grade: '', parent_phone: '', parent_email: '', fee_amount: '0' });
      load();
    }
  };

  const removeStudent = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    await supabase.from('students').delete().eq('id', id);
    toast({ title: 'Student deleted' });
    load();
  };

  const exportCSV = () => {
    const header = 'Code,Name,Grade,Parent Phone,Fee,Balance\n';
    const rows = filtered.map(s => `${s.student_code},${s.full_name},${s.grade || ''},${s.parent_phone || ''},${s.fee_amount},${s.balance}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
  };

  const filtered = students.filter(s =>
    !search ||
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code.toLowerCase().includes(search.toLowerCase()) ||
    (s.grade || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-600 mt-1">
            {canManage ? "Manage your school's student roster and fee balances." : 'View-only access to the student roster.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          {canManage ? (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setAddOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          ) : (
            <Button variant="outline" disabled title="Admin access required">
              <Lock className="w-4 h-4 mr-2" /> Add Student
            </Button>
          )}
        </div>
      </div>


      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, code, grade..." className="border-none shadow-none focus-visible:ring-0" />
          <Badge variant="outline">{filtered.length} students</Badge>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Grade</th>
                <th className="text-left px-5 py-3">Parent Phone</th>
                <th className="text-right px-5 py-3">Fee</th>
                <th className="text-right px-5 py-3">Paid</th>
                <th className="text-right px-5 py-3">Balance Due</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500">No students found</td></tr>
              ) : filtered.map((s) => {
                const due = Number(s.fee_amount) - Number(s.balance);
                const paid = due <= 0;
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                          {s.full_name.charAt(0)}
                        </div>
                        <div className="font-medium text-slate-900">{s.full_name}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.student_code}</td>
                    <td className="px-5 py-3 text-slate-700">{s.grade || '—'}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{s.parent_phone || '—'}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(Number(s.fee_amount))}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">{formatCurrency(Number(s.balance))}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(Math.max(0, due))}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant="outline" className={paid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                        {paid ? 'Paid' : 'Owing'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {canManage && (
                        <Button variant="ghost" size="icon" onClick={() => removeStudent(s.id)}>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <form onSubmit={addStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Student Code</Label>
                <Input value={form.student_code} onChange={(e) => setForm({ ...form, student_code: e.target.value })} placeholder="STU016" required />
              </div>
              <div>
                <Label>Grade</Label>
                <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Grade 10" />
              </div>
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Parent Phone</Label>
                <Input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} placeholder="+237..." />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input type="email" value={form.parent_email} onChange={(e) => setForm({ ...form, parent_email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Fee Amount (XAF)</Label>
              <Input type="number" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: e.target.value })} />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
