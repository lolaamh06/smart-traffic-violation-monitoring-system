import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViolations } from '../../hooks/useViolations';
import { isSandbox, localDb } from '../../config/firebase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useFines } from '../../hooks/useFines';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Scale, CheckCircle, AlertTriangle, FileText,
  Clock, Upload, ChevronRight
} from 'lucide-react';

const REASONS = [
  'I was not driving the vehicle at this time',
  'The signal/sign was not clearly visible',
  'I had an emergency situation',
  'Equipment malfunction / incorrect reading',
  'Vehicle ownership dispute',
  'Other reason (explain below)',
];

const STEPS = ['Select Violation', 'Choose Reason', 'Submit Contest'];

export const ContestViolation = () => {
  const { id: preselectedId } = useParams();
  const { currentUser } = useAuth();
  const { violations, updateViolationStatus } = useViolations();
  const { fines } = useFines();
  const navigate = useNavigate();

  const [types] = useState(() => isSandbox ? localDb.get('violation_types') : []);
  const [locations] = useState(() => isSandbox ? localDb.get('locations') : []);

  const [step, setStep] = useState(preselectedId ? 1 : 0);
  const [selectedVioId, setSelectedVioId] = useState(preselectedId || '');
  const [reason, setReason] = useState('');
  const [explanation, setExplanation] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Only pending violations can be contested
  const pendingViolations = violations.filter(v => v.status === 'Pending');
  const selectedVio = violations.find(v => v.id === selectedVioId);
  const selectedType = types.find(t => t.id === selectedVio?.typeId);
  const selectedLoc = locations.find(l => l.id === selectedVio?.locationId);
  const selectedFine = fines.find(f => f.violationId === selectedVioId);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Please select a reason.'); return; }
    if (!explanation.trim() || explanation.trim().length < 20) {
      toast.error('Please provide at least 20 characters of explanation.');
      return;
    }
    setSubmitting(true);
    try {
      await updateViolationStatus(selectedVioId, 'Contested');
      // Store contest record in localDb
      if (isSandbox) {
        const contests = localDb.get('contests') || [];
        contests.push({
          id: `CONT-${Date.now()}`,
          violationId: selectedVioId,
          citizenId: currentUser?.uid || 'demo',
          reason,
          explanation,
          evidenceUrl: evidence,
          submittedAt: new Date().toISOString(),
          status: 'Under Review',
        });
        localDb.set('contests', contests);
      }
      setSubmitted(true);
      toast.success('Contest submitted! An officer will review your case.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-6">
          <Scale className="w-10 h-10 text-accent" />
        </div>
        <h2 className="font-display font-bold text-2xl text-text-primary mb-2">Contest Submitted!</h2>
        <p className="text-text-secondary text-sm mb-2">
          Your contestation is now <Badge variant="accent">Under Review</Badge>
        </p>
        <p className="text-xs text-text-muted mb-8">
          An officer will review your case within 7 working days.<br />
          You will be notified via email once a decision is made.
        </p>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate('/citizen/violations')}>
            View Violations
          </Button>
          <Button variant="primary" onClick={() => { setSubmitted(false); setStep(0); setSelectedVioId(''); setReason(''); setExplanation(''); }}>
            Contest Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl text-text-primary">Contest a Violation</h2>
          <p className="text-sm text-text-secondary">Submit your case for officer review</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
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
              <span className="hidden sm:inline text-xs">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 transition-all ${i < step ? 'bg-safe' : 'bg-border'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-card p-6">
        {/* STEP 0: Select Violation */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-text-primary">Which violation do you want to contest?</h3>
            {pendingViolations.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-12 h-12 text-safe mx-auto mb-3 opacity-50" />
                <p className="text-text-secondary text-sm">No pending violations to contest.</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate('/citizen/violations')}>
                  View All Violations
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingViolations.map(v => {
                  const type = types.find(t => t.id === v.typeId);
                  const loc = locations.find(l => l.id === v.locationId);
                  const fine = fines.find(f => f.violationId === v.id);
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVioId(v.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                        selectedVioId === v.id
                          ? 'bg-accent/10 border-accent'
                          : 'bg-surface-2 border-border hover:border-accent/40'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedVioId === v.id ? 'border-accent bg-accent' : 'border-border'
                      }`}>
                        {selectedVioId === v.id && <div className="w-2 h-2 rounded-full bg-bg" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-text-primary">{type?.name}</p>
                        <p className="text-xs text-text-secondary">{loc?.name} · {formatDate(v.violationTime)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-warn text-sm">{formatCurrency(fine?.amount || 0)}</p>
                        <Badge variant="warn">Pending</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <Button
              variant="primary"
              className="w-full"
              disabled={!selectedVioId}
              onClick={() => setStep(1)}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 1: Reason */}
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-display font-bold text-lg text-text-primary">Why are you contesting?</h3>

            {/* Selected violation recap */}
            {selectedVio && (
              <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-md border border-border">
                <AlertTriangle className="w-4 h-4 text-warn shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">{selectedType?.name}</p>
                  <p className="text-xs text-text-secondary">{selectedLoc?.name} · {formatDate(selectedVio.violationTime)}</p>
                </div>
                <p className="ml-auto font-mono font-bold text-warn text-sm">{formatCurrency(selectedFine?.amount || 0)}</p>
              </div>
            )}

            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    reason === r ? 'bg-accent/10 border-accent' : 'bg-surface-2 border-border hover:border-accent/40'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                    reason === r ? 'border-accent bg-accent' : 'border-border'
                  }`} />
                  <span className="text-sm text-text-primary">{r}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(0)}>Back</Button>
              <Button variant="primary" className="flex-1" disabled={!reason} onClick={() => setStep(2)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Submit */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="font-display font-bold text-lg text-text-primary">Explain your case</h3>

            <div className="p-3 bg-surface-2 rounded-md border border-border">
              <p className="text-xs text-text-secondary mb-0.5">Selected Reason</p>
              <p className="text-sm font-semibold text-text-primary">{reason}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">
                Detailed Explanation * <span className="text-text-muted font-normal">(min 20 chars)</span>
              </label>
              <textarea
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                rows={5}
                placeholder="Describe in detail why this violation should be reviewed. Include any supporting information like GPS data, timestamps, witnesses, etc."
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all resize-none"
              />
              <p className="text-xs text-text-muted mt-0.5">{explanation.length} / 20 minimum</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">
                Evidence URL (optional)
              </label>
              <input
                type="url"
                value={evidence}
                onChange={e => setEvidence(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
              />
              <p className="text-xs text-text-muted mt-0.5">Link to photos, documents, or dashcam footage</p>
            </div>

            <div className="p-3 bg-warn/5 border border-warn/30 rounded-md text-xs text-text-secondary">
              ⚖️ By submitting, you confirm that the information provided is truthful. False contestations may attract additional penalties.
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button
                variant="primary"
                className="flex-1 py-3"
                onClick={handleSubmit}
                loading={submitting}
              >
                Submit Contestation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ContestViolation;
