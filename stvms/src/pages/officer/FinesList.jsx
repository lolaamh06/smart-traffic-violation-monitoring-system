import React, { useState, useEffect, useMemo } from 'react';
import { useFines } from '../../hooks/useFines';
import { useViolations } from '../../hooks/useViolations';
import { isSandbox, localDb } from '../../config/firebase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, Eye, Download, Search, X } from 'lucide-react';

const PAGE_SIZE = 20;

export const FinesList = () => {
  const { fines, loading, markFinePaid } = useFines();
  const { violations } = useViolations();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    if (isSandbox) {
      setVehicles(localDb.get('vehicles'));
      setTypes(localDb.get('violation_types'));
    } else {
      import('../../config/firebase').then(async ({ db, collection, getDocs }) => {
        try {
          const [vehSnap, typeSnap] = await Promise.all([
            getDocs(collection(db, 'vehicles')),
            getDocs(collection(db, 'violation_types')),
          ]);
          setVehicles(vehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setTypes(typeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error('FinesList: error loading supporting data from Firestore:', err);
        }
      });
    }
  }, []);

  const [search, setSearch] = useState('');
  const [filterPaid, setFilterPaid] = useState('');
  const [page, setPage] = useState(1);
  const [payId, setPayId] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  const getViolation = id => violations.find(v => v.id === id);
  const getVehicle = id => vehicles.find(v => v.id === id);
  const getType = id => types.find(t => t.id === id);

  const filtered = useMemo(() => {
    return fines.filter(f => {
      const vio = getViolation(f.violationId);
      const veh = getVehicle(vio?.vehicleId);
      if (search) {
        const s = search.toLowerCase();
        if (!veh?.regNumber?.toLowerCase().includes(s) && !veh?.ownerName?.toLowerCase().includes(s)) return false;
      }
      if (filterPaid === 'paid' && !f.isPaid) return false;
      if (filterPaid === 'unpaid' && f.isPaid) return false;
      return true;
    });
  }, [fines, search, filterPaid, violations, vehicles]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const totalUnpaid = fines.filter(f => !f.isPaid).reduce((acc, f) => acc + (f.amount || 0), 0);

  const handleMarkPaid = async () => {
    setPayLoading(true);
    try {
      await markFinePaid(payId);
      toast.success('Fine marked as paid!');
      setPayId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Fine ID', 'Vehicle', 'Owner', 'Type', 'Amount', 'Due Date', 'Paid', 'Paid On'];
    const rows = filtered.map(f => {
      const vio = getViolation(f.violationId);
      const veh = getVehicle(vio?.vehicleId);
      const type = getType(vio?.typeId);
      return [
        f.id, veh?.regNumber, veh?.ownerName, type?.name,
        f.amount, formatDate(f.dueDate), f.isPaid ? 'Yes' : 'No', f.isPaid ? formatDate(f.paidAt) : ''
      ].join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'fines.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Fines Management</h2>
          <p className="text-xs text-text-secondary">{filtered.length} records · <span className="text-primary font-bold">{formatCurrency(totalUnpaid)}</span> outstanding</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} className="text-xs">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Fines', value: fines.length, color: 'bg-accent/10 border-accent/20 text-accent' },
          { label: 'Unpaid', value: fines.filter(f => !f.isPaid).length, color: 'bg-primary/10 border-primary/20 text-primary' },
          { label: 'Paid', value: fines.filter(f => f.isPaid).length, color: 'bg-safe/10 border-safe/20 text-safe' },
          { label: 'Outstanding', value: formatCurrency(totalUnpaid), color: 'bg-warn/10 border-warn/20 text-warn' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-surface border rounded-lg p-3 ${color.split(' ')[1]}`}>
            <p className="text-xs text-text-secondary mb-0.5">{label}</p>
            <p className={`font-display font-bold text-lg ${color.split(' ')[2]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-surface border border-border rounded-lg">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            className="w-full bg-surface-2 border border-border rounded pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
            placeholder="Search vehicle or owner…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
          value={filterPaid}
          onChange={e => { setFilterPaid(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="paid">Paid Only</option>
          <option value="unpaid">Unpaid Only</option>
        </select>
        {(search || filterPaid) && (
          <Button variant="secondary" className="text-xs" onClick={() => { setSearch(''); setFilterPaid(''); }}>
            <X className="w-3 h-3" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Fine ID</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden lg:table-cell">Due Date</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-surface-2 rounded animate-shimmer" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-12">
                  <EmptyState icon={CreditCard} title="No fines found" message="Fines are auto-generated when violations are logged." />
                </td></tr>
              ) : (
                paginated.map(f => {
                  const vio = getViolation(f.violationId);
                  const veh = getVehicle(vio?.vehicleId);
                  const type = getType(vio?.typeId);
                  return (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{f.id?.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-xs text-text-primary">{veh?.regNumber || '—'}</p>
                        <p className="text-xs text-text-secondary">{veh?.ownerName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-primary hidden md:table-cell">{type?.name || '—'}</td>
                      <td className="px-4 py-3 font-mono font-bold text-warn">{formatCurrency(f.amount)}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary hidden lg:table-cell">{formatDate(f.dueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={f.isPaid ? 'safe' : 'danger'}>{f.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/violations/${f.violationId}`)}
                            className="text-text-muted hover:text-accent transition-colors"
                            title="View violation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!f.isPaid && (
                            <button
                              onClick={() => setPayId(f.id)}
                              className="text-text-muted hover:text-safe transition-colors"
                              title="Mark as paid"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-text-secondary">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="text-xs py-1" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="secondary" className="text-xs py-1" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!payId}
        onClose={() => setPayId(null)}
        onConfirm={handleMarkPaid}
        title="Mark Fine as Paid"
        message="This will record the fine as paid. This action cannot be undone."
        confirmText="Mark Paid"
        type="safe"
        loading={payLoading}
      />
    </div>
  );
};
export default FinesList;
