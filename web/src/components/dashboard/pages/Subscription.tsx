import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle2, Zap, Shield, Crown } from 'lucide-react';

const Subscription: React.FC = () => {
  const { school } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('subscription_plans').select('*').then(({ data }: any) => setPlans(data || []));
  }, []);

  const upgrade = async (planName: string) => {
    if (!school) return;
    setLoading(true);
    await supabase.from('schools').update({ subscription_plan: planName }).eq('id', school.id);
    const session = JSON.parse(localStorage.getItem('sps_session') || '{}');
    session.school = { ...session.school, subscription_plan: planName };
    localStorage.setItem('sps_session', JSON.stringify(session));
    toast({ title: 'Plan updated!', description: `You're now on the ${planName} plan.` });
    setLoading(false);
    window.location.reload();
  };

  const iconFor = (name: string) => {
    if (name === 'basic') return Zap;
    if (name === 'pro') return Shield;
    return Crown;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
        <p className="text-slate-600 mt-1">Your current plan: <span className="font-semibold capitalize">{school?.subscription_plan}</span></p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-blue-100 text-sm">Current Plan</div>
            <div className="text-3xl font-bold capitalize mt-1">{school?.subscription_plan}</div>
            <div className="text-blue-100 text-sm mt-2">Next billing: April 21, 2027</div>
          </div>
          <Crown className="w-16 h-16 text-white/30" />
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const Icon = iconFor(p.name);
          const isCurrent = p.name === school?.subscription_plan;
          const features: string[] = p.features || [];
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
                <span className="text-4xl font-bold text-slate-900">${p.price}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <div className="text-sm text-slate-600 mt-2">
                {p.max_students ? `Up to ${p.max_students.toLocaleString()} students` : 'Unlimited students'}
              </div>
              <ul className="mt-5 space-y-2">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full mt-6 ${!isCurrent ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                disabled={isCurrent || loading}
                variant={isCurrent ? 'outline' : 'default'}
                onClick={() => upgrade(p.name)}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
