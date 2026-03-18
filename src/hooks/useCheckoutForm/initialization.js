
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/services/api";
import { INITIAL_CHECKOUT_FORM_DATA } from "./constants";
import React from 'react';


export const useFormInitialization = (
    cart, 
    user, 
    authCustomer, 
    setFormData,
    setOverallLoading,
    setInitializationCompleteProp,
    triggerAuthCustomerFetch 
) => {
  const navigate = useNavigate();
  const [shippingRules, setShippingRules] = useState([]);
  const [previousAddresses, setPreviousAddresses] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [internalInitializationComplete, setInternalInitializationComplete] = useState(false);
  const initializationRef = useRef(false);


  const fetchShippingRulesLocal = useCallback(async () => {
    try {
      console.log('📦 Fetching shipping rules from database...');
      const data = await api.get('/shipping');
      console.log('📦 Shipping rules fetched:', data?.length || 0, 'rules');
      setShippingRules(data || []);
    } catch (error) {
      console.error('❌ Error fetching shipping rules:', error);
      setShippingRules([]); 
    }
  }, []);

  const fetchPreviousAddressesLocal = useCallback(async (currentUserId, currentAuthCustomer) => {
    if (!currentUserId) {
      console.log('👤 No user ID, skipping previous addresses fetch');
      return;
    }
    try {
      console.log('🏠 Fetching previous addresses for user:', currentUserId);
      const orders = await api.get(`/orders?user_id=${currentUserId}&limit=5&sort_by=created_at&sort_order=desc`);

      const uniqueAddresses = (orders.orders || []).reduce((acc, order) => {
        const addressString = `${order.shipping_address}-${order.shipping_city}-${order.shipping_country}`;
        if (!acc.find(a => `${a.address}-${a.city}-${a.country}` === addressString)) {
          acc.push({
            address: order.shipping_address,
            city: order.shipping_city,
            state: order.shipping_state,
            country: order.shipping_country,
            postalCode: order.shipping_postal_code,
            phone: order.shipping_phone,
            email: order.shipping_email,
            firstName: currentAuthCustomer?.first_name || '',
            lastName: currentAuthCustomer?.last_name || '',
          });
        }
        return acc;
      }, []);
      console.log('🏠 Previous addresses fetched:', uniqueAddresses.length, 'addresses');
      setPreviousAddresses(uniqueAddresses);
    } catch (error) {
      console.error('❌ Error fetching previous addresses:', error);
      setPreviousAddresses([]); 
    }
  }, []);


  useEffect(() => {
    let isMounted = true;
    if (cart.length === 0 && internalInitializationComplete) { 
        const sessionId = localStorage.getItem("customer_session_id") || localStorage.getItem("session_id");
        if (sessionId) { 
            // Use the new API instead of Supabase
            fetch(`${API_BASE_URL}/cart?session_id=${sessionId}`)
            .then(response => response.json())
            .then(cartItems => {
                if (isMounted && cartItems.length === 0) {
                    navigate("/cart");
                }
            })
            .catch(error => {
                console.error('Error checking cart items:', error);
            });
        } else {
             if(isMounted) navigate("/cart"); 
        }
    }
    return () => { isMounted = false; };
  }, [cart, navigate, internalInitializationComplete]);

  useEffect(() => {
    console.log('🔄 Initialization effect triggered:', {
      user: !!user,
      authCustomer: !!authCustomer,
      alreadyInitialized: initializationRef.current,
      userId: user?.id,
      authCustomerId: authCustomer?.id,
      cartLength: cart?.length
    });
    
    // Skip if already initialized using ref
    if (initializationRef.current) {
      console.log('⏭️ Skipping initialization - already complete (ref)');
      return;
    }

    let isMounted = true;
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && initialLoading) {
        console.warn('⚠️ Initialization timeout - forcing completion');
        setOverallLoading(false);
        setInitialLoading(false);
        setInternalInitializationComplete(true);
        setInitializationCompleteProp(true);
        initializationRef.current = true;
      }
    }, 10000); // 10 second timeout
    
    const initialize = async () => {
      if (!isMounted || initializationRef.current) return;
      
      console.log('🚀 Starting checkout initialization...');
      setOverallLoading(true); 
      setInitialLoading(true);

      try {
        if (user && !authCustomer) {
          console.log('👤 Fetching auth customer...');
          await triggerAuthCustomerFetch(); 
        }

        console.log('📦 Fetching shipping rules...');
        try {
          await fetchShippingRulesLocal();
          console.log('✅ Shipping rules fetch completed');
        } catch (error) {
          console.error('❌ Shipping rules fetch failed:', error);
        }
        
        if (user && authCustomer) {
          console.log('✅ Setting form data for authenticated user...');
          if (isMounted) {
            setFormData(prev => ({
              ...INITIAL_CHECKOUT_FORM_DATA, 
              ...prev, 
              firstName: authCustomer.first_name || "",
              lastName: authCustomer.last_name || "",
              email: authCustomer.email || "",
              phone: authCustomer.phone || "",
              address: authCustomer.address || "",
              city: authCustomer.city || "",
              state: authCustomer.state || "",
              country: authCustomer.country || "",
              postalCode: authCustomer.postal_code || "",
              orderNotes: prev.orderNotes || INITIAL_CHECKOUT_FORM_DATA.orderNotes,
            }));
          }
          console.log('🏠 Fetching previous addresses...');
          await fetchPreviousAddressesLocal(user.id, authCustomer);
        } else if (!user) { 
          console.log('👤 Setting form data for guest user...');
          if (isMounted) {
            setFormData(prev => ({
                ...INITIAL_CHECKOUT_FORM_DATA,
                orderNotes: prev.orderNotes || INITIAL_CHECKOUT_FORM_DATA.orderNotes, 
            }));
            setPreviousAddresses([]); 
          }
        }
        
        console.log('✅ Initialization complete!');
        if (isMounted) {
          setOverallLoading(false); 
          setInitialLoading(false);
          setInternalInitializationComplete(true); 
          setInitializationCompleteProp(true); 
          initializationRef.current = true; // Mark as complete
        }
      } catch (error) {
        console.error('❌ Error during initialization:', error);
        if (isMounted) {
          setOverallLoading(false); 
          setInitialLoading(false);
          setInternalInitializationComplete(true); 
          setInitializationCompleteProp(true); 
          initializationRef.current = true; // Mark as complete even on error
        }
      }
    };
    
    initialize();
    
    return () => { 
      isMounted = false; 
      clearTimeout(timeoutId);
      // Reset ref on unmount
      initializationRef.current = false;
    };
  }, [user?.id, authCustomer?.id, setFormData, setOverallLoading, setInitializationCompleteProp]); 
  
  return { shippingRules, previousAddresses, initialLoading };
};
