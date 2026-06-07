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
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-16 text-center animate-fade-up">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-safe/25 to-safe/5 border border-safe/30 flex items-center justify-center mb-6 animate-bounce shadow-glow-safe">
          <CheckCircle className="w-10 h-10 text-safe" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-text-primary mb-2">Violation Logged!</h2>
        <p className="text-text-secondary text-sm mb-1 leading-relaxed">
          Fine of <span className="text-warn font-extrabold font-mono">{formatCurrency(success.amount)}</span> auto-generated.
        </p>
        <p className="text-xs text-text-muted font-mono mb-8">ID: {success.id}</p>
        <div className="flex gap-4">
          <Button variant="secondary" className="cursor-pointer" onClick={() => { setStep(0); setSuccess(null); setRegInput(''); setFoundVehicle(null); }}>Log Another</Button>
          <Button variant="primary" className="cursor-pointer shadow-glow-primary" onClick={() => navigate('/violations')}>View All Violations</Button>
        </div>
      </div>
    );
  }

  const selectedType = violationTypes.find(t => t.id === typeId);
  const selectedLoc = locations.find(l => l.id === locationId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4 px-6 py-5 glass-card rounded-2xl shadow-card">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2.5 text-xs font-bold font-display transition-all duration-300 ${i === step ? 'text-text-primary' : i < step ? 'text-safe' : 'text-text-muted'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold border transition-all duration-300 ${
                i < step ? 'bg-safe border-safe text-bg shadow-glow-safe' 
                : i === step ? 'bg-accent/15 border-accent text-accent shadow-glow-accent' 
                : 'bg-surface-2 border-border text-text-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden md:inline tracking-wider uppercase">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 transition-all duration-300 ${i < step ? 'bg-safe shadow-glow-safe' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="glass-card rounded-2xl shadow-card p-8 border border-border animate-fade-up">
        {/* STEP 1: Vehicle */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-extrabold text-xl text-text-primary mb-1 uppercase tracking-wide">Step 1: Identify Vehicle</h2>
              <p className="text-xs text-text-secondary font-medium">Enter the registration number to search the vehicle database.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
              <input
                className="w-full bg-surface-2 border border-border rounded-xl pl-11 pr-4 py-3.5 text-sm font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all uppercase tracking-widest"
                placeholder="KA-01-AB-1234"
                value={regInput}
                onChange={e => setRegInput(formatRegNumber(e.target.value))}
                maxLength={13}
              />
            </div>

            {/* Found Vehicle */}
            {foundVehicle && (
              <div className="flex items-center gap-4 p-5 bg-safe/5 border border-safe/25 rounded-2xl shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-safe/10 border border-safe/20 flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6 text-safe" />
                </div>
                <div>
                  <p className="font-mono font-extrabold text-text-primary text-base tracking-wider">{foundVehicle.regNumber}</p>
                  <p className="text-xs text-text-secondary font-semibold mt-0.5">{foundVehicle.ownerName} · {foundVehicle.vehicleType}</p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">{foundVehicle.ownerPhone}</p>
                </div>
                <Badge variant="safe" className="ml-auto animate-pulse">Found</Badge>
              </div>
            )}

            {/* Add new vehicle */}
            {showAddVehicle && !foundVehicle && (
              <div className="p-5 bg-warn/5 border border-warn/25 rounded-2xl space-y-4 shadow-sm animate-fade-up">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-warn animate-pulse" />
                  <p className="text-xs text-warn font-extrabold uppercase tracking-wide">Vehicle not in database — Add New?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="font-display font-extrabold text-xl text-text-primary mb-1 uppercase tracking-wide">Step 2: Incident Details</h2>
              <p className="text-xs text-text-secondary font-medium">Select location, violation type, date/time, and add evidence.</p>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block">Location *</label>
              <select
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200 ${step2Errors.locationId ? 'border-primary shadow-glow-primary/10' : 'border-border'}`}
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                <option value="" className="bg-bg text-text-secondary">— Select Location —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id} className="bg-bg text-text-primary">{l.name} ({l.zone})</option>
                ))}
              </select>
              {step2Errors.locationId && <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {step2Errors.locationId}</p>}
            </div>

            {/* Violation Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block">Violation Type *</label>
              <select
                className={`w-full bg-surface-2 border rounded-xl px-4 py-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200 ${step2Errors.typeId ? 'border-primary shadow-glow-primary/10' : 'border-border'}`}
                value={typeId}
                onChange={e => setTypeId(e.target.value)}
              >
                <option value="" className="bg-bg text-text-secondary">— Select Type —</option>
                {violationTypes.map(t => (
                  <option key={t.id} value={t.id} className="bg-bg text-text-primary">{t.name} — {formatCurrency(t.baseFine)}</option>
                ))}
              </select>
              {step2Errors.typeId && <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {step2Errors.typeId}</p>}
            </div>

            {/* Date/Time */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block">Date & Time *</label>
              <input
                type="datetime-local"
                className={`w-full bg-surface-2 border border-border rounded-xl px-4 py-3.5 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all duration-200 ${step2Errors.violationTime ? 'border-primary' : ''}`}
                value={violationTime}
                onChange={e => setViolationTime(e.target.value)}
              />
              {step2Errors.violationTime && <p className="text-xs text-primary font-medium mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {step2Errors.violationTime}</p>}
            </div>

            {/* Evidence URL */}
            <Input
              label="Evidence Image URL (optional)"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
            {evidenceUrl && (
              <div className="relative group rounded-xl overflow-hidden border border-border bg-surface-2 aspect-video max-h-48">
                <img 
                  src={evidenceUrl} 
                  alt="Evidence Preview" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  onError={e => e.target.style.display='none'} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent flex items-end p-3">
                  <span className="text-[10px] uppercase tracking-wider text-text-primary font-bold px-2 py-1 rounded bg-bg/80 border border-border">Evidence Image Preview</span>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block">Status</label>
              <div className="flex gap-3">
                {['Pending', 'Contested', 'Closed'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-3 text-xs font-extrabold font-display uppercase tracking-wider border rounded-xl transition-all duration-200 active:scale-95 ${
                      status === s 
                        ? s === 'Pending' ? 'bg-warn/15 border-warn text-warn shadow-glow-warn'
                          : s === 'Closed' ? 'bg-safe/15 border-safe text-safe shadow-glow-safe'
                          : 'bg-accent/15 border-accent text-accent shadow-glow-accent'
                        : 'bg-surface-2 border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Button variant="secondary" className="flex-1 cursor-pointer" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" className="flex-1 cursor-pointer shadow-glow-primary" onClick={() => { if (handleStep2Validate()) setStep(2); }}>
                Review Details <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div>
              <h2 className="font-display font-extrabold text-xl text-text-primary mb-1 uppercase tracking-wide">Step 3: Review & Submit</h2>
              <p className="text-xs text-text-secondary font-medium">Verify all recorded incident parameters before generating the fine.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-surface-2/40 border border-border/80 rounded-2xl">
              <div className="p-4 rounded-xl bg-surface/50 border border-border/30">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold font-display mb-1.5">Vehicle Identity</p>
                <p className="font-mono font-extrabold text-text-primary text-lg tracking-wider mb-0.5">{foundVehicle?.regNumber}</p>
                <p className="text-xs text-text-secondary font-medium">{foundVehicle?.ownerName} · <span className="text-text-muted">{foundVehicle?.vehicleType}</span></p>
              </div>

              <div className="p-4 rounded-xl bg-surface/50 border border-border/30">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold font-display mb-1.5">Violation details</p>
                <p className="font-extrabold text-text-primary text-base leading-tight mb-1">{selectedType?.name || '—'}</p>
                <p className="text-xs text-warn font-extrabold font-mono">{formatCurrency(selectedType?.baseFine || 0)} <span className="text-[10px] text-text-muted uppercase font-sans tracking-wide">base fine</span></p>
              </div>

              <div className="p-4 rounded-xl bg-surface/50 border border-border/30">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold font-display mb-1.5">Incident Location</p>
                <p className="font-bold text-text-primary text-sm mb-0.5">{selectedLoc?.name || '—'}</p>
                <p className="text-xs text-text-secondary font-semibold"><span className="text-accent">{selectedLoc?.zone || '—'}</span> Zone</p>
              </div>

              <div className="p-4 rounded-xl bg-surface/50 border border-border/30">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold font-display mb-1.5">Timestamp & Status</p>
                <p className="font-bold text-text-primary text-sm mb-1">{new Date(violationTime).toLocaleString('en-IN')}</p>
                <Badge 
                  variant={status === 'Pending' ? 'warn' : status === 'Closed' ? 'safe' : 'accent'} 
                  className="font-extrabold text-[10px] uppercase tracking-widest"
                >
                  {status}
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-surface/50 border border-border/30 sm:col-span-2">
                <p className="text-[10px] text-text-secondary uppercase tracking-widest font-extrabold font-display mb-1.5">Recording Officer</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-text-primary text-sm">{currentUser?.name}</p>
                    <p className="text-xs text-text-muted font-mono mt-0.5">Badge Number: {currentUser?.badgeNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Station / Agency</p>
                    <p className="text-xs text-text-secondary font-semibold">{currentUser?.stationName || 'City Traffic HQ'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Escalation alert */}
            <div className="p-4 bg-warn/5 border border-warn/25 rounded-2xl text-xs text-text-secondary flex gap-3 items-start animate-pulse-glow">
              <AlertCircle className="w-5 h-5 text-warn shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-warn uppercase tracking-wider mb-0.5">Automated Escaped Escalation Notice</p>
                <p className="leading-relaxed">
                  A fine will be auto-generated on submission. If this vehicle registry lists <strong className="text-text-primary">3 or more active violations</strong> in the past 90 days, the fine amount will escalate by <strong className="text-warn font-extrabold">50%</strong> automatically under smart-road provisions.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Button variant="secondary" className="flex-1 cursor-pointer" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" className="flex-1 cursor-pointer shadow-glow-primary py-3.5" onClick={handleSubmit} loading={loading}>
                Log Violation & File Fine
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default LogViolation;
