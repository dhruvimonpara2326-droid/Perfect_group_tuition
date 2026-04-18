import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../utils/translations';
import { getFees, createPaymentOrder, verifyPayment, getRazorpayKey } from '../../services/api';
import { IndianRupee, CheckCircle, AlertTriangle, CreditCard, Wallet, ShieldCheck } from 'lucide-react';

const formatDate = (d) => { if (!d) return '—'; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d; };

const StudentFees = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [paySuccess, setPaySuccess] = useState('');
  const [payError, setPayError] = useState('');

  useEffect(() => { loadFees(); }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const loadFees = async () => {
    try {
      const res = await getFees({ studentId: user._id });
      setFees(res.data[0] || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePayNow = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError('Please enter a valid amount / કૃપા કરીને માન્ય રકમ દાખલ કરો');
      return;
    }
    if (amount > fees.dueAmount) {
      setPayError(`Amount cannot exceed ₹${fees.dueAmount.toLocaleString()} / રકમ ₹${fees.dueAmount.toLocaleString()} થી વધુ ન હોવી જોઈએ`);
      return;
    }

    setPayError('');
    setPaying(true);

    try {
      // Get Razorpay key
      const keyRes = await getRazorpayKey();
      const key = keyRes.data.key;

      // Create order
      const orderRes = await createPaymentOrder({ feeId: fees._id, amount });
      const { orderId, amount: orderAmount, currency } = orderRes.data;

      // Open Razorpay checkout
      const options = {
        key,
        amount: orderAmount,
        currency,
        name: 'Perfect Group Tuition',
        description: `Fee Payment - ${user.name} (Std ${user.standard})`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on server
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              feeId: fees._id,
              amount: orderAmount
            });

            setPaySuccess(`Payment of ₹${amount.toLocaleString()} successful! ID: ${response.razorpay_payment_id}`);
            setShowPayForm(false);
            setPayAmount('');
            loadFees(); // Refresh fee data
            setTimeout(() => setPaySuccess(''), 8000);
          } catch (err) {
            setPayError(err.response?.data?.message || 'Payment verification failed');
          }
          setPaying(false);
        },
        prefill: {
          name: user.name,
          contact: user.mobile || '',
          email: user.email || ''
        },
        notes: {
          studentName: user.name,
          rollNo: user.rollNo,
          standard: user.standard
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPayError(`Payment failed: ${response.error.description}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      setPayError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setPaying(false);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  if (!fees) {
    return (
      <div>
        <div className="page-header"><h1>{t(language, 'FeeStatus')}</h1><p>{t(language, 'ViewFeeDetails')}</p></div>
        <div className="empty-state"><IndianRupee size={48} /><h3>{t(language, 'NoFeeRecordFound')}</h3><p>{t(language, 'NoFeeRecordCreated')}</p></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h1>{t(language, 'FeeStatus')}</h1><p>{t(language, 'ViewFeePaymentDetails')}</p></div>

      {paySuccess && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={20} /> {paySuccess}
        </div>
      )}
      {payError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={20} /> {payError}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><IndianRupee size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'TotalFee')}</h4>
            <div className="stat-value">₹{fees.totalAmount?.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <h4>{t(language, 'Paid')}</h4>
            <div className="stat-value">₹{fees.paidAmount?.toLocaleString()}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${fees.dueAmount > 0 ? 'red' : 'green'}`}>
            {fees.dueAmount > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          </div>
          <div className="stat-info">
            <h4>{t(language, 'Due')}</h4>
            <div className="stat-value">₹{fees.dueAmount?.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Pay Now Section */}
      {fees.dueAmount > 0 && (
        <div className="card" style={{ maxWidth: 600, marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} /> Pay Online / ઓનલાઈન ચૂકવો
            </h3>
            {!showPayForm && (
              <button
                className="btn btn-primary"
                onClick={() => setShowPayForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Wallet size={16} /> Pay Now / હવે ચૂકવો
              </button>
            )}
          </div>
          {showPayForm && (
            <div className="card-body">

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Enter Amount / રકમ દાખલ કરો (Max: ₹{fees.dueAmount.toLocaleString()})
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: '#64748b', fontWeight: 700, fontSize: 16
                    }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ paddingLeft: 32, fontSize: 16, fontWeight: 700 }}
                      placeholder="0"
                      value={payAmount}
                      onChange={e => { setPayAmount(e.target.value); setPayError(''); }}
                      max={fees.dueAmount}
                      min={1}
                    />
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPayAmount(String(fees.dueAmount))}
                    style={{ whiteSpace: 'nowrap', fontSize: 12 }}
                  >
                    Full Amount
                  </button>
                </div>
              </div>

              {/* Quick amount buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {[500, 1000, 2000, 5000].filter(a => a <= fees.dueAmount).map(amt => (
                  <button
                    key={amt}
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setPayAmount(String(amt)); setPayError(''); }}
                    style={{
                      fontSize: 12, fontWeight: 700,
                      background: payAmount === String(amt) ? '#2563eb' : undefined,
                      color: payAmount === String(amt) ? 'white' : undefined
                    }}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={handlePayNow}
                  disabled={paying || !payAmount}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 15, fontWeight: 700, padding: '12px 20px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  }}
                >
                  <ShieldCheck size={18} />
                  {paying ? 'Processing... / પ્રક્રિયા થઈ રહી છે...' : `Pay ₹${Number(payAmount || 0).toLocaleString()} Securely`}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowPayForm(false); setPayAmount(''); setPayError(''); }}
                  style={{ padding: '12px 16px' }}
                >
                  Cancel
                </button>
              </div>

              <div style={{
                marginTop: 12, padding: '8px 12px', borderRadius: 6,
                background: '#f0fdf4', border: '1px solid #a7f3d0',
                fontSize: 11, color: '#065f46', display: 'flex', alignItems: 'center', gap: 6
              }}>
                <ShieldCheck size={14} />
                Payments are secured by Razorpay. 100% safe & secure. / ચૂકવણી Razorpay દ્વારા સુરક્ષિત છે.
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <h3>{t(language, 'Status')}</h3>
          <span className={`badge ${fees.status === 'paid' ? 'badge-green' : fees.status === 'partial' ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: 14, padding: '4px 12px' }}>
            {fees.status === 'paid' ? t(language, 'FullyPaid') : fees.status === 'partial' ? t(language, 'PartiallyPaid') : t(language, 'Due')}
          </span>
        </div>
        <div className="card-body">
          {fees.payments && fees.payments.length > 0 && (
            <>
              <h4 style={{ marginBottom: 12, color: '#334155' }}>{t(language, 'PaymentHistory')}</h4>
              <table className="data-table">
                <thead>
                  <tr><th>{t(language, 'Date')}</th><th>{t(language, 'Amount')}</th><th>{t(language, 'Method')}</th><th>{t(language, 'Note')}</th></tr>
                </thead>
                <tbody>
                  {fees.payments.map((p, i) => (
                    <tr key={i}>
                      <td>{formatDate(p.date)}</td>
                      <td style={{fontWeight:700, color:'#059669'}}>₹{p.amount?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${p.method === 'razorpay' ? 'badge-blue' : 'badge-green'}`}>
                          {p.method === 'razorpay' ? '💳 Online' : p.method}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFees;
