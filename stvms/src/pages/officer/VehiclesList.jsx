import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../../hooks/useVehicles';
import { useViolations } from '../../hooks/useViolations';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatRegNumber } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { Car, Plus, Eye, Trash2, Search, X, AlertTriangle } from 'lucide-react';

const PAGE_SIZE = 20;

export const VehiclesList = () => {
  const { vehicles, loading, createVehicle, deleteVehicle } = useVehicles();
  const { violations } = useViolations();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newVeh, setNewVeh] = useState({ regNumber: '', ownerName: '', ownerPhone: '', vehicleType: 'Car' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Attach violation counts
  const enriched = useMemo(() => {
    return vehicles.map(v => {
      const vios = violations.filter(x => x.vehicleId === v.id);
      const last90 = new Date(); last90.setDate(last90.getDate() - 90);
      const recent = vios.filter(x => {
        const d = x.violationTime instanceof Date ? x.violationTime : new Date(x.violationTime);
        return d >= last90;
      }).length;
      return { ...v, totalViolations: vios.length, recentViolations: recent };
    });
  }, [vehicles, violations]);

  const filtered = useMemo(() => {
    return enriched.filter(v => {
      if (search) {
        const s = search.toLowerCase();
        if (!v.regNumber?.toLowerCase().includes(s) && !v.ownerName?.toLowerCase().includes(s)) return false;
      }
      if (filterType && v.vehicleType !== filterType) return false;
      return true;
    });
  }, [enriched, search, filterType]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleAdd = async () => {
    setAddError('');
    if (!newVeh.regNumber.trim() || !newVeh.ownerName.trim() || !newVeh.ownerPhone.trim()) {
      setAddError('All fields are required.');
      return;
    }
    setAddLoading(true);
    try {
      await createVehicle(newVeh);
      toast.success('Vehicle added!');
      setShowAdd(false);
      setNewVeh({ regNumber: '', ownerName: '', ownerPhone: '', vehicleType: 'Car' });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteVehicle(deleteId);
      toast.success('Vehicle removed');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Vehicle Registry</h2>
          <p className="text-xs text-text-secondary">{filtered.length} registered vehicles</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5" /> Register Vehicle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-surface border border-border rounded-lg">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            className="w-full bg-surface-2 border border-border rounded pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
            placeholder="Search reg number or owner…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          {['Car', 'Bike', 'Truck', 'Auto', 'Bus'].map(t => <option key={t}>{t}</option>)}
        </select>
        {(search || filterType) && (
          <Button variant="secondary" className="text-xs" onClick={() => { setSearch(''); setFilterType(''); }}>
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
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Registration</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Owner</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden lg:table-cell">Total Violations</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Risk</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-surface-2 rounded animate-shimmer" /></td>)}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="py-12">
                  <EmptyState icon={Car} title="No vehicles found" message="Register a vehicle or adjust filters." />
                </td></tr>
              ) : (
                paginated.map(v => {
                  const isRepeat = v.recentViolations >= 3;
                  return (
                    <tr key={v.id} className={`border-b border-border/50 hover:bg-surface-2/30 transition-colors ${isRepeat ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isRepeat && <AlertTriangle className="w-3.5 h-3.5 text-primary shrink-0" />}
                          <span className="font-mono font-bold text-sm text-text-primary">{v.regNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-primary font-semibold">{v.ownerName}</p>
                        <p className="text-xs text-text-muted">{v.ownerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary hidden md:table-cell">{v.vehicleType}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="font-mono text-text-primary">{v.totalViolations}</span>
                        <span className="text-xs text-text-muted ml-1">({v.recentViolations} recent)</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isRepeat ? 'danger' : v.totalViolations > 0 ? 'warn' : 'safe'}>
                          {isRepeat ? 'Repeat Offender' : v.totalViolations > 0 ? 'Has Violations' : 'Clean'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/violations?vehicle=${v.id}`)}
                            className="text-text-muted hover:text-accent transition-colors"
                            title="View violations"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(v.id)}
                            className="text-text-muted hover:text-primary transition-colors"
                            title="Remove vehicle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Register New Vehicle" className="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Registration Number *</label>
            <input
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm font-mono uppercase tracking-widest text-text-primary placeholder-text-muted focus:outline-none focus:border-accent"
              placeholder="KA-01-AB-1234"
              value={newVeh.regNumber}
              onChange={e => setNewVeh({ ...newVeh, regNumber: formatRegNumber(e.target.value) })}
              maxLength={13}
            />
          </div>
          <Input label="Owner Name *" value={newVeh.ownerName} onChange={e => setNewVeh({ ...newVeh, ownerName: e.target.value })} placeholder="Full name" />
          <Input label="Owner Phone *" value={newVeh.ownerPhone} onChange={e => setNewVeh({ ...newVeh, ownerPhone: e.target.value })} placeholder="9XXXXXXXXX" />
          <div>
            <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Vehicle Type *</label>
            <select
              className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              value={newVeh.vehicleType}
              onChange={e => setNewVeh({ ...newVeh, vehicleType: e.target.value })}
            >
              {['Car', 'Bike', 'Truck', 'Auto', 'Bus'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {addError && <p className="text-xs text-primary">{addError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={handleAdd} loading={addLoading}>Register</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Vehicle"
        message="This will permanently remove the vehicle from the registry. Existing violation records will be retained."
        confirmText="Remove"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
export default VehiclesList;
