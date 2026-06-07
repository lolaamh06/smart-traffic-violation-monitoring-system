import React, { useEffect, useMemo, useState } from 'react';
import { useViolations } from '../../hooks/useViolations';
import { isSandbox, localDb } from '../../config/firebase';
import MapWrapper from '../../components/map/MapWrapper';
import { Badge } from '../../components/ui/Badge';
import { ViolationBarChart } from '../../components/charts/ViolationBarChart';
import { ViolationLineChart } from '../../components/charts/ViolationLineChart';
import { formatCurrency } from '../../utils/formatters';
import { useFines } from '../../hooks/useFines';

const HEAT_COLORS = {
  'Critical': '#E53E3E',
  'High': '#D69E2E',
  'Moderate': '#3182CE',
  'Low': '#38A169',
};

export const AnalyticsMap = () => {
  const { violations } = useViolations();
  const { fines } = useFines();

  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [filterDays, setFilterDays] = useState(30);

  useEffect(() => {
    if (isSandbox) {
      setLocations(localDb.get('locations'));
      setTypes(localDb.get('violation_types'));
    } else {
      import('../../config/firebase').then(async ({ db, collection, getDocs }) => {
        try {
          const locSnap = await getDocs(collection(db, 'locations'));
          setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          const typeSnap = await getDocs(collection(db, 'violation_types'));
          setTypes(typeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error("Error loading supporting data from Firestore in AnalyticsMap:", err);
        }
      });
    }
  }, []);

  const sinceDate = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - filterDays); return d;
  }, [filterDays]);

  const toDate = v => v instanceof Date ? v : new Date(v);
  const recent = useMemo(() => violations.filter(v => toDate(v.violationTime) >= sinceDate), [violations, sinceDate]);

  // Location violation counts
  const locationCounts = useMemo(() => {
    const map = {};
    recent.forEach(v => {
      map[v.locationId] = (map[v.locationId] || 0) + 1;
    });
    return map;
  }, [recent]);

  const maxCount = Math.max(...Object.values(locationCounts), 1);

  // Map markers (hotspots)
  const markers = useMemo(() => {
    return locations
      .filter(l => !selectedZone || l.zone === selectedZone)
      .map(l => {
        const count = locationCounts[l.id] || 0;
        const density = count / maxCount;
        const severity = density > 0.7 ? 'Critical' : density > 0.4 ? 'High' : density > 0.1 ? 'Moderate' : 'Low';
        return {
          id: l.id,
          lat: l.lat,
          lng: l.lng,
          name: l.name,
          zone: l.zone,
          count,
          severity,
          color: HEAT_COLORS[severity],
        };
      });
  }, [locations, locationCounts, selectedZone, maxCount]);

  // Hot zones table
  const hotZones = useMemo(() => {
    const zoneMap = {};
    recent.forEach(v => {
      const loc = locations.find(l => l.id === v.locationId);
      if (!loc) return;
      zoneMap[loc.zone] = (zoneMap[loc.zone] || 0) + 1;
    });
    return Object.entries(zoneMap)
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count);
  }, [recent, locations]);

  // Type breakdown
  const barData = useMemo(() => {
    const counts = {};
    recent.forEach(v => {
      const t = types.find(t => t.id === v.typeId);
      const name = t ? t.name : v.typeId;
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name: name.split(' ').slice(0, 2).join(' '), count }));
  }, [recent, types]);

  // Daily trend
  const lineData = useMemo(() => {
    const map = {};
    for (let i = filterDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      map[key] = 0;
    }
    recent.forEach(v => {
      const key = toDate(v.violationTime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (map[key] !== undefined) map[key]++;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [recent, filterDays]);

  // Revenue from fines in period
  const revenue = useMemo(() => {
    const violationIds = new Set(recent.map(v => v.id));
    return fines.filter(f => violationIds.has(f.violationId)).reduce((acc, f) => acc + (f.amount || 0), 0);
  }, [fines, recent]);

  const zones = [...new Set(locations.map(l => l.zone))];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-text-primary tracking-wide uppercase">Analytics & Hotspot Map</h2>
          <p className="text-xs text-text-secondary font-medium">Spatial and temporal traffic violation intelligence</p>
        </div>
        <div className="flex gap-3">
          <select
            className="bg-surface-2 border border-border rounded-xl px-4 py-2 text-xs font-bold font-display uppercase tracking-wider text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200"
            value={filterDays}
            onChange={e => setFilterDays(Number(e.target.value))}
          >
            <option value={7} className="bg-bg text-text-primary">Last 7 Days</option>
            <option value={30} className="bg-bg text-text-primary">Last 30 Days</option>
            <option value={90} className="bg-bg text-text-primary">Last 90 Days</option>
          </select>
          <select
            className="bg-surface-2 border border-border rounded-xl px-4 py-2 text-xs font-bold font-display uppercase tracking-wider text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200"
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
          >
            <option value="" className="bg-bg text-text-secondary">All Zones</option>
            {zones.map(z => <option key={z} value={z} className="bg-bg text-text-primary">{z} Zone</option>)}
          </select>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Violations', value: recent.length, color: 'text-primary', glowClass: 'glass-card-primary', badge: 'Alerts' },
          { label: 'Active Hot Zones', value: hotZones.filter(z => z.count > 3).length, color: 'text-warn', hoverGlow: 'hover:border-warn/40 hover:shadow-glow-warn', badge: 'Density' },
          { label: 'Types Recorded', value: barData.length, color: 'text-accent', glowClass: 'glass-card-accent', badge: 'Categories' },
          { label: 'Estimated Fines', value: formatCurrency(revenue), color: 'text-safe', glowClass: 'glass-card-safe', badge: 'Revenue' },
        ].map(({ label, value, color, glowClass, hoverGlow, badge }) => (
          <div 
            key={label} 
            className={`glass-card rounded-2xl p-5 border border-border/60 hover:scale-[1.02] transition-all duration-300 ${glowClass || ''} ${hoverGlow || ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-text-muted uppercase tracking-widest font-extrabold font-display">{label}</span>
              <Badge variant="ghost" className="text-[9px] uppercase tracking-wider text-text-muted border-none bg-surface-2/40 px-1.5 py-0.5">{badge}</Badge>
            </div>
            <p className={`font-display font-extrabold text-2xl tracking-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-card border border-border/60">
        <div className="px-6 py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-2/20">
          <h3 className="font-display font-extrabold text-sm text-text-primary uppercase tracking-wide">Live Density Analysis Map</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold font-display uppercase tracking-wider text-text-secondary">
            {Object.entries(HEAT_COLORS).map(([severity, color]) => (
              <div key={severity} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                <span>{severity}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-[420px] relative">
          <MapWrapper markers={markers} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 shadow-card border border-border/60">
          <h3 className="font-display font-extrabold text-xs text-text-secondary uppercase tracking-widest mb-6">Violations by Category</h3>
          <div className="h-72">
            <ViolationBarChart data={barData} />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 shadow-card border border-border/60">
          <h3 className="font-display font-extrabold text-xs text-text-secondary uppercase tracking-widest mb-6">Temporal Daily Trend</h3>
          <div className="h-72">
            <ViolationLineChart data={lineData} />
          </div>
        </div>
      </div>

      {/* Hot Zones Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-card border border-border/60">
        <div className="px-6 py-5 border-b border-border/60 bg-surface-2/20">
          <h3 className="font-display font-extrabold text-sm text-text-primary uppercase tracking-wide">Zone Violation Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-surface-2/50">
                <th className="text-left px-6 py-3 text-[10px] text-text-muted font-extrabold font-display uppercase tracking-widest">Zone Jurisdiction</th>
                <th className="text-left px-6 py-3 text-[10px] text-text-muted font-extrabold font-display uppercase tracking-widest">Violations Count</th>
                <th className="text-left px-6 py-3 text-[10px] text-text-muted font-extrabold font-display uppercase tracking-widest">Relative Share</th>
                <th className="text-left px-6 py-3 text-[10px] text-text-muted font-extrabold font-display uppercase tracking-widest">Enforcement Risk</th>
              </tr>
            </thead>
            <tbody>
              {hotZones.map(({ zone, count }) => {
                const pct = ((count / (recent.length || 1)) * 100).toFixed(1);
                const risk = count > 10 ? 'Critical' : count > 5 ? 'High' : count > 2 ? 'Moderate' : 'Low';
                return (
                  <tr key={zone} className="border-b border-border/20 hover:bg-surface-2/20 transition-all duration-150">
                    <td className="px-6 py-4 font-bold text-text-primary">{zone} Zone</td>
                    <td className="px-6 py-4 font-mono font-extrabold text-text-primary">{count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-2 bg-surface-2 rounded-full overflow-hidden border border-border/40">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: HEAT_COLORS[risk] }} />
                        </div>
                        <span className="text-xs text-text-secondary font-mono font-bold">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={risk === 'Critical' ? 'danger' : risk === 'High' ? 'warn' : risk === 'Moderate' ? 'accent' : 'safe'}
                        className="font-extrabold text-[9px] uppercase tracking-wider"
                      >
                        {risk}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsMap;
