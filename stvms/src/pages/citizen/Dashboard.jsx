import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViolations } from '../../hooks/useViolations';
import { useFines } from '../../hooks/useFines';
import { useVehicles } from '../../hooks/useVehicles';
import { isSandbox, localDb } from '../../config/firebase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CreditCard, FileText, AlertTriangle, CheckCircle, ChevronRight, Car } from 'lucide-react';

const CitizenStat = ({ label, value, sub, icon: Icon, colorClass = 'glass-card-accent' }) => (
  <div className={`glass-card rounded-2xl p-5 shadow-card hover:-translate-y-1 ${colorClass}`}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs text-text-secondary font-display uppercase tracking-wider font-extrabold">{label}</p>
      <Icon className="w-5 h-5 text-text-muted opacity-60 group-hover:opacity-100 transition-opacity" />
    </div>
    <p className="font-display font-extrabold text-2xl text-text-primary tracking-tight">{value}</p>
    <p className="text-xs text-text-muted font-medium mt-1">{sub}</p>
  </div>
);

export const CitizenDashboard = () => {
  const { currentUser } = useAuth();
  const { violations } = useViolations();
  const { fines } = useFines();
  const { vehicles } = useVehicles();
  const navigate = useNavigate();

  const [types] = useState(() => isSandbox ? localDb.get('violation_types') : []);
  const [locations] = useState(() => isSandbox ? localDb.get('locations') : []);

  // Filter data to citizen's vehicles
  const myVehicles = useMemo(() => {
    if (!currentUser?.regNumber) return vehicles;
    return vehicles.filter(v =>
      v.regNumber?.replace(/[^A-Z0-9]/g, '').includes(currentUser.regNumber.replace(/[^A-Z0-9]/g, ''))
    );
  }, [vehicles, currentUser]);

  const myVehicleIds = new Set(myVehicles.map(v => v.id));

  const myViolations = useMemo(() => {
    if (myVehicleIds.size === 0) return violations; // demo: show all
    return violations.filter(v => myVehicleIds.has(v.vehicleId));
  }, [violations, myVehicleIds]);

  const myFines = useMemo(() => {
    const myVioIds = new Set(myViolations.map(v => v.id));
    return fines.filter(f => myVioIds.has(f.violationId));
  }, [fines, myViolations]);

  const unpaidFines = myFines.filter(f => !f.isPaid);
  const paidFines = myFines.filter(f => f.isPaid);
  const totalDue = unpaidFines.reduce((acc, f) => acc + (f.amount || 0), 0);

  // Recent violations
  const recentVios = [...myViolations]
    .sort((a, b) => {
      const toD = x => x instanceof Date ? x : new Date(x);
      return toD(b.violationTime) - toD(a.violationTime);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center gap-4 p-6 glass-card rounded-2xl shadow-card">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-safe/25 to-safe/5 border border-safe/30 flex items-center justify-center shrink-0 shadow-glow-safe">
          <Car className="w-6.5 h-6.5 text-safe" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-primary tracking-wide">
            Welcome, {currentUser?.name || 'Citizen'}
          </h2>
          <p className="text-xs text-text-secondary font-medium mt-1">
            Registered Vehicle: <span className="font-mono font-bold text-text-primary bg-white/5 border border-white/5 px-2 py-0.5 rounded">{currentUser?.regNumber || 'All Vehicles'}</span>
          </p>
        </div>
        {unpaidFines.length > 0 && (
          <div className="ml-auto hidden md:flex items-center gap-2 px-3.5 py-2 bg-primary/10 border border-primary/25 rounded-xl animate-pulse shadow-sm">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">{unpaidFines.length} unpaid fine{unpaidFines.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <CitizenStat label="Total Violations" value={myViolations.length} sub="All time record" icon={FileText} colorClass="glass-card-accent" />
        <CitizenStat label="Pending Fines" value={unpaidFines.length} sub={`${formatCurrency(totalDue)} due`} icon={CreditCard} colorClass={unpaidFines.length > 0 ? 'glass-card-primary' : 'glass-card-accent'} />
        <CitizenStat label="Paid Fines" value={paidFines.length} sub="Successfully cleared" icon={CheckCircle} colorClass="glass-card-safe" />
        <CitizenStat label="Contested" value={myViolations.filter(v => v.status === 'Contested').length} sub="Under arbitration" icon={AlertTriangle} colorClass="glass-card-accent" />
      </div>

      {/* Unpaid Fines Banner */}
      {unpaidFines.length > 0 && (
        <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/25 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-glow-primary">
          <div>
            <p className="font-display font-extrabold text-text-primary mb-1 tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-primary animate-bounce" />
              Outstanding Tickets Found
            </p>
            <p className="text-xs text-text-muted font-medium">
              You have <strong className="text-primary">{unpaidFines.length}</strong> outstanding violations with a total pending balance of <strong className="text-warn">{formatCurrency(totalDue)}</strong>. Settle them to avoid license suspension.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/citizen/fines')} className="shrink-0 font-bold active:scale-95 shadow-glow-primary py-2.5">
            Settle Fines <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white/[0.01]">
          <h3 className="font-display font-extrabold text-sm text-text-primary uppercase tracking-wider">Recent Violations</h3>
          <button
            onClick={() => navigate('/citizen/violations')}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {recentVios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle className="w-12 h-12 text-safe opacity-50 shadow-glow-safe rounded-full" />
            <p className="text-text-secondary text-sm font-semibold tracking-wide">No violations — clean record! 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 bg-black/10">
            {recentVios.map(v => {
              const type = types.find(t => t.id === v.typeId);
              const loc = locations.find(l => l.id === v.locationId);
              const fine = myFines.find(f => f.violationId === v.id);
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate('/citizen/violations')}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${v.status === 'Pending' ? 'bg-warn shadow-[0_0_8px_rgba(245,158,11,0.5)]' : v.status === 'Contested' ? 'bg-accent shadow-[0_0_8px_rgba(10,132,255,0.5)]' : 'bg-safe shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-text-primary truncate tracking-wide">{type?.name || 'Violation'}</p>
                    <p className="text-xs text-text-secondary truncate font-medium mt-0.5">{loc?.name} · {formatDate(v.violationTime)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-sm text-warn">{formatCurrency(fine?.amount || 0)}</p>
                    <div className="mt-1">
                      <Badge variant={v.status === 'Pending' ? 'warn' : v.status === 'Contested' ? 'accent' : 'safe'}>
                        {v.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default CitizenDashboard;
