import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViolations } from '../../hooks/useViolations';
import { useFines } from '../../hooks/useFines';
import { isSandbox, localDb } from '../../config/firebase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { ArrowLeft, Car, MapPin, Gavel, CreditCard, Image, Clock, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const Field = ({ label, value, mono = false }) => (
  <div>
    <p className="text-xs text-text-secondary font-display uppercase tracking-wider mb-0.5">{label}</p>
    <p className={`text-sm text-text-primary font-semibold ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
  </div>
);

export const ViolationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { violations, updateViolationStatus } = useViolations();
  const { fines, markFinePaid } = useFines();

  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);

  useEffect(() => {
    if (isSandbox) {
      setVehicles(localDb.get('vehicles'));
      setLocations(localDb.get('locations'));
      setViolationTypes(localDb.get('violation_types'));
    }
  }, []);

  const violation = violations.find(v => v.id === id);
  const vehicle = vehicles.find(v => v.id === violation?.vehicleId);
  const location = locations.find(l => l.id === violation?.locationId);
  const type = violationTypes.find(t => t.id === violation?.typeId);
  const fine = fines.find(f => f.violationId === id);

  if (!violation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-text-secondary">Violation not found.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /> Go Back</Button>
      </div>
    );
  }

  const handleStatusChange = async (s) => {
    try {
      await updateViolationStatus(id, s);
      toast.success(`Status updated to ${s}`);
    } catch (err) { toast.error(err.message); }
  };

  const handleMarkPaid = async () => {
    if (!fine) return;
    try {
      await markFinePaid(fine.id);
      toast.success('Fine marked as paid!');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Violation Details</h2>
          <p className="text-xs font-mono text-text-secondary">{id}</p>
        </div>
        <Badge variant={violation.status === 'Pending' ? 'warn' : violation.status === 'Contested' ? 'accent' : 'info'} className="ml-auto">
          {violation.status}
        </Badge>
      </div>

      {/* Vehicle Info */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-sm text-text-primary">Vehicle Information</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Reg Number" value={vehicle?.regNumber} mono />
          <Field label="Owner" value={vehicle?.ownerName} />
          <Field label="Phone" value={vehicle?.ownerPhone} mono />
          <Field label="Vehicle Type" value={vehicle?.vehicleType} />
        </div>
      </div>

      {/* Incident Info */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Gavel className="w-4 h-4 text-warn" />
          <h3 className="font-display font-bold text-sm text-text-primary">Incident Information</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Violation Type" value={type?.name} />
          <Field label="Base Fine" value={formatCurrency(type?.baseFine || 0)} />
          <Field label="Severity" value={type?.severity} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Location" value={location?.name} />
          <Field label="Zone" value={location?.zone} />
          <Field label="Date & Time" value={formatDate(violation.violationTime)} />
        </div>
      </div>

      {/* Evidence */}
      {violation.evidenceImageUrl && (
        <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-4 h-4 text-accent" />
            <h3 className="font-display font-bold text-sm text-text-primary">Evidence</h3>
          </div>
          <img
            src={violation.evidenceImageUrl}
            alt="Evidence"
            className="w-full max-h-64 object-cover rounded-md border border-border"
            onError={e => e.target.style.display = 'none'}
          />
        </div>
      )}

      {/* Fine Info */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-safe" />
          <h3 className="font-display font-bold text-sm text-text-primary">Fine Details</h3>
        </div>
        {fine ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Fine ID" value={fine.id?.slice(-8)} mono />
            <div>
              <p className="text-xs text-text-secondary font-display uppercase tracking-wider mb-0.5">Amount</p>
              <p className="text-2xl font-display font-bold text-warn">{formatCurrency(fine.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary font-display uppercase tracking-wider mb-0.5">Payment Status</p>
              <Badge variant={fine.isPaid ? 'safe' : 'danger'}>{fine.isPaid ? 'Paid' : 'Unpaid'}</Badge>
            </div>
            <Field label="Due Date" value={formatDate(fine.dueDate)} />
            {fine.isPaid && <Field label="Paid On" value={formatDate(fine.paidAt)} />}
            {!fine.isPaid && (
              <div className="col-span-full">
                <Button variant="safe" onClick={handleMarkPaid}>Mark Fine as Paid (Admin Override)</Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-muted">No fine record found for this violation.</p>
        )}
      </div>

      {/* Status Update */}
      <div className="bg-surface border border-border rounded-lg p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-sm text-text-primary">Update Status</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          {['Pending', 'Contested', 'Closed'].map(s => (
            <Button
              key={s}
              variant={violation.status === s ? 'primary' : 'secondary'}
              className="text-xs"
              onClick={() => handleStatusChange(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ViolationDetail;
