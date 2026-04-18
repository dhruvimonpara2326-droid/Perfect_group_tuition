const Razorpay = require('razorpay');
const crypto = require('crypto');
const Fees = require('../models/Fees');

// Lazy initialization to ensure env vars are loaded
let razorpay = null;
const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured in .env file');
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return razorpay;
};

// POST /api/payment/create-order
const createOrder = async (req, res) => {
  try {
    const { feeId, amount } = req.body;

    if (!feeId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Fee ID and valid amount are required' });
    }

    const fee = await Fees.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (amount > fee.dueAmount) {
      return res.status(400).json({ message: `Amount cannot exceed due amount of ₹${fee.dueAmount}` });
    }

    const rzp = getRazorpayInstance();

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `rcpt_${feeId.toString().slice(-8)}_${Date.now().toString(36)}`,
      notes: {
        feeId: feeId,
        studentId: fee.studentId.toString(),
        purpose: 'Tuition Fee Payment'
      }
    };

    console.log('Creating Razorpay order with options:', JSON.stringify(options));
    const order = await rzp.orders.create(options);
    console.log('Razorpay order created:', order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      feeId: feeId,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error?.error || error);
    const errorMsg = error?.error?.description || error?.message || 'Failed to create payment order';
    res.status(500).json({ message: errorMsg });
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feeId, amount } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Payment verified — record it
    const fee = await Fees.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    const paymentAmount = amount / 100; // Convert paise back to rupees

    fee.payments.push({
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      method: 'razorpay',
      note: `Online Payment | ID: ${razorpay_payment_id}`
    });

    fee.paidAmount += paymentAmount;
    fee.dueAmount = fee.totalAmount - fee.paidAmount;

    if (fee.dueAmount <= 0) {
      fee.status = 'paid';
      fee.dueAmount = 0;
    } else {
      fee.status = 'partial';
    }

    await fee.save();

    res.json({
      message: 'Payment successful!',
      paymentId: razorpay_payment_id,
      fee
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
};

// GET /api/payment/key
const getKey = async (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

module.exports = { createOrder, verifyPayment, getKey };
