import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViolations } from '../../hooks/useViolations';
import { useFines } from '../../hooks/useFines';
import { isSandbox, localDb } from '../../config/firebase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { Eye, Pencil, Trash2, Download, Search, Filter, X, FileX } from 'lucide-react';

const PAGE_SIZE = 20;

const statusVariant = (s) => s === 'Pending' ? 'warn' : s === 'Contested' ? 'accent' : 'info';

export const ViolationsList = () => {
  const { violations, loading, deleteViolation, updateViolationStatus } = useViolations();
  const { fines } = useFines();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (isSandbox) {
      setVehicles(localDb.get('vehicles'));
      setLocations(localDb.get('locations'));
      setViolationTypes(localDb.get('violation_types'));
    } else {
      import('../../config/firebase').then(async ({ db, collection, getDocs }) => {
        try {
          const [vehSnap, locSnap, typeSnap] = await Promise.all([
            getDocs(collection(db, 'vehicles')),
            getDocs(collection(db, 'locations')),
            getDocs(collection(db, 'violation_types')),
          ]);
          setVehicles(vehSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setViolationTypes(typeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error('Error loading supporting data from Firestore:', err);
        }
      });
    }
  }, []);

  const getVehicle = (id) => vehicles.find(v => v.id === id);
  const getLocation = (id) => locations.find(l => l.id === id);
  const getType = (id) => violationTypes.find(t => t.id === id);
  const getFine = (vid) => fines.find(f => f.violationId === vid);

  const zones = [...new Set(locations.map(l => l.zone))];

  const filtered = useMemo(() => {
    return violations.filter(v => {
      const veh = getVehicle(v.vehicleId);
      const loc = getLocation(v.locationId);
      if (search) {
        const s = search.toLowerCase();
        const match =
          veh?.regNumber?.toLowerCase().includes(s) ||
          veh?.ownerName?.toLowerCase().includes(s) ||
          v.id?.toLowerCase().includes(s);
        if (!match) return false;
      }
      if (filterZone && loc?.zone !== filterZone) return false;
      if (filterStatus && v.status !== filterStatus) return false;
      return true;
    });
  }, [violations, search, filterZone, filterStatus, vehicles, locations]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteViolation(deleteId);
      toast.success('Violation deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateViolationStatus(id, status);
      toast.success(`Status updated to ${status}`);
      setEditId(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Vehicle', 'Owner', 'Type', 'Location', 'Zone', 'Date', 'Fine', 'Status'];
    const rows = filtered.map(v => {
      const veh = getVehicle(v.vehicleId);
      const loc = getLocation(v.locationId);
      const type = getType(v.typeId);
      const fine = getFine(v.id);
      return [
        v.id, veh?.regNumber, veh?.ownerName, type?.name, loc?.name, loc?.zone,
        formatDate(v.violationTime), fine?.amount || 0, v.status
      ].join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'violations.csv'; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Violations Registry</h2>
          <p className="text-xs text-text-secondary">{filtered.length} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCSV} className="text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="primary" onClick={() => navigate('/violations/new')} className="text-xs">
            + Log New
          </Button>
        </div>
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
          value={filterZone}
          onChange={e => { setFilterZone(e.target.value); setPage(1); }}
        >
          <option value="">All Zones</option>
          {zones.map(z => <option key={z}>{z}</option>)}
        </select>
        <select
          className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {['Pending', 'Contested', 'Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterZone || filterStatus) && (
          <Button variant="secondary" className="text-xs" onClick={() => { setSearch(''); setFilterZone(''); setFilterStatus(''); }}>
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
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">ID</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Vehicle</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold hidden lg:table-cell">Date/Time</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Fine</th>
                <th className="text-left px-4 py-3 text-xs text-text-secondary font-display font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array(8).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-surface-2 rounded animate-shimmer" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="py-12">
                  <EmptyState icon={FileX} title="No violations found" message="Try adjusting your filters or log a new violation." />
                </td></tr>
              ) : (
                paginated.map(v => {
                  const veh = getVehicle(v.vehicleId);
                  const loc = getLocation(v.locationId);
                  const type = getType(v.typeId);
                  const fine = getFine(v.id);
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{v.id?.slice(-8)}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-xs text-text-primary">{veh?.regNumber || '—'}</p>
                        <p className="text-xs text-text-secondary">{veh?.ownerName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-primary hidden md:table-cell">{type?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs hidden lg:table-cell">
                        <p className="text-text-primary">{loc?.name || '—'}</p>
                        <p className="text-text-muted">{loc?.zone}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary hidden lg:table-cell">{formatDate(v.violationTime)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-warn font-bold">{formatCurrency(fine?.amount || 0)}</td>
                      <td className="px-4 py-3">
                        {editId === v.id ? (
                          <select
                            className="bg-surface-2 border border-border rounded text-xs px-2 py-1 text-text-primary focus:outline-none"
                            defaultValue={v.status}
                            autoFocus
                            onBlur={e => handleStatusUpdate(v.id, e.target.value)}
                          >
                            {['Pending', 'Contested', 'Closed'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/violations/${v.id}`)} className="text-text-muted hover:text-accent transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditId(editId === v.id ? null : v.id)} className="text-text-muted hover:text-warn transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(v.id)} className="text-text-muted hover:text-primary transition-colors">
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

        {/* Pagination */}
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
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Violation"
        message="Are you sure? This will also permanently delete the linked fine record. This action cannot be undone."
        confirmText="Delete Violation"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};
export default ViolationsList;
