import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViolations } from '../../hooks/useViolations';
import { useFines } from '../../hooks/useFines';
import { useVehicles } from '../../hooks/useVehicles';
import { isSandbox, localDb } from '../../config/firebase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FileX, ChevronRight, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export const MyViolations = () => {
  const { currentUser } = useAuth();
  const { violations, loading } = useViolations();
  const { fines } = useFines();
  const { vehicles } = useVehicles();
  const navigate = useNavigate();

  const [types] = useState(() => isSandbox ? localDb.get('violation_types') : []);
  const [locations] = useState(() => isSandbox ? localDb.get('locations') : []);
  const [filterStatus, setFilterStatus] = useState('');

  // My vehicles filtered by reg number
  const myVehicleIds = useMemo(() => {
    if (!currentUser?.regNumber) return new Set(vehicles.map(v => v.id));
    const reg = currentUser.regNumber.replace(/[^A-Z0-9]/g, '');
    return new Set(
      vehicles
        .filter(v => v.regNumber?.replace(/[^A-Z0-9]/g, '').includes(reg))
        .map(v => v.id)
    );
  }, [vehicles, currentUser]);

  const myViolations = useMemo(() => {
    let vios = myVehicleIds.size === 0
      ? violations
      : violations.filter(v => myVehicleIds.has(v.vehicleId));
    if (filterStatus) vios = vios.filter(v => v.status === filterStatus);
    return [...vios].sort((a, b) => {
      const toD = x => x instanceof Date ? x : new Date(x);
      return toD(b.violationTime) - toD(a.violationTime);
    });
  }, [violations, myVehicleIds, filterStatus]);

  const getType = id => types.find(t => t.id === id);
  const getLoc = id => locations.find(l => l.id === id);
  const getFine = vid => fines.find(f => f.violationId === vid);

  const statusIcon = (s) => {
    if (s === 'Pending') return <Clock className="w-4 h-4 text-warn" />;
    if (s === 'Contested') return <AlertTriangle className="w-4 h-4 text-accent" />;
    return <CheckCircle className="w-4 h-4 text-safe" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">My Violations</h2>
          <p className="text-xs text-text-secondary">{myViolations.length} records for your vehicle(s)</p>
        </div>
        <div className="flex gap-2">
          {['', 'Pending', 'Contested', 'Closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                filterStatus === s
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-surface border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-lg animate-shimmer" />
          ))}
        </div>
      ) : myViolations.length === 0 ? (
        <EmptyState
          icon={FileX}
          title="No violations found"
          message={filterStatus ? `No ${filterStatus.toLowerCase()} violations.` : "Great news — no violations on record!"}
        />
      ) : (
        <div className="space-y-3">
          {myViolations.map(v => {
            const type = getType(v.typeId);
            const loc = getLoc(v.locationId);
            const fine = getFine(v.id);
            return (
              <div
                key={v.id}
                className="bg-surface border border-border rounded-lg p-5 shadow-card hover:border-accent/40 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {statusIcon(v.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-text-primary text-sm">{type?.name || 'Traffic Violation'}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {loc?.name} · {loc?.zone} Zone
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{formatDate(v.violationTime)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-warn text-base">{formatCurrency(fine?.amount || 0)}</p>
                    <Badge variant={fine?.isPaid ? 'safe' : 'danger'} className="mt-1">
                      {fine?.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                  <Badge variant={v.status === 'Pending' ? 'warn' : v.status === 'Contested' ? 'accent' : 'safe'}>
                    {v.status}
                  </Badge>
                  <div className="flex gap-2 ml-auto">
                    {!fine?.isPaid && fine && (
                      <Button
                        variant="primary"
                        className="text-xs py-1.5"
                        onClick={() => navigate('/citizen/fines')}
                      >
                        Pay Fine
                      </Button>
                    )}
                    {v.status === 'Pending' && (
                      <Button
                        variant="secondary"
                        className="text-xs py-1.5"
                        onClick={() => navigate(`/citizen/contest/${v.id}`)}
                      >
                        Contest
                      </Button>
                    )}
                    <button
                      className="text-xs text-text-muted hover:text-accent flex items-center gap-1"
                      onClick={() => navigate('/citizen/violations')}
                    >
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MyViolations;
