import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViolations } from '../../hooks/useViolations';
import { useVehicles } from '../../hooks/useVehicles';
import { isSandbox, localDb } from '../../config/firebase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatRegNumber, formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { CheckCircle, ChevronRight, Search, Car, Plus, AlertCircle } from 'lucide-react';

const STEPS = ['Vehicle', 'Incident', 'Review & Submit'];

export const LogViolation = () => {
  const { currentUser } = useAuth();
  const { createViolation } = useViolations();
  const { vehicles, createVehicle } = useVehicles();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Step 1
  const [regInput, setRegInput] = useState('');
  const [foundVehicle, setFoundVehicle] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVeh, setNewVeh] = useState({ ownerName: '', ownerPhone: '', vehicleType: 'Car' });
  const [vehError, setVehError] = useState('');

  // Step 2
  const [locationId, setLocationId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [violationTime, setViolationTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [status, setStatus] = useState('Pending');
  const [step2Errors, setStep2Errors] = useState({});

  // Loaded data
  const [locations, setLocations] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);

  useEffect(() => {
    if (isSandbox) {
      setLocations(localDb.get('locations'));
      setViolationTypes(localDb.get('violation_types'));
    } else {
      import('../../config/firebase').then(async ({ db, collection, getDocs }) => {
        try {
          const [locSnap, typeSnap] = await Promise.all([
            getDocs(collection(db, 'locations')),
            getDocs(collection(db, 'violation_types')),
          ]);
          setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setViolationTypes(typeSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
          console.error('Error loading form data from Firestore:', err);
        }
      });
    }
  }, []);

  // Debounced vehicle search
  useEffect(() => {
    if (!regInput) { setFoundVehicle(null); setShowAddVehicle(false); return; }
    const formatted = regInput.toUpperCase();
    const match = vehicles.find(v =>
      v.regNumber.replace(/[^A-Z0-9]/g, '').includes(formatted.replace(/[^A-Z0-9]/g, ''))
    );
    setFoundVehicle(match || null);
    if (!match && formatted.length >= 8) setShowAddVehicle(true);
    else setShowAddVehicle(false);
  }, [regInput, vehicles]);

  const handleAddNewVehicle = async () => {
    setVehError('');
    if (!newVeh.ownerName.trim() || !newVeh.ownerPhone.trim()) {
      setVehError('Owner name and phone are required.');
      return;
    }
    setLoading(true);
    try {
      const created = await createVehicle({ ...newVeh, regNumber: regInput });
      setFoundVehicle(created);
      setShowAddVehicle(false);
      toast.success(`Vehicle ${created.regNumber} added!`);
    } catch (err) {
      setVehError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Validate = () => {
    const errs = {};
    if (!locationId) errs.locationId = 'Select a location';
    if (!typeId) errs.typeId = 'Select violation type';
    if (!violationTime) errs.violationTime = 'Enter date/time';
    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await createViolation({
        vehicleId: foundVehicle.id,
        officerId: currentUser.uid || 'demo-officer',
        locationId,
        typeId,
        violationTime: new Date(violationTime),
        evidenceImageUrl: evidenceUrl,
        status
      });
      const type = violationTypes.find(t => t.id === typeId);
      setSuccess({ id: result.id, amount: type?.baseFine || 0 });
      toast.success('Violation logged! Fine auto-generated.');
    } catch (err) {
      toast.error(err.message || 'Failed to log violation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-safe/10 border border-safe/30 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle className="w-10 h-10 text-safe" />
        </div>
        <h2 className="font-display font-bold text-2xl text-text-primary mb-2">Violation Logged!</h2>
        <p className="text-text-secondary text-sm mb-1">
          Fine of <span className="text-warn font-bold font-mono">{formatCurrency(success.amount)}</span> auto-generated.
        </p>
        <p className="text-xs text-text-muted font-mono mb-8">ID: {success.id}</p>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => { setStep(0); setSuccess(null); setRegInput(''); setFoundVehicle(null); }}>Log Another</Button>
          <Button variant="primary" onClick={() => navigate('/violations')}>View All Violations</Button>
        </div>
      </div>
    );
  }

  const selectedType = violationTypes.find(t => t.id === typeId);
  const selectedLoc = locations.find(l => l.id === locationId);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-semibold font-display transition-all ${i === step ? 'text-text-primary' : i < step ? 'text-safe' : 'text-text-muted'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step ? 'bg-safe border-safe text-bg' 
                : i === step ? 'bg-accent/10 border-accent text-accent' 
                : 'bg-surface-2 border-border text-text-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 transition-all ${i < step ? 'bg-safe' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-card p-6">
        {/* STEP 1: Vehicle */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary mb-1">Step 1: Identify Vehicle</h2>
              <p className="text-sm text-text-secondary">Enter the registration number to auto-search the database.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                className="w-full bg-surface-2 border border-border rounded-md pl-10 pr-4 py-3 text-sm font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all uppercase tracking-widest"
                placeholder="KA-01-AB-1234"
                value={regInput}
                onChange={e => setRegInput(formatRegNumber(e.target.value))}
                maxLength={13}
              />
            </div>

            {/* Found Vehicle */}
            {foundVehicle && (
              <div className="flex items-center gap-4 p-4 bg-safe/5 border border-safe/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-safe" />
                </div>
                <div>
                  <p className="font-mono font-bold text-text-primary text-base">{foundVehicle.regNumber}</p>
                  <p className="text-sm text-text-secondary">{foundVehicle.ownerName} · {foundVehicle.vehicleType}</p>
                  <p className="text-xs text-text-muted">{foundVehicle.ownerPhone}</p>
                </div>
                <Badge variant="safe" className="ml-auto">Found</Badge>
              </div>
            )}

            {/* Add new vehicle */}
            {showAddVehicle && !foundVehicle && (
              <div className="p-4 bg-warn/5 border border-warn/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warn" />
                  <p className="text-sm text-warn font-semibold">Vehicle not in database — add new?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Owner Name" value={newVeh.ownerName} onChange={e => setNewVeh({...newVeh, ownerName: e.target.value})} placeholder="Full name" />
                  <Input label="Owner Phone" value={newVeh.ownerPhone} onChange={e => setNewVeh({...newVeh, ownerPhone: e.target.value})} placeholder="9XXXXXXXXX" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Vehicle Type</label>
                  <select
                    className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    value={newVeh.vehicleType}
                    onChange={e => setNewVeh({...newVeh, vehicleType: e.target.value})}
                  >
                    {['Car', 'Bike', 'Truck', 'Auto', 'Bus'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {vehError && <p className="text-xs text-primary">{vehError}</p>}
                <Button variant="safe" onClick={handleAddNewVehicle} loading={loading} className="w-full">
                  <Plus className="w-4 h-4" /> Register Vehicle
                </Button>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full py-3"
              disabled={!foundVehicle}
              onClick={() => setStep(1)}
            >
              Next: Incident Details <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Incident */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary mb-1">Step 2: Incident Details</h2>
              <p className="text-sm text-text-secondary">Location, type, date, and evidence.</p>
            </div>

            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Location *</label>
              <select
                className={`w-full bg-surface-2 border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent ${step2Errors.locationId ? 'border-primary' : 'border-border'}`}
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                <option value="">— Select Location —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.zone})</option>
                ))}
              </select>
              {step2Errors.locationId && <p className="text-xs text-primary mt-0.5">{step2Errors.locationId}</p>}
            </div>

            {/* Violation Type */}
            <div>
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Violation Type *</label>
              <select
                className={`w-full bg-surface-2 border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent ${step2Errors.typeId ? 'border-primary' : 'border-border'}`}
                value={typeId}
                onChange={e => setTypeId(e.target.value)}
              >
                <option value="">— Select Type —</option>
                {violationTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {formatCurrency(t.baseFine)}</option>
                ))}
              </select>
              {step2Errors.typeId && <p className="text-xs text-primary mt-0.5">{step2Errors.typeId}</p>}
            </div>

            {/* Date/Time */}
            <div>
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                value={violationTime}
                onChange={e => setViolationTime(e.target.value)}
              />
            </div>

            {/* Evidence URL */}
            <Input
              label="Evidence Image URL (optional)"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
            />
            {evidenceUrl && (
              <img src={evidenceUrl} alt="Preview" className="w-full h-32 object-cover rounded-md border border-border" onError={e => e.target.style.display='none'} />
            )}

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-2">Status</label>
              <div className="flex gap-3">
                {['Pending', 'Contested', 'Closed'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 text-xs font-semibold border rounded-md transition-all ${status === s ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-2 border-border text-text-secondary'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" className="flex-1" onClick={() => { if (handleStep2Validate()) setStep(2); }}>
                Review <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-bold text-xl text-text-primary mb-1">Step 3: Review & Submit</h2>
              <p className="text-sm text-text-secondary">Confirm details before logging the violation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface-2 border border-border rounded-lg">
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Vehicle</p>
                <p className="font-mono font-bold text-text-primary">{foundVehicle?.regNumber}</p>
                <p className="text-xs text-text-secondary">{foundVehicle?.ownerName} · {foundVehicle?.vehicleType}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Violation Type</p>
                <p className="font-semibold text-text-primary">{selectedType?.name || '—'}</p>
                <p className="text-xs text-warn font-bold">{formatCurrency(selectedType?.baseFine || 0)} base fine</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Location</p>
                <p className="font-semibold text-text-primary">{selectedLoc?.name || '—'}</p>
                <p className="text-xs text-text-secondary">{selectedLoc?.zone} Zone</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Date & Time</p>
                <p className="font-semibold text-text-primary">{new Date(violationTime).toLocaleString('en-IN')}</p>
                <Badge variant={status === 'Pending' ? 'warn' : status === 'Closed' ? 'info' : 'accent'}>{status}</Badge>
              </div>
              <div>
                <p className="text-xs text-text-secondary mb-0.5">Officer</p>
                <p className="font-semibold text-text-primary">{currentUser?.name}</p>
                <p className="text-xs text-text-muted">Badge: {currentUser?.badgeNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-accent/5 border border-accent/20 rounded-md text-xs text-text-secondary">
              ℹ️ A fine will be auto-generated on submission. If this vehicle has 3+ violations in the last 90 days, the fine will be escalated by <strong className="text-primary">50%</strong>.
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" className="flex-1 py-3" onClick={handleSubmit} loading={loading}>
                Log Violation & Generate Fine
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default LogViolation;
