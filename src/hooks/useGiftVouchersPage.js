import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { createGiftVoucher } from '@/lib/db/issuedGiftVouchers';
import { fetchActiveGiftVoucherTypes as fetchTypes } from '@/lib/db/giftVoucherTypes';
import { useCurrency } from '@/context/CurrencyContext';
import { usePayment } from '@/hooks/usePayment';
import { useNavigate } from 'react-router-dom';

const generateVoucherCode = () => {
  const prefix = "GV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
};

const useGiftVouchersPage = () => {
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [recipientDetails, setRecipientDetails] = useState({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { exchangeRate } = useCurrency();
  const { paymentLoading, scriptLoaded } = usePayment();
  const navigate = useNavigate();

  const fetchVoucherTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTypes();
      const initialQuantities = {};
      const initialRecipientDetails = {};
      (data || []).forEach(voucher => {
        initialQuantities[voucher.id] = 1;
        initialRecipientDetails[voucher.id] = { 
          name: '', 
          email: '', 
          message: '',
          callNumber: '',
          whatsappNumber: '' 
        };
      });
      setQuantities(initialQuantities);
      setRecipientDetails(initialRecipientDetails);
      setVoucherTypes(data || []);
    } catch (error) {
      console.error('Error fetching active vouchers:', error);
      toast({
        title: "Error",
        description: "Failed to load gift vouchers. " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVoucherTypes();
  }, [fetchVoucherTypes]);

  const updateQuantity = useCallback((voucherId, change) => {
    setQuantities(prev => {
      const newQuantity = (prev[voucherId] || 1) + change;
      if (newQuantity < 1 || newQuantity > 10) return prev;
      return { ...prev, [voucherId]: newQuantity };
    });
  }, []);

  const handleRecipientDetailChange = useCallback((voucherId, field, value) => {
    setRecipientDetails(prev => ({
      ...prev,
      [voucherId]: {
        ...(prev[voucherId] || {}),
        [field]: value,
      },
    }));
  }, []);

  const createVouchersAfterPayment = useCallback(async (voucherType, quantity, recipientData, paymentReference) => {
    console.log('🎫 Creating vouchers after successful payment:', {
      voucherType: voucherType.name,
      quantity,
      recipient: recipientData.name,
      paymentReference
    });

    try {
      const createdVouchers = [];
      
      for (let i = 0; i < quantity; i++) {
        const newVoucherCode = generateVoucherCode();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + voucherType.validity_months);

        const voucherData = {
          code: newVoucherCode,
          amount: voucherType.amount,
          initial_amount: voucherType.amount,
          status: 'active',
          purchaser_id: user?.id || null,
          purchaser_name: user?.user_metadata?.full_name || user?.email || 'Guest User',
          purchaser_email: user?.email || recipientData.email,
          recipient_email: recipientData.email,
          recipient_name: recipientData.name,
          recipient_call_number: recipientData.callNumber || null,
          recipient_whatsapp_number: recipientData.whatsappNumber || null,
          message: recipientData.message || null,
          purchased_at: new Date().toISOString(),
          expires_at: expiryDate.toISOString(),
          voucher_type_id: voucherType.id,
          redeemed_amount: 0,
          payment_reference: paymentReference,
        };
        
        const createdVoucher = await createGiftVoucher(voucherData);
        createdVouchers.push(createdVoucher);
      }

      console.log('✅ Successfully created vouchers:', createdVouchers.length);
      
      toast({
        title: "Payment Successful! 🎉",
        description: `${quantity} x ${voucherType.name} gift voucher(s) purchased and sent to ${recipientData.email}.`,
        variant: "success",
        duration: 7000,
      });

      // Reset form data for this voucher
      setRecipientDetails(prev => ({ 
        ...prev, 
        [voucherType.id]: { 
          name: '', 
          email: '', 
          message: '',
          callNumber: '',
          whatsappNumber: ''
        } 
      }));
      setQuantities(prev => ({ ...prev, [voucherType.id]: 1 }));

      return createdVouchers;
    } catch (error) {
      console.error('Error creating gift vouchers after payment:', error);
      toast({
        title: "Voucher Creation Failed",
        description: `Payment successful but voucher creation failed. Contact support with reference: ${paymentReference}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  const handleVoucherPayment = useCallback(async (voucherType) => {
    const quantity = quantities[voucherType.id] || 1;
    const recipient = recipientDetails[voucherType.id];

    // Validation
    if (!recipient || !recipient.name.trim() || !recipient.email.trim()) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter recipient's name and email.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(recipient.email)) {
      toast({ 
        title: "Invalid Email", 
        description: "Please enter a valid recipient email address.", 
        variant: "destructive" 
      });
      return;
    }

    if (!scriptLoaded) {
      toast({
        title: "Payment System Loading",
        description: "Please wait for the payment system to load.",
        variant: "destructive"
      });
      return;
    }

    setProcessingPayment(voucherType.id);

    try {
      // Calculate amounts - voucher.amount is already in cents, convert to USD first
      const voucherAmountUSD = voucherType.amount / 100; // Convert from cents to USD
      const totalAmountUSD = voucherAmountUSD * quantity;
      const totalAmountGHS = totalAmountUSD * exchangeRate;

      console.log('💳 Processing voucher payment:', {
        voucherType: voucherType.name,
        quantity,
        voucherAmountCents: voucherType.amount,
        unitPriceUSD: voucherAmountUSD,
        totalAmountUSD,
        totalAmountGHS,
        exchangeRate,
        recipient: recipient.name
      });

      // Get payment configuration from environment variables
      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      
      if (!paystackPublicKey) {
        throw new Error('Payment system not configured. Please contact support.');
      }

      // Check if PaystackPop is available
      if (!window.PaystackPop) {
        throw new Error('Payment system not loaded. Please refresh the page and try again.');
      }

      const amountInKobo = Math.round(totalAmountGHS * 100);
      const reference = `GV-${Date.now()}-${voucherType.id}`;

      const paymentConfig = {
        key: paystackPublicKey,
        email: recipient.email,
        amount: amountInKobo,
        currency: 'GHS',
        ref: reference,
        metadata: {
          voucher_type_id: voucherType.id,
          voucher_type_name: voucherType.name,
          quantity: quantity,
          unit_amount_usd: voucherAmountUSD,
          total_amount_usd: totalAmountUSD,
          recipient_name: recipient.name,
          recipient_email: recipient.email,
          recipient_message: recipient.message || '',
          purchaser_id: user?.id || null,
          purchaser_email: user?.email || recipient.email,
          payment_type: 'gift_voucher'
        },
        callback: async (response) => {
          console.log('🎉 Paystack payment successful for vouchers:', response);
          try {
            await createVouchersAfterPayment(voucherType, quantity, recipient, response.reference);
          } catch (voucherError) {
            console.error('Voucher creation failed:', voucherError);
          }
        },
        onClose: () => {
          console.log('💔 Payment dialog closed');
          setProcessingPayment(null);
        }
      };

      console.log('🚀 Launching voucher payment popup...');
      console.log('📄 Payment config:', {
        email: paymentConfig.email,
        amount: paymentConfig.amount,
        currency: paymentConfig.currency,
        ref: paymentConfig.ref
      });

      // Launch payment popup
      const handler = window.PaystackPop.setup(paymentConfig);
      handler.openIframe();

    } catch (error) {
      console.error('Error processing voucher payment:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive"
      });
      setProcessingPayment(null);
    }
  }, [quantities, recipientDetails, user, toast, exchangeRate, scriptLoaded, createVouchersAfterPayment]);

  return {
    voucherTypes,
    loading,
    processingPayment: processingPayment || paymentLoading,
    quantities,
    recipientDetails,
    updateQuantity,
    handleRecipientDetailChange,
    handleSimulatedPayment: handleVoucherPayment,
    scriptLoaded
  };
};

export default useGiftVouchersPage;
