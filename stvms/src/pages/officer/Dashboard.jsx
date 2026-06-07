import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViolations } from '../../hooks/useViolations';
import { useFines } from '../../hooks/useFines';
import { isSandbox, localDb } from '../../config/firebase';
import { ViolationBarChart } from '../../components/charts/ViolationBarChart';
import { ViolationLineChart } from '../../components/charts/ViolationLineChart';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  TrendingUp, TrendingDown, AlertTriangle, CreditCard, FileText, Car, 
  MapPin, ArrowRight, RefreshCw
} from 'lucide-react';

const StatCard = ({ label, value, sub, trend, icon: Icon, color = 'accent', index = 0 }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, []);

  const colors = {
    accent: { bg: 'bg-accent/10', border: 'border-accent/20', icon: 'text-accent' },
    primary: { bg: 'bg-primary/10', border: 'border-primary/20', icon: 'text-primary' },
    safe: { bg: 'bg-safe/10', border: 'border-safe/20', icon: 'text-safe' },
    warn: { bg: 'bg-warn/10', border: 'border-warn/20', icon: 'text-warn' },
  };
  const c = colors[color] || colors.accent;

  return (
    <div className={`bg-surface border border-border rounded-lg p-5 shadow-card transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
      <p className="text-3xl font-bold font-display text-text-primary">{value ?? '—'}</p>
      <div className="flex items-center gap-2 mt-2">
        {trend > 0 && <TrendingUp className="w-3 h-3 text-primary" />}
        {trend < 0 && <TrendingDown className="w-3 h-3 text-safe" />}
        <p className="text-xs text-text-secondary">{sub}</p>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-surface border border-border rounded-lg p-5 animate-shimmer h-28" />
);

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const { violations, loading: vioLoading } = useViolations();
  const { fines, loading: finesLoading } = useFines();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);

  // Load supporting data
  useEffect(() => {
    if (isSandbox) {
      setLocations(localDb.get('locations'));
      setViolationTypes(localDb.get('violation_types'));
    } else {
      // Fetch dynamic collection docs from live Firestore
      import('../../config/firebase').then(async ({ db, collection, getDocs }) => {
        try {
          const locSnap = await getDocs(collection(db, 'locations'));
          setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          const typeSnap = await getDocs(collection(db, 'violation_types'));
          setViolationTypes(typeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error("Error loading supporting data from Firestore:", err);
        }
      });
    }
  }, []);

  // Computed stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);

  const toDate = (v) => v instanceof Date ? v : (v?.toDate ? v.toDate() : new Date(v));

  const todayCount = violations.filter(v => toDate(v.violationTime) >= todayStart).length;
  const weekCount = violations.filter(v => toDate(v.violationTime) >= weekStart).length;
  const monthCount = violations.filter(v => toDate(v.violationTime) >= monthStart).length;
  const unpaidFines = fines.filter(f => !f.isPaid);
  const unpaidTotal = unpaidFines.reduce((acc, f) => acc + (f.amount || 0), 0);

  // Chart data: violations by type (last 30 days)
  const monthVios = violations.filter(v => toDate(v.violationTime) >= monthStart);
  const typeCounts = {};
  monthVios.forEach(v => {
    const t = violationTypes.find(t => t.id === v.typeId);
    const name = t ? t.name : v.typeId;
    typeCounts[name] = (typeCounts[name] || 0) + 1;
  });
  const barData = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name: name.split(' ').slice(0, 2).join(' '), count }));

  // Line chart: violations per day last 30 days
  const lineMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    lineMap[key] = 0;
  }
  monthVios.forEach(v => {
    const key = toDate(v.violationTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    if (lineMap[key] !== undefined) lineMap[key]++;
  });
  const lineData = Object.entries(lineMap).map(([date, count]) => ({ date, count }));

  // Repeat offenders (>= 3 violations in 90 days)
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recent = violations.filter(v => toDate(v.violationTime) >= ninetyDaysAgo);
  const vehicleCounts = {};
  recent.forEach(v => {
    vehicleCounts[v.vehicleId] = (vehicleCounts[v.vehicleId] || []);
    vehicleCounts[v.vehicleId].push(v);
  });
  const repeatOffenders = Object.entries(vehicleCounts)
    .filter(([, vios]) => vios.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  // Zone breakdown
  const zoneCounts = {};
  violations.forEach(v => {
    const loc = locations.find(l => l.id === v.locationId);
    const zone = loc ? loc.zone : 'Unknown';
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });
  const zoneData = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([zone, count]) => ({
      zone, count,
      risk: count > 10 ? 'High Risk' : count > 5 ? 'Moderate' : 'Safe'
    }));

  const loading = vioLoading || finesLoading;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Violations Today" value={todayCount} sub="Logged this calendar day" icon={FileText} color="primary" index={0} />
            <StatCard label="This Week" value={weekCount} sub="Past 7 days" icon={TrendingUp} color="accent" index={1} />
            <StatCard label="This Month" value={monthCount} sub="Past 30 days" icon={MapPin} color="warn" index={2} />
            <StatCard label="Unpaid Fines" value={unpaidFines.length} sub={`${formatCurrency(unpaidTotal)} outstanding`} icon={CreditCard} color="primary" index={3} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
          <h3 className="font-display font-bold text-sm text-text-primary mb-4">Top Violation Types (Last 30 Days)</h3>
          <ViolationBarChart data={barData} />
        </div>
        <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
          <h3 className="font-display font-bold text-sm text-text-primary mb-4">Daily Violations Trend (Last 30 Days)</h3>
          <ViolationLineChart data={lineData} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Repeat Offenders */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm text-text-primary">Repeat Offenders</h3>
              <p className="text-xs text-text-secondary">Vehicles with 3+ violations (last 90 days)</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-warn" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Vehicle ID</th>
                  <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Count</th>
                  <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Last Violation</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {repeatOffenders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-text-muted text-xs py-8">No repeat offenders detected</td>
                  </tr>
                ) : (
                  repeatOffenders.map(([vehicleId, vios]) => {
                    const isHighRisk = vios.length > 5;
                    const lastVio = vios.sort((a,b) => toDate(b.violationTime) - toDate(a.violationTime))[0];
                    return (
                      <tr key={vehicleId}
                        className={`border-b border-border/50 hover:bg-surface-2/30 transition-colors cursor-pointer ${isHighRisk ? 'bg-primary/5' : ''}`}
                        onClick={() => navigate('/vehicles')}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-text-primary">{vehicleId.slice(0, 12)}...</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold font-mono ${isHighRisk ? 'text-primary' : 'text-warn'}`}>{vios.length}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(lastVio.violationTime)}</td>
                        <td className="px-4 py-3">
                          <ArrowRight className="w-4 h-4 text-text-muted" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone Summary */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-display font-bold text-sm text-text-primary">Zone Summary</h3>
              <p className="text-xs text-text-secondary">Real-time violation density by zone</p>
            </div>
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Zone</th>
                  <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Violations</th>
                  <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {zoneData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-text-muted text-xs py-8">No zone data</td>
                  </tr>
                ) : (
                  zoneData.map(({ zone, count, risk }) => (
                    <tr key={zone} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{zone}</td>
                      <td className="px-4 py-3 font-mono text-text-primary">{count}</td>
                      <td className="px-4 py-3">
                        <Badge variant={risk === 'High Risk' ? 'danger' : risk === 'Moderate' ? 'warn' : 'safe'}>
                          {risk}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
