import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Api, type BackendStudent } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Download, UserPlus, Trash2, Lock } from 'lucide-react';

const Students: React.FC = () => {
  const { school } = useAuth();
  const { can } = usePermissions();
  const canManage = can('manage_students');

  const [students, setStudents] = useState<BackendStudent[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ studentCode: '', fullName: '', className: '', phone: '' });

  // Debounce the search to keep the backend from being hammered on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { if (school) load(); /* eslint-disable-line */ }, [school, debouncedSearch]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await Api.listStudents({ q: debouncedSearch || undefined, limit: 200 });
      setStudents(res.students);
    } catch (err: any) {
      toast({ title: 'Could not load students', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Api.createStudent(form);
      toast({ title: 'Student added' });
      setAddOpen(false);
      setForm({ studentCode: '', fullName: '', className: '', phone: '' });
      load();
    } catch (err: any) {
      toast({ title: 'Could not add student', description: err.message, variant: 'destructive' });
    }
  };

  const removeStudent = async (id: string) => {
    if (!confirm('Delete this student?')) return;
    try {
      await Api.deleteStudent(id);
      toast({ title: 'Student deleted' });
      load();
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  // Client-side CSV for the current page of students. For a full tenant export
  // hit /api/payments/export.csv or /api/students when we add that endpoint.
  const exportCSV = () => {
    const header = 'Code,Name,Class,Phone,Balance,Currency\n';
    const rows = students.map(s => `${s.student_code},${s.full_name},${s.class_name || ''},${s.phone || ''},${s.balance},${s.currency}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${school?.subdomain || 'export'}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-600 mt-1">
            {canManage ? "Manage your school's student roster and balances." : 'View-only access to the student roster.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          {canManage ? (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setAddOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" /> Add Student
            </Button>
          ) : (
            <Button variant="outline" disabled title="Admin / bursar access required">
              <Lock className="w-4 h-4 mr-2" /> Add Student
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code…" className="border-none shadow-none focus-visible:ring-0" />
          <Badge variant="outline">{students.length} students</Badge>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Student</th>
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Class</th>
                <th className="text-left px-5 py-3">Phone</th>
                <th className="text-right px-5 py-3">Balance</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                  {debouncedSearch ? `No students match "${debouncedSearch}"` : 'No students yet'}
                </td></tr>
              ) : students.map((s) => (
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
                  <td className="px-5 py-3 text-slate-700">{s.class_name || '—'}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{s.phone || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">{formatCurrency(Number(s.balance), s.currency)}</td>
                  <td className="px-5 py-3">
                    {canManage && (
                      <Button variant="ghost" size="icon" onClick={() => removeStudent(s.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
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
                <Input value={form.studentCode} onChange={(e) => setForm({ ...form, studentCode: e.target.value })} placeholder="STU-001" required />
              </div>
              <div>
                <Label>Class</Label>
                <Input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="Grade 10" />
              </div>
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+237..." />
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
