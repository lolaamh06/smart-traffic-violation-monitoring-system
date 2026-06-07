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

const CitizenStat = ({ label, value, sub, icon: Icon, colorClass }) => (
  <div className={`bg-surface border border-border rounded-lg p-4 ${colorClass}`}>
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-text-secondary font-display uppercase tracking-wider font-semibold">{label}</p>
      <Icon className="w-5 h-5 opacity-60" />
    </div>
    <p className="font-display font-bold text-2xl text-text-primary">{value}</p>
    <p className="text-xs text-text-muted mt-0.5">{sub}</p>
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
      <div className="flex items-center gap-4 p-5 bg-surface border border-border rounded-lg shadow-card">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
          <Car className="w-7 h-7 text-accent" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">
            Welcome, {currentUser?.name || 'Citizen'}
          </h2>
          <p className="text-sm text-text-secondary">
            Vehicle: <span className="font-mono font-bold text-text-primary">{currentUser?.regNumber || 'All Vehicles'}</span>
          </p>
        </div>
        {unpaidFines.length > 0 && (
          <div className="ml-auto flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary">{unpaidFines.length} unpaid fine{unpaidFines.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CitizenStat label="Total Violations" value={myViolations.length} sub="All time" icon={FileText} colorClass="" />
        <CitizenStat label="Pending Fines" value={unpaidFines.length} sub={`${formatCurrency(totalDue)} due`} icon={CreditCard} colorClass="" />
        <CitizenStat label="Paid Fines" value={paidFines.length} sub="Cleared" icon={CheckCircle} colorClass="" />
        <CitizenStat label="Contested" value={myViolations.filter(v => v.status === 'Contested').length} sub="Under review" icon={AlertTriangle} colorClass="" />
      </div>

      {/* Unpaid Fines Banner */}
      {unpaidFines.length > 0 && (
        <div className="p-5 bg-primary/5 border border-primary/30 rounded-lg flex items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-text-primary mb-0.5">⚠️ Outstanding Fines</p>
            <p className="text-sm text-text-secondary">
              You have <strong className="text-primary">{unpaidFines.length}</strong> unpaid fines totalling <strong className="text-warn">{formatCurrency(totalDue)}</strong>
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/citizen/fines')} className="shrink-0">
            Pay Now <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-bold text-sm text-text-primary">Recent Violations</h3>
          <button
            onClick={() => navigate('/citizen/violations')}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {recentVios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle className="w-12 h-12 text-safe opacity-50" />
            <p className="text-text-secondary text-sm font-medium">No violations — clean record! 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentVios.map(v => {
              const type = types.find(t => t.id === v.typeId);
              const loc = locations.find(l => l.id === v.locationId);
              const fine = myFines.find(f => f.violationId === v.id);
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-2/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/citizen/violations')}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${v.status === 'Pending' ? 'bg-warn' : v.status === 'Contested' ? 'bg-accent' : 'bg-safe'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-text-primary truncate">{type?.name || 'Violation'}</p>
                    <p className="text-xs text-text-secondary truncate">{loc?.name} · {formatDate(v.violationTime)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-sm text-warn">{formatCurrency(fine?.amount || 0)}</p>
                    <Badge variant={v.status === 'Pending' ? 'warn' : v.status === 'Contested' ? 'accent' : 'safe'} className="text-xs">
                      {v.status}
                    </Badge>
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
