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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-text-primary uppercase tracking-wide">Fines Management</h2>
          <p className="text-xs text-text-muted font-bold mt-0.5">{filtered.length} records · <span className="text-primary font-extrabold">{formatCurrency(totalUnpaid)}</span> outstanding</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} className="text-xs py-2 px-3.5 font-bold shadow-sm cursor-pointer">
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'Total Fines', value: fines.length, color: 'text-accent border-accent/25 bg-accent/5 shadow-glow-accent' },
          { label: 'Unpaid Tickets', value: fines.filter(f => !f.isPaid).length, color: 'text-primary border-primary/25 bg-primary/5 shadow-glow-primary' },
          { label: 'Cleared Paid', value: fines.filter(f => f.isPaid).length, color: 'text-safe border-safe/25 bg-safe/5 shadow-glow-safe' },
          { label: 'Outstanding Balance', value: formatCurrency(totalUnpaid), color: 'text-warn border-warn/25 bg-warn/5' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`glass-card rounded-2xl p-5 shadow-card hover:-translate-y-0.5 border ${color.split(' ')[1]} ${color.split(' ')[3] || ''}`}>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-wider mb-1.5">{label}</p>
            <p className={`font-display font-extrabold text-xl ${color.split(' ')[0]}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-5 glass-card rounded-2xl shadow-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            className="w-full bg-surface-2 border border-border rounded-xl pl-10 pr-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
            placeholder="Search vehicle or owner…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-accent cursor-pointer"
          value={filterPaid}
          onChange={e => { setFilterPaid(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="paid">Paid Only</option>
          <option value="unpaid">Unpaid Only</option>
        </select>
        {(search || filterPaid) && (
          <Button variant="secondary" className="text-xs py-2.5 px-4 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/20" onClick={() => { setSearch(''); setFilterPaid(''); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-white/[0.02]">
                <th className="text-left px-5 py-4 text-xs text-text-secondary font-display font-bold uppercase tracking-wider">Fine ID</th>
                <th className="text-left px-5 py-4 text-xs text-text-secondary font-display font-bold uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-5 py-4 text-xs text-text-secondary font-display font-bold uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-4 text-xs text-text-secondary font-display font-bold uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-4 text-xs text-text-secondary font-display font-bold uppercase tracking-wider hidden lg:table-cell">Due Date</th>
                <th className="text-left px-5 py-4 text-xs text-text-secondary font-display font-bold uppercase tracking-wider">Status</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/40 bg-black/10 animate-pulse">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-surface-2 rounded-lg" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="py-16">
                  <EmptyState icon={CreditCard} title="No fines found" message="Fines are auto-generated when violations are logged." />
                </td></tr>
              ) : (
                paginated.map(f => {
                  const vio = getViolation(f.violationId);
                  const veh = getVehicle(vio?.vehicleId);
                  const type = getType(vio?.typeId);
                  return (
                    <tr key={f.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-text-secondary font-semibold">#{f.id?.slice(-8)}</td>
                      <td className="px-5 py-4">
                        <p className="font-mono font-bold text-xs text-text-primary bg-white/5 border border-white/5 px-2 py-0.5 rounded inline-block">{veh?.regNumber || '—'}</p>
                        <p className="text-xs text-text-secondary font-medium mt-1">{veh?.ownerName}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-text-primary font-bold hidden md:table-cell">{type?.name || '—'}</td>
                      <td className="px-5 py-4 font-mono font-extrabold text-warn">{formatCurrency(f.amount)}</td>
                      <td className="px-5 py-4 text-xs text-text-secondary font-medium hidden lg:table-cell">{formatDate(f.dueDate)}</td>
                      <td className="px-5 py-4">
                        <Badge variant={f.isPaid ? 'safe' : 'danger'}>{f.isPaid ? 'Paid' : 'Unpaid'}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/violations/${f.violationId}`)}
                            className="text-text-muted hover:text-accent transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                            title="View violation"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          {!f.isPaid && (
                            <button
                              onClick={() => setPayId(f.id)}
                              className="text-text-muted hover:text-safe transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
                              title="Mark as paid"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-white/[0.01]">
            <p className="text-xs text-text-muted font-semibold">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="text-xs py-1.5 px-3.5 font-bold cursor-pointer" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button variant="secondary" className="text-xs py-1.5 px-3.5 font-bold cursor-pointer" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
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
