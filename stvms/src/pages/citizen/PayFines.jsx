import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useViolations } from '../../hooks/useViolations';
import { useFines } from '../../hooks/useFines';
import { useVehicles } from '../../hooks/useVehicles';
import { isSandbox, localDb } from '../../config/firebase';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, Clock, Receipt, Banknote } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI (GPay / PhonePe)', icon: '📱' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'cash', label: 'Cash at Counter', icon: '💵' },
];

export const PayFines = () => {
  const { currentUser } = useAuth();
  const { violations } = useViolations();
  const { fines, markFinePaid } = useFines();
  const { vehicles } = useVehicles();
  const navigate = useNavigate();

  const [types] = useState(() => isSandbox ? localDb.get('violation_types') : []);
  const [payModal, setPayModal] = useState(null); // fine object
  const [payMethod, setPayMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [paying, setPaying] = useState(false);
  const [paidIds, setPaidIds] = useState(new Set());

  const myVehicleIds = useMemo(() => {
    if (!currentUser?.regNumber) return new Set(vehicles.map(v => v.id));
    const reg = currentUser.regNumber.replace(/[^A-Z0-9]/g, '');
    return new Set(
      vehicles.filter(v => v.regNumber?.replace(/[^A-Z0-9]/g, '').includes(reg)).map(v => v.id)
    );
  }, [vehicles, currentUser]);

  const myFines = useMemo(() => {
    const myVioIds = new Set(
      violations.filter(v => myVehicleIds.size === 0 || myVehicleIds.has(v.vehicleId)).map(v => v.id)
    );
    return fines.filter(f => myVioIds.has(f.violationId));
  }, [fines, violations, myVehicleIds]);

  const unpaid = myFines.filter(f => !f.isPaid && !paidIds.has(f.id));
  const paid = [...myFines.filter(f => f.isPaid), ...myFines.filter(f => paidIds.has(f.id))];
  const totalDue = unpaid.reduce((acc, f) => acc + (f.amount || 0), 0);

  const getViolation = id => violations.find(v => v.id === id);
  const getType = id => types.find(t => t.id === id);

  const handlePay = async () => {
    if (payMethod === 'upi' && !upiId.trim()) {
      toast.error('Enter a valid UPI ID'); return;
    }
    setPaying(true);
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 1800));
    try {
      await markFinePaid(payModal.id);
      setPaidIds(prev => new Set([...prev, payModal.id]));
      toast.success(`Fine of ${formatCurrency(payModal.amount)} paid via ${PAYMENT_METHODS.find(m => m.id === payMethod)?.label}!`);
      setPayModal(null);
      setUpiId('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-xl text-text-primary">Pay Fines</h2>
        <p className="text-xs text-text-secondary mt-0.5">Settle outstanding traffic fines online</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-text-secondary mb-0.5">Unpaid</p>
          <p className="font-display font-bold text-xl text-primary">{unpaid.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-text-secondary mb-0.5">Total Due</p>
          <p className="font-display font-bold text-xl text-warn">{formatCurrency(totalDue)}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-text-secondary mb-0.5">Paid</p>
          <p className="font-display font-bold text-xl text-safe">{paid.length}</p>
        </div>
      </div>

      {/* Unpaid Section */}
      {unpaid.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-wider mb-3">Outstanding Fines</h3>
          <div className="space-y-3">
            {unpaid.map(f => {
              const vio = getViolation(f.violationId);
              const type = getType(vio?.typeId);
              return (
                <div key={f.id} className="bg-surface border border-primary/20 rounded-lg p-5 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-text-primary text-sm">{type?.name || 'Traffic Fine'}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Due: <span className="text-warn font-semibold">{formatDate(f.dueDate)}</span>
                        </p>
                        <p className="text-xs font-mono text-text-muted">Fine ID: {f.id?.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-2xl text-warn">{formatCurrency(f.amount)}</p>
                      <Badge variant="danger">Unpaid</Badge>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full mt-4 py-2.5"
                    onClick={() => setPayModal(f)}
                  >
                    Pay {formatCurrency(f.amount)} Now
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid Section */}
      {paid.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm text-text-secondary uppercase tracking-wider mb-3">Payment History</h3>
          <div className="space-y-2">
            {paid.map(f => {
              const vio = getViolation(f.violationId);
              const type = getType(vio?.typeId);
              return (
                <div key={f.id} className="bg-surface border border-safe/20 rounded-lg p-4 flex items-center gap-4">
                  <CheckCircle className="w-5 h-5 text-safe shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-text-primary">{type?.name || 'Traffic Fine'}</p>
                    <p className="text-xs text-text-muted">Paid on {formatDate(f.paidAt || new Date())}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-safe">{formatCurrency(f.amount)}</p>
                    <Badge variant="safe">Paid</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {unpaid.length === 0 && paid.length === 0 && (
        <EmptyState icon={CheckCircle} title="No fines!" message="You have no outstanding fines. Keep up the safe driving!" />
      )}

      {/* Payment Modal */}
      <Modal isOpen={!!payModal} onClose={() => !paying && setPayModal(null)} title="Complete Payment" className="max-w-md">
        {payModal && (
          <div className="space-y-5">
            {/* Amount */}
            <div className="flex items-center justify-between p-4 bg-surface-2 rounded-lg border border-border">
              <div>
                <p className="text-xs text-text-secondary">Fine Amount</p>
                <p className="font-display font-bold text-3xl text-warn">{formatCurrency(payModal.amount)}</p>
              </div>
              <Receipt className="w-8 h-8 text-text-muted" />
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider mb-3">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                      payMethod === m.id
                        ? 'bg-accent/10 border-accent text-text-primary'
                        : 'bg-surface-2 border-border text-text-secondary hover:border-accent/40'
                    }`}
                  >
                    <span className="text-lg">{m.icon}</span>
                    <span className="text-xs font-semibold">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI ID Input */}
            {payMethod === 'upi' && (
              <div>
                <label className="text-xs font-semibold text-text-secondary font-display uppercase tracking-wider block mb-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="name@upi"
                  className="w-full bg-surface-2 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-all"
                />
              </div>
            )}

            {payMethod === 'cash' && (
              <div className="p-3 bg-warn/10 border border-warn/30 rounded-md text-xs text-warn">
                Please visit the nearest traffic authority office with Fine ID: <span className="font-mono font-bold">{payModal.id?.slice(-8)}</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setPayModal(null)} disabled={paying}>Cancel</Button>
              <Button
                variant="primary"
                className="flex-1 py-3"
                onClick={handlePay}
                loading={paying}
              >
                {paying ? 'Processing...' : `Pay ${formatCurrency(payModal.amount)}`}
              </Button>
            </div>

            <p className="text-xs text-center text-text-muted">
              🔒 Payments are simulated in demo mode
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default PayFines;
