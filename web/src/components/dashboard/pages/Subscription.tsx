import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Api, type Plan } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle2, Zap, Shield, Crown } from 'lucide-react';

const iconFor = (name: string) => (name === 'basic' ? Zap : name === 'pro' ? Shield : Crown);

const Subscription: React.FC = () => {
  const { school, refresh } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [plansRes, current] = await Promise.all([Api.listPlans(), Api.currentSubscription()]);
      setPlans(plansRes.plans);
      setExpiresAt(current.expiresAt);
    } catch (err: any) {
      toast({ title: 'Could not load plans', description: err.message, variant: 'destructive' });
    }
  };

  const upgrade = async (planName: string) => {
    setSaving(true);
    try {
      await Api.changePlan({ plan: planName, paymentReference: 'manual' });
      toast({ title: 'Plan updated', description: `You're now on the ${planName} plan.` });
      await refresh();
      load();
    } catch (err: any) {
      toast({ title: 'Plan change failed', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
        <p className="text-slate-600 mt-1">Current plan: <span className="font-semibold capitalize">{school?.subscription_plan}</span></p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-blue-100 text-sm">Current plan</div>
            <div className="text-3xl font-bold capitalize mt-1">{school?.subscription_plan}</div>
            <div className="text-blue-100 text-sm mt-2">
              {expiresAt ? `Next billing: ${new Date(expiresAt).toLocaleDateString()}` : 'No end date'}
            </div>
          </div>
          <Crown className="w-16 h-16 text-white/30" />
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const Icon = iconFor(p.id);
          const isCurrent = p.id === school?.subscription_plan;
          const featureList = [
            `Providers: ${p.features.providers.join(', ')}`,
            `Max students: ${p.features.maxStudents == null ? 'Unlimited' : p.features.maxStudents.toLocaleString()}`,
            `Reports: ${p.features.reports ? 'Yes' : 'No'}`,
            `Audit logs: ${p.features.auditLogs ? 'Yes' : 'No'}`,
          ];
          return (
            <Card key={p.id} className={`p-6 ${isCurrent ? 'ring-2 ring-blue-600' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {isCurrent && <Badge className="bg-blue-600">Current</Badge>}
              </div>
              <h3 className="text-xl font-bold text-slate-900 capitalize">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{p.price == null ? 'Custom' : `$${p.price}`}</span>
                {p.price != null && <span className="text-slate-500">/{p.interval}</span>}
              </div>
              <ul className="mt-5 space-y-2">
                {featureList.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-6 ${!isCurrent ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                disabled={isCurrent || saving}
                variant={isCurrent ? 'outline' : 'default'}
                onClick={() => upgrade(p.id)}
              >
                {isCurrent ? 'Current plan' : saving ? 'Updating…' : p.price == null ? 'Contact sales' : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
