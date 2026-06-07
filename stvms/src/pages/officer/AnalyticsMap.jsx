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
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Analytics & Hotspot Map</h2>
          <p className="text-xs text-text-secondary">Spatial and temporal violation intelligence</p>
        </div>
        <div className="flex gap-3">
          <select
            className="bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            value={filterDays}
            onChange={e => setFilterDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select
            className="bg-surface border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {zones.map(z => <option key={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Violations', value: recent.length, color: 'text-primary' },
          { label: 'Hot Zones', value: hotZones.filter(z => z.count > 3).length, color: 'text-warn' },
          { label: 'Types Recorded', value: barData.length, color: 'text-accent' },
          { label: 'Est. Revenue', value: formatCurrency(revenue), color: 'text-safe' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-lg p-3">
            <p className="text-xs text-text-secondary mb-0.5">{label}</p>
            <p className={`font-display font-bold text-lg ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-text-primary">Live Hotspot Map</h3>
          <div className="flex items-center gap-4 text-xs">
            {Object.entries(HEAT_COLORS).map(([severity, color]) => (
              <div key={severity} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-text-secondary">{severity}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-96">
          <MapWrapper markers={markers} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
          <h3 className="font-display font-bold text-sm text-text-primary mb-4">Violations by Type</h3>
          <ViolationBarChart data={barData} />
        </div>
        <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
          <h3 className="font-display font-bold text-sm text-text-primary mb-4">Daily Trend</h3>
          <ViolationLineChart data={lineData} />
        </div>
      </div>

      {/* Hot Zones Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-display font-bold text-sm text-text-primary">Zone Violation Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Zone</th>
                <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Violations</th>
                <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">% Share</th>
                <th className="text-left px-4 py-2 text-xs text-text-secondary font-semibold font-display">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {hotZones.map(({ zone, count }) => {
                const pct = ((count / (recent.length || 1)) * 100).toFixed(1);
                const risk = count > 10 ? 'Critical' : count > 5 ? 'High' : count > 2 ? 'Moderate' : 'Low';
                return (
                  <tr key={zone} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">{zone}</td>
                    <td className="px-4 py-3 font-mono text-text-primary">{count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: HEAT_COLORS[risk] }} />
                        </div>
                        <span className="text-xs text-text-secondary">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={risk === 'Critical' ? 'danger' : risk === 'High' ? 'warn' : risk === 'Moderate' ? 'accent' : 'safe'}>
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
