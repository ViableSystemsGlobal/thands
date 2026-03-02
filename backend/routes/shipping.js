const express = require('express');
const { query } = require('../config/database');
const dhlService = require('../services/dhlService');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/shipping - Get shipping rules
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, country, shipping_cost, per_kg_rate, free_shipping_threshold, 
             estimated_days_min, estimated_days_max, is_active,
             min_order_value, max_order_value, state
      FROM shipping_rules 
      WHERE is_active = true 
      ORDER BY name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rules' });
  }
});

/**
 * GET /api/shipping/active - Alias for GET /api/shipping (for backward compatibility)
 */
router.get('/active', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, country, shipping_cost, per_kg_rate, free_shipping_threshold, 
             estimated_days_min, estimated_days_max, is_active,
             min_order_value, max_order_value, state
      FROM shipping_rules 
      WHERE is_active = true 
      ORDER BY name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipping rules:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rules' });
  }
});

/**
 * Calculate parcel dimensions from cart items.
 * Uses max length/width (box footprint) and stacked height so volumetric
 * weight scales with quantity instead of quantity³.
 */
async function calculateParcelFromItems(items) {
  try {
    // Default dimensions for clothing items (weight = 1 kg in lb)
    const defaultDimensions = {
      length: 12, // inches
      width: 10,
      height: 2,
      weight: 2.205, // lb (1 kg)
    };

    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0; // stacked height

    for (const item of items) {
      const quantity = item.quantity || 1;
      let length = defaultDimensions.length;
      let width = defaultDimensions.width;
      let height = defaultDimensions.height;
      let weight = defaultDimensions.weight;

      if (item.product_id) {
        const productResult = await query(
          'SELECT * FROM products WHERE id = $1',
          [item.product_id]
        );
        if (productResult.rows.length > 0) {
          const product = productResult.rows[0];
          length = product.dimensions_length ?? product.length ?? defaultDimensions.length;
          width = product.dimensions_width ?? product.width ?? defaultDimensions.width;
          height = product.dimensions_height ?? product.height ?? defaultDimensions.height;
          weight = product.weight ?? defaultDimensions.weight;
        }
      }

      totalWeight += weight * quantity;
      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
      totalHeight += height * quantity;
    }

    return {
      length: Math.max(maxLength, 6).toString(),   // minimum 6 inches
      width: Math.max(maxWidth, 4).toString(),     // minimum 4 inches
      height: Math.max(totalHeight, 1).toString(), // minimum 1 inch (stacked)
      weight: Math.max(totalWeight, 0.1).toString(),
      distance_unit: 'in',
      mass_unit: 'lb'
    };
  } catch (error) {
    console.error('Error calculating parcel from items:', error);
    return {
      length: '12',
      width: '10',
      height: '2',
      weight: '2.205', // 1 kg in lb
      distance_unit: 'in',
      mass_unit: 'lb'
    };
  }
}

/**
 * Normalize country to 2-letter ISO code (DHL and shipping_rules use codes)
 */
function normalizeCountryCode(country) {
  if (!country || typeof country !== 'string') return country || '';
  const s = country.trim();
  if (s.length === 2) return s.toUpperCase();
  const nameToCode = {
    'united states': 'US', 'usa': 'US', 'united states of america': 'US',
    'ghana': 'GH', 'united kingdom': 'GB', 'uk': 'GB', 'great britain': 'GB',
    'nigeria': 'NG', 'canada': 'CA', 'australia': 'AU', 'germany': 'DE',
    'france': 'FR', 'south africa': 'ZA', 'kenya': 'KE', 'uganda': 'UG',
    'togo': 'TG', 'benin': 'BJ', 'burkina faso': 'BF', 'ivory coast': 'CI',
    'côte d\'ivoire': 'CI', 'senegal': 'SN', 'mali': 'ML', 'liberia': 'LR',
    'sierra leone': 'SL', 'guinea': 'GN', 'gambia': 'GM', 'cameroon': 'CM',
  };
  return nameToCode[s.toLowerCase()] || s;
}

/**
 * Get shipping rates for an order
 * POST /api/shipping/rates
 */
router.post('/rates', async (req, res) => {
  try {
    console.log('🚢 Received shipping rates request:', req.body);
    const { orderId, address, items } = req.body;
    
    if (!address) {
      console.log('❌ Address is missing from request body');
      return res.status(400).json({ 
        error: 'Address is required' 
      });
    }
    
    if (!orderId && (!items || items.length === 0)) {
      return res.status(400).json({ 
        error: 'Either orderId or items are required' 
      });
    }

    // Normalize country to 2-letter code for DHL and manual rules
    const countryCode = normalizeCountryCode(address.country);
    const normalizedAddress = { ...address, country: countryCode };

    // Check if DHL is configured
    console.log('🔍 Checking DHL configuration...');
    console.log('🔍 DHL isConfigured:', dhlService.isConfigured());
    
    // Calculate order total for manual shipping rules fallback
    let orderTotal = 0;
    if (orderId) {
      const orderResult = await query(
        'SELECT base_total FROM orders WHERE id = $1',
        [orderId]
      );
      if (orderResult.rows.length > 0) {
        orderTotal = parseFloat(orderResult.rows[0].base_total) || 0;
      }
    } else if (items && items.length > 0) {
      // Calculate total from items
      for (const item of items) {
        const productResult = await query(
          'SELECT price FROM products WHERE id = $1',
          [item.product_id]
        );
        if (productResult.rows.length > 0) {
          orderTotal += parseFloat(productResult.rows[0].price || 0) * (item.quantity || 1);
        }
      }
    }

    let parcel;
    let dhlRates = [];
    let useManualShipping = false;
    const isDev = process.env.NODE_ENV !== 'production';
    const originCountry = req.branchSettings?.dhl_from_country || 'GH';

    // Build calculation details for development only (no secrets)
    const buildCalculationDetails = (source, extra = {}) => {
      if (!isDev) return undefined;
      const details = {
        source,
        destination: {
          countryCode: normalizedAddress.country,
          city: normalizedAddress.city,
          state: normalizedAddress.state,
          postalCode: normalizedAddress.zip || normalizedAddress.postalCode,
        },
        origin: { countryCode: originCountry },
        parcel: parcel ? {
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
          weight: parcel.weight,
          distance_unit: parcel.distance_unit,
          mass_unit: parcel.mass_unit,
        } : null,
        ...extra,
      };
      return details;
    };

    // Try DHL first if configured
    if (dhlService.isConfigured()) {
      try {
        if (orderId) {
          // Get order details
          const orderResult = await query(
            'SELECT * FROM orders WHERE id = $1',
            [orderId]
          );
          
          if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
          }
          
          // Calculate parcel dimensions and weight based on order items
          parcel = await calculateParcelDimensions(orderId);
        } else {
          // Calculate parcel dimensions from cart items
          parcel = await calculateParcelFromItems(items);
        }
        
        // Get shipping rates with branch-specific origin
        console.log('📦 Address being passed to DHL:', JSON.stringify(normalizedAddress, null, 2));
        console.log('📦 Parcel being passed to DHL:', JSON.stringify(parcel, null, 2));
        console.log('🌍 Branch context:', req.branchCode, req.branchSettings?.branch_name);
        const result = await dhlService.getShippingRates(normalizedAddress, parcel, {
          branchSettings: req.branchSettings
        });
        
        if (result.success && result.rates && result.rates.length > 0) {
          // Filter and format rates
          dhlRates = result.rates.map(rate => ({
            id: rate.id,
            carrier: rate.carrier || 'DHL',
            service: rate.servicelevel?.name || rate.productCode,
            cost: parseFloat(rate.amount),
            currency: rate.currency || 'USD',
            estimatedDays: rate.estimated_days || dhlService.getEstimatedDelivery(
              'DHL',
              rate.productCode,
              req.branchSettings?.dhl_from_country || 'GH',
              normalizedAddress.country
            ),
            description: `DHL ${rate.servicelevel?.name || rate.productCode}`
          }));
          console.log(`✅ Shipping: Found ${dhlRates.length} DHL rates`);
        } else {
          console.log('⚠️ DHL returned no rates, falling back to manual shipping rules');
          useManualShipping = true;
        }
      } catch (dhlError) {
        console.error('⚠️ DHL error, falling back to manual shipping rules:', dhlError.message);
        useManualShipping = true;
      }
    } else {
      console.log('⚠️ DHL is not configured, using manual shipping rules');
      useManualShipping = true;
    }

    // Fallback to manual shipping rules if DHL failed or not configured
    if (useManualShipping || dhlRates.length === 0) {
      console.log('📦 Fetching manual shipping rules for country:', normalizedAddress.country);
      
      try {
        // Calculate total weight from items
        let totalWeight = 0;
        if (items && items.length > 0) {
          for (const item of items) {
            const productResult = await query(
              'SELECT weight FROM products WHERE id = $1',
              [item.product_id]
            );
            if (productResult.rows.length > 0) {
              const itemWeight = parseFloat(productResult.rows[0].weight) || 1; // Default to 1kg
              totalWeight += itemWeight * (item.quantity || 1);
            } else {
              totalWeight += 1 * (item.quantity || 1); // Default to 1kg per item
            }
          }
        }
        console.log('⚖️ Total cart weight:', totalWeight, 'kg');
        
        // Fetch shipping rules from database
        const rulesResult = await query(`
          SELECT id, name, country, shipping_cost, per_kg_rate, free_shipping_threshold, 
                 estimated_days_min, estimated_days_max, is_active
          FROM shipping_rules 
          WHERE is_active = true 
            AND (LOWER(TRIM(country)) = LOWER($1) OR country IS NULL OR TRIM(country) = '')
          ORDER BY 
            CASE WHEN LOWER(TRIM(country)) = LOWER($1) THEN 1 ELSE 2 END,
            shipping_cost ASC
          LIMIT 5
        `, [normalizedAddress.country]);
        
        // If no country-specific rule, try any rule with empty/international country
        let rules = rulesResult.rows;
        if (rules.length === 0) {
          const fallbackResult = await query(`
            SELECT id, name, country, shipping_cost, per_kg_rate, free_shipping_threshold,
                   estimated_days_min, estimated_days_max, is_active
            FROM shipping_rules
            WHERE is_active = true
            ORDER BY shipping_cost ASC
            LIMIT 5
          `);
          rules = fallbackResult.rows;
          if (rules.length > 0) {
            console.log('📦 Using fallback shipping rules (no country-specific match)');
          }
        }
        
        if (rules.length > 0) {
          const manualRates = rules.map(rule => {
            // Calculate shipping cost based on weight
            const perKgRate = parseFloat(rule.per_kg_rate) || 0;
            const flatRate = parseFloat(rule.shipping_cost) || 0;
            
            let shippingCost = 0;
            if (perKgRate > 0 && totalWeight > 0) {
              // Weight-based calculation
              shippingCost = perKgRate * totalWeight;
              console.log(`⚖️ Weight-based shipping for ${rule.name}: ${perKgRate}/kg x ${totalWeight}kg = ${shippingCost}`);
            } else {
              // Flat rate
              shippingCost = flatRate;
            }
            
            // Check if free shipping applies
            if (rule.free_shipping_threshold && orderTotal >= rule.free_shipping_threshold) {
              shippingCost = 0;
            }
            
            const estimatedDays = rule.estimated_days_min && rule.estimated_days_max
              ? `${rule.estimated_days_min}-${rule.estimated_days_max}`
              : '7-14';
            
            return {
              id: `manual-${rule.id}`,
              carrier: 'Standard',
              service: rule.name || 'Standard Shipping',
              cost: shippingCost,
              amount: shippingCost, // Alias for compatibility
              currency: req.branchSettings?.default_currency || 'USD',
              estimatedDays: estimatedDays,
              estimated_days: estimatedDays, // Alias for compatibility
              description: rule.name || 'Standard International Shipping',
              isManual: true,
              totalWeight: totalWeight,
              perKgRate: perKgRate
            };
          });
          
          console.log(`✅ Shipping: Found ${manualRates.length} manual shipping rates`);
          const firstRule = rules[0];
          const formulaSummary = firstRule
            ? (parseFloat(firstRule.per_kg_rate) || 0) > 0
              ? `${firstRule.per_kg_rate} GHS/kg × ${totalWeight} kg = ${manualRates[0]?.cost ?? 0} GHS`
              : `flat rate ${firstRule.shipping_cost} GHS`
            : 'N/A';

          return res.json({
            success: true,
            rates: manualRates,
            orderId: orderId,
            source: 'manual',
            totalWeight: totalWeight,
            ...(isDev && {
              calculationDetails: buildCalculationDetails('manual', {
                totalWeightKg: totalWeight,
                orderTotal,
                formula: formulaSummary,
                rulesUsed: rules.length,
              }),
            }),
          });
        } else {
          console.log('⚠️ No manual shipping rules found');
        }
      } catch (manualError) {
        console.error('❌ Error fetching manual shipping rules:', manualError);
      }
    }

    // If we have DHL rates, return them
    if (dhlRates.length > 0) {
      return res.json({
        success: true,
        rates: dhlRates,
        orderId: orderId,
        source: 'dhl',
        ...(isDev && {
          calculationDetails: buildCalculationDetails('dhl', {
            note: 'Rates from MyDHL API based on parcel and origin/destination.',
          }),
        }),
      });
    }

    // If we get here, neither DHL nor manual shipping worked
    // For domestic Ghana (GH), return a default rate so checkout can proceed
    if (normalizedAddress.country === 'GH' && originCountry === 'GH') {
      console.log('📦 No DHL/manual rates for domestic GH; returning default domestic rate');
      const defaultDomesticRate = {
        id: 'domestic-gh-default',
        carrier: 'Standard',
        service: 'Domestic Shipping',
        cost: 0,
        amount: 0,
        currency: req.branchSettings?.default_currency || 'GHS',
        estimatedDays: '2-5',
        estimated_days: '2-5',
        description: 'Standard domestic shipping within Ghana',
        isManual: true,
      };
      return res.json({
        success: true,
        rates: [defaultDomesticRate],
        orderId: orderId,
        source: 'domestic-default',
        ...(isDev && {
          calculationDetails: buildCalculationDetails('domestic-default', {
            note: 'No DHL or manual rules returned; using default domestic rate for Ghana.',
          }),
        }),
      });
    }

    console.log('❌ No shipping options available');
    return res.status(503).json({ 
      error: 'No shipping options available. Please contact support.' 
    });
  } catch (error) {
    console.error('❌ Shipping rates error:', error);
    res.status(500).json({ 
      error: 'Failed to get shipping rates', 
      details: error.message 
    });
  }
});

/**
 * Create shipping label
 * POST /api/shipping/label
 */
router.post('/label', authenticateToken, async (req, res) => {
  try {
    const { orderId, rateId } = req.body;
    
    if (!orderId || !rateId) {
      return res.status(400).json({ 
        error: 'Order ID and rate ID are required' 
      });
    }

    // Check if DHL is configured
    if (!dhlService.isConfigured()) {
      return res.status(503).json({ 
        error: 'DHL shipping is not configured' 
      });
    }

    // Get order details
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check if order is already shipped
    if (order.tracking_number) {
      return res.status(400).json({
        error: 'Order already has a shipping label'
      });
    }

    // Ensure DHL service is initialized to access settings
    await dhlService.initialize();
    const settings = dhlService.settings;
    const branchSettings = req.branchSettings || {};

    const fromName    = branchSettings.dhl_from_name    || settings?.dhl_from_name    || 'TailoredHands';
    const fromStreet  = branchSettings.dhl_from_street  || settings?.dhl_from_street  || 'Origin Address';
    const fromCity    = branchSettings.dhl_from_city    || settings?.dhl_from_city    || 'Accra';
    const fromState   = branchSettings.dhl_from_state   || settings?.dhl_from_state   || 'Greater Accra';
    const fromZip     = branchSettings.dhl_from_zip     || settings?.dhl_from_zip     || '00233';
    const fromCountry = branchSettings.dhl_from_country || settings?.dhl_from_country || 'GH';
    const fromPhone   = branchSettings.dhl_from_phone   || settings?.dhl_from_phone   || '+233000000000';

    // Calculate parcel dimensions from the order
    const parcel = await calculateParcelDimensions(orderId);

    // Convert to metric (DHL requires metric)
    let weightKg = parseFloat(parcel.weight) || 1;
    if (parcel.mass_unit === 'lb') weightKg *= 0.453592;

    let lengthCm = parseFloat(parcel.length) || 15;
    let widthCm  = parseFloat(parcel.width)  || 10;
    let heightCm = parseFloat(parcel.height) || 10;
    if (parcel.distance_unit === 'in') {
      lengthCm *= 2.54;
      widthCm  *= 2.54;
      heightCm *= 2.54;
    }

    const toCountry   = normalizeCountryCode(order.shipping_country || 'GH');
    const isDomestic  = fromCountry === toCountry;
    const productCode = rateId?.startsWith('dhl_')
      ? rateId.split('_')[1]   // extract code from rate id e.g. dhl_P_...
      : (isDomestic ? 'N' : 'P');

    // Declared value for customs (use order total or fallback)
    const declaredValue = parseFloat(order.base_total || 0) || 50;
    const declaredCurrency = 'USD';

    // Get order items for export declaration line items
    const itemsResult = await query(
      `SELECT oi.quantity, oi.price, p.name, p.weight, p.hs_code
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const plannedDate = new Date();
    plannedDate.setDate(plannedDate.getDate() + 1);
    const plannedShippingDateAndTime = plannedDate.toISOString().replace(/\.\d{3}Z$/, ' GMT+00:00');
    const invoiceDate = plannedDate.toISOString().split('T')[0];

    // Postal codes — DHL requires postalCode on both sides; use stored value or country-appropriate fallback
    const shipperPostal = fromZip || '00233';
    const receiverPostal = order.shipping_postal_code || order.shipping_zip || '00000';

    // Phone numbers — ensure they start with +
    const formatPhone = (phone) => {
      if (!phone) return '+10000000000';
      const cleaned = phone.replace(/\s+/g, '');
      return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    };

    // Build content block
    const contentBlock = {
      packages: [{
        weight: Math.max(0.1, parseFloat(weightKg.toFixed(3))),
        dimensions: {
          length: Math.max(1, Math.round(lengthCm)),
          width:  Math.max(1, Math.round(widthCm)),
          height: Math.max(1, Math.round(heightCm)),
        },
      }],
      isCustomsDeclarable: !isDomestic,
      description: 'Clothing and apparel',
      unitOfMeasurement: 'metric',
    };

    // Add customs fields for international shipments
    if (!isDomestic) {
      contentBlock.incoterm = 'DAP';
      contentBlock.declaredValue = declaredValue;
      contentBlock.declaredValueCurrency = declaredCurrency;

      // Build export declaration line items from order items
      const lineItems = itemsResult.rows.length > 0
        ? itemsResult.rows.map((item, idx) => ({
            number: idx + 1,
            description: (item.name || 'Clothing').substring(0, 50),
            price: parseFloat(item.price) || (declaredValue / (itemsResult.rows.length || 1)),
            priceCurrency: declaredCurrency,
            quantity: { value: item.quantity || 1, unitOfMeasurement: 'PCS' },
            weight: {
              netValue:   Math.max(0.1, parseFloat(item.weight) || 0.5),
              grossValue: Math.max(0.1, parseFloat(item.weight) || 0.5),
            },
            commodityCode: item.hs_code || '621132',
            exportReasonType: 'permanent',
            manufacturerCountry: fromCountry,
          }))
        : [{
            number: 1,
            description: 'Clothing and apparel',
            price: declaredValue,
            priceCurrency: declaredCurrency,
            quantity: { value: 1, unitOfMeasurement: 'PCS' },
            weight: { netValue: Math.max(0.1, weightKg), grossValue: Math.max(0.1, weightKg) },
            commodityCode: '621132',
            exportReasonType: 'permanent',
            manufacturerCountry: fromCountry,
          }];

      contentBlock.exportDeclaration = {
        lineItems,
        invoice: {
          date: invoiceDate,
          number: order.order_number || `TH-${orderId}`,
        },
        exportReason: 'PERMANENT',
        exportReasonType: 'permanent',
      };
    }

    const shipmentBody = {
      plannedShippingDateAndTime,
      pickup: { isRequested: false },
      productCode,
      accounts: [{ number: dhlService.accountNumber, typeCode: 'shipper' }],
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            postalCode:   shipperPostal,
            cityName:     fromCity,
            countryCode:  fromCountry,
            addressLine1: fromStreet.substring(0, 45),
            addressLine2: fromName.substring(0, 45),
          },
          contactInformation: {
            phone:       formatPhone(fromPhone),
            companyName: fromName,
            fullName:    fromName,
          },
        },
        receiverDetails: {
          postalAddress: {
            postalCode:   receiverPostal,
            cityName:     order.shipping_city || 'City',
            countryCode:  toCountry,
            addressLine1: (order.shipping_address || 'Destination Address').substring(0, 45),
            ...(order.shipping_state ? { addressLine2: order.shipping_state.substring(0, 45) } : {}),
          },
          contactInformation: {
            phone:       formatPhone(order.shipping_phone),
            companyName: `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim() || 'Customer',
            fullName:    `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim() || 'Customer',
          },
        },
      },
      content: contentBlock,
    };

    console.log('📤 DHL shipment body:', JSON.stringify(shipmentBody, null, 2));

    const result = await dhlService.createShipment(shipmentBody);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to create shipping label',
        details: result.error
      });
    }

    // Update order with shipping info
    await query(
      `UPDATE orders SET
        shipping_carrier = 'DHL',
        shipping_service = $1,
        tracking_number  = $2,
        shipping_rate_id = $3,
        status           = 'processing',
        updated_at       = NOW()
      WHERE id = $4`,
      [productCode, result.trackingNumber, rateId || null, orderId]
    );

    console.log(`✅ Shipping: Waybill created for order ${orderId}, AWB: ${result.trackingNumber}`);

    res.json({
      success: true,
      label: {
        trackingNumber: result.trackingNumber,
        shipmentId:     result.shipmentId,
        carrier:        'DHL',
        service:        productCode,
        labelContent:   result.labelContent,
        labelFormat:    result.labelFormat,
        waybillData: {
          awbNumber: result.trackingNumber,
          sender: {
            name:    fromName,
            address: fromStreet,
            city:    fromCity,
            state:   fromState,
            country: fromCountry,
            zip:     fromZip,
          },
          receiver: {
            name:    `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim(),
            address: order.shipping_address,
            city:    order.shipping_city,
            state:   order.shipping_state,
            country: toCountry,
            zip:     order.shipping_postal_code,
          },
          package: {
            weightKg:  parseFloat(weightKg.toFixed(2)),
            lengthCm:  Math.round(lengthCm),
            widthCm:   Math.round(widthCm),
            heightCm:  Math.round(heightCm),
          },
          service:    productCode,
          isDomestic,
        },
      }
    });
  } catch (error) {
    console.error('❌ Create label error:', error);
    res.status(500).json({ 
      error: 'Failed to create shipping label', 
      details: error.message 
    });
  }
});

/**
 * Track shipment
 * GET /api/shipping/track/:trackingNumber
 */
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    // Check if DHL is configured
    if (!dhlService.isConfigured()) {
      return res.status(503).json({ 
        error: 'DHL tracking is not available' 
      });
    }

    const result = await dhlService.trackShipment(trackingNumber);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to track shipment', 
        details: result.error 
      });
    }

    res.json({ 
      success: true, 
      tracking: result.tracking 
    });
  } catch (error) {
    console.error('❌ Tracking error:', error);
    res.status(500).json({ 
      error: 'Failed to track shipment', 
      details: error.message 
    });
  }
});

/**
 * Get international orders
 * GET /api/shipping/international
 */
router.get('/international', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT o.*, c.first_name, c.last_name, c.email, c.phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.is_international = TRUE
    `;
    
    const params = [];
    let paramCount = 0;

    if (status) {
        paramCount++;
      queryStr += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    queryStr += ` ORDER BY o.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(parseInt(limit), offset);

    const result = await query(queryStr, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE is_international = TRUE';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = $1';
      countParams.push(status);
    }
    
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ International orders error:', error);
    res.status(500).json({ 
      error: 'Failed to get international orders', 
      details: error.message 
    });
  }
});

/**
 * Get orders needing shipping labels
 * GET /api/shipping/needing-labels
 */
router.get('/needing-labels', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, c.first_name, c.last_name, c.email, c.phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.is_international = TRUE 
        AND o.status IN ('confirmed', 'processing')
        AND o.tracking_number IS NULL
      ORDER BY o.created_at ASC
    `);

    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('❌ Orders needing labels error:', error);
    res.status(500).json({ 
      error: 'Failed to get orders needing labels', 
      details: error.message 
    });
  }
});

/**
 * Validate address
 * POST /api/shipping/validate-address
 */
router.post('/validate-address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Check if DHL is configured
    if (!dhlService.isConfigured()) {
      return res.status(503).json({ 
        error: 'DHL address validation is not available' 
      });
    }

    const result = await dhlService.validateAddress(address);
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to validate address', 
        details: result.error 
      });
    }

    res.json({ 
      success: true, 
      validation: result.validation,
      isValid: result.isValid
    });
  } catch (error) {
    console.error('❌ Address validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate address', 
      details: error.message 
    });
  }
});

/**
 * Get supported carriers for a country
 * GET /api/shipping/carriers/:countryCode
 */
router.get('/carriers/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({ error: 'Country code is required' });
    }

    // DHL is the only carrier for this integration
    const result = {
      success: true,
      carriers: ['DHL Express']
    };
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to get carriers', 
        details: result.error 
      });
    }

    res.json({ 
      success: true, 
      carriers: result.carriers,
      country: countryCode.toUpperCase()
    });
  } catch (error) {
    console.error('❌ Carriers error:', error);
    res.status(500).json({ 
      error: 'Failed to get carriers', 
      details: error.message 
    });
  }
});

/**
 * Helper function to calculate parcel dimensions from order items.
 * Uses max length/width (footprint) and stacked height so volume scales with quantity.
 */
async function calculateParcelDimensions(orderId) {
  try {
    const itemsResult = await query(`
      SELECT oi.quantity, p.weight, p.dimensions_length, p.dimensions_width, p.dimensions_height
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [orderId]);

    const defaultLength = 10, defaultWidth = 10, defaultHeight = 5, defaultWeight = 2.205; // 1 kg in lb
    let totalWeight = 0;
    let maxLength = 0, maxWidth = 0;
    let totalHeight = 0;

    for (const item of itemsResult.rows) {
      const qty = item.quantity || 1;
      const weight = parseFloat(item.weight) || defaultWeight;
      totalWeight += weight * qty;

      let length = defaultLength, width = defaultWidth, height = defaultHeight;
      if (item.dimensions_length != null || item.dimensions_width != null || item.dimensions_height != null) {
        length = parseFloat(item.dimensions_length) || defaultLength;
        width = parseFloat(item.dimensions_width) || defaultWidth;
        height = parseFloat(item.dimensions_height) || defaultHeight;
      }

      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
      totalHeight += height * qty;
    }

    if (maxLength === 0) maxLength = defaultLength;
    if (maxWidth === 0) maxWidth = defaultWidth;
    if (totalHeight === 0) totalHeight = defaultHeight;
    if (totalWeight === 0) totalWeight = defaultWeight; // 1 kg in lb

    return {
      length: maxLength.toString(),
      width: maxWidth.toString(),
      height: Math.max(totalHeight, 1).toString(),
      distance_unit: "in",
      weight: totalWeight.toString(),
      mass_unit: "lb"
    };
  } catch (error) {
    console.error('❌ Parcel calculation error:', error);
    return {
      length: "10",
      width: "10",
      height: "5",
      distance_unit: "in",
      weight: "2.205", // 1 kg in lb
      mass_unit: "lb"
    };
  }
}

/**
 * POST /api/shipping - Create a new shipping rule
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      country, 
      state, 
      shipping_cost, 
      per_kg_rate,
      free_shipping_threshold,
      estimated_days_min,
      estimated_days_max,
      min_order_value,
      max_order_value,
      is_active = true 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await query(`
      INSERT INTO shipping_rules (
        name, country, state, shipping_cost, per_kg_rate, free_shipping_threshold,
        estimated_days_min, estimated_days_max, min_order_value, max_order_value, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      name, 
      country || null, 
      state || null, 
      shipping_cost || 0,
      per_kg_rate || 0,
      free_shipping_threshold || null,
      estimated_days_min || null,
      estimated_days_max || null,
      min_order_value || null,
      max_order_value || null,
      is_active
    ]);
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating shipping rule:', error);
    res.status(500).json({ error: 'Failed to create shipping rule' });
  }
});

/**
 * GET /api/shipping/:id - Get a specific shipping rule by ID
 * This route must be placed after all specific routes (like /active, /rates, etc.)
 * to avoid route conflicts
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT id, name, country, state, shipping_cost, per_kg_rate, free_shipping_threshold, 
             estimated_days_min, estimated_days_max, is_active,
             min_order_value, max_order_value
      FROM shipping_rules 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shipping rule:', error);
    res.status(500).json({ error: 'Failed to fetch shipping rule' });
  }
});

/**
 * PUT /api/shipping/:id - Update a shipping rule
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      country, 
      state, 
      shipping_cost,
      per_kg_rate,
      free_shipping_threshold,
      estimated_days_min,
      estimated_days_max,
      min_order_value,
      max_order_value,
      is_active 
    } = req.body;

    const result = await query(`
      UPDATE shipping_rules SET
        name = COALESCE($1, name),
        country = $2,
        state = $3,
        shipping_cost = COALESCE($4, shipping_cost),
        per_kg_rate = COALESCE($5, per_kg_rate),
        free_shipping_threshold = $6,
        estimated_days_min = $7,
        estimated_days_max = $8,
        min_order_value = $9,
        max_order_value = $10,
        is_active = COALESCE($11, is_active),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      name,
      country || null,
      state || null,
      shipping_cost,
      per_kg_rate,
      free_shipping_threshold || null,
      estimated_days_min || null,
      estimated_days_max || null,
      min_order_value || null,
      max_order_value || null,
      is_active,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating shipping rule:', error);
    res.status(500).json({ error: 'Failed to update shipping rule' });
  }
});

/**
 * DELETE /api/shipping/:id - Delete a shipping rule
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      DELETE FROM shipping_rules WHERE id = $1 RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipping rule not found' });
    }
    
    res.json({ success: true, message: 'Shipping rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping rule:', error);
    res.status(500).json({ error: 'Failed to delete shipping rule' });
  }
});

/**
 * Schedule a DHL pickup for one or more shipments
 * POST /api/shipping/pickup
 */
router.post('/pickup', authenticateToken, async (req, res) => {
  try {
    const { trackingNumbers, pickupDate, pickupTimeFrom, pickupTimeTo, specialInstructions } = req.body;

    if (!Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
      return res.status(400).json({ error: 'At least one tracking number is required' });
    }
    if (!pickupDate) {
      return res.status(400).json({ error: 'Pickup date is required' });
    }

    if (!dhlService.isConfigured()) {
      return res.status(503).json({ error: 'DHL is not configured' });
    }

    await dhlService.initialize();
    const settings = dhlService.settings;
    const branchSettings = req.branchSettings || {};

    const fromName    = branchSettings.dhl_from_name    || settings?.dhl_from_name    || 'TailoredHands';
    const fromStreet  = branchSettings.dhl_from_street  || settings?.dhl_from_street  || 'Origin Address';
    const fromCity    = branchSettings.dhl_from_city    || settings?.dhl_from_city    || 'Accra';
    const fromState   = branchSettings.dhl_from_state   || settings?.dhl_from_state   || 'Greater Accra';
    const fromZip     = branchSettings.dhl_from_zip     || settings?.dhl_from_zip     || '00233';
    const fromCountry = branchSettings.dhl_from_country || settings?.dhl_from_country || 'GH';
    const fromPhone   = branchSettings.dhl_from_phone   || settings?.dhl_from_phone   || '+233000000000';

    // Look up order data for each tracking number
    const orderDataMap = {};
    for (const tn of trackingNumbers) {
      const orderRes = await query(
        'SELECT id, base_total, shipping_country FROM orders WHERE tracking_number = $1',
        [tn]
      );
      orderDataMap[tn] = orderRes.rows[0] || null;
    }

    // Build per-shipment details with actual parcel dimensions
    const shipmentDetails = [];
    for (const tn of trackingNumbers) {
      const orderData = orderDataMap[tn];
      const toCountry = normalizeCountryCode(orderData?.shipping_country || 'GH');
      const isDomestic = fromCountry === toCountry;
      const declaredValue = parseFloat(orderData?.base_total || 0) || 50;

      // Calculate actual parcel dimensions from order items
      let weightKg = 1;
      let lengthCm = 25, widthCm = 20, heightCm = 10;
      if (orderData?.id) {
        const parcel = await calculateParcelDimensions(orderData.id);
        weightKg = parseFloat(parcel.weight) || 1;
        if (parcel.mass_unit === 'lb') weightKg *= 0.453592;
        lengthCm = parseFloat(parcel.length) || 25;
        widthCm  = parseFloat(parcel.width)  || 20;
        heightCm = parseFloat(parcel.height) || 10;
        if (parcel.distance_unit === 'in') {
          lengthCm *= 2.54;
          widthCm  *= 2.54;
          heightCm *= 2.54;
        }
      }

      const detail = {
        shipmentTrackingNumber: tn,
        productCode: isDomestic ? 'N' : 'P',
        isCustomsDeclarable: !isDomestic,
        unitOfMeasurement: 'metric',
        packages: [{
          weight: Math.round(weightKg * 100) / 100,
          dimensions: {
            length: Math.ceil(lengthCm),
            width:  Math.ceil(widthCm),
            height: Math.ceil(heightCm),
          },
        }],
      };
      if (!isDomestic) {
        detail.declaredValue = declaredValue;
        detail.declaredValueCurrency = 'USD';
      }
      shipmentDetails.push(detail);
    }

    // Ensure time values include seconds for DHL format (HH:mm:ss)
    const readyTime = (pickupTimeFrom || '09:00').replace(/^(\d{2}:\d{2})$/, '$1:00');
    const closeTime = (pickupTimeTo   || '17:00').replace(/^(\d{2}:\d{2})$/, '$1:00');

    const pickupBody = {
      plannedPickupDateAndTime: `${pickupDate}T${readyTime} GMT+00:00`,
      closeTime,
      location: 'reception',
      locationType: 'business',
      accounts: [{ number: dhlService.accountNumber, typeCode: 'shipper' }],
      ...(specialInstructions && {
        specialInstructions: [{ value: specialInstructions, typeCode: 'TBD' }],
        remark: specialInstructions,
      }),
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            postalCode:   fromZip || '00233',
            cityName:     fromCity,
            countryCode:  fromCountry,
            addressLine1: fromStreet.substring(0, 45),
            addressLine2: fromName.substring(0, 45),
          },
          contactInformation: {
            phone:       fromPhone,
            companyName: fromName,
            fullName:    fromName,
          },
        },
      },
      shipmentDetails,
    };

    const result = await dhlService.schedulePickup(pickupBody);

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to schedule pickup', details: result.error });
    }

    // Persist confirmation number against all involved orders
    if (result.dispatchConfirmationNumber) {
      for (const tn of trackingNumbers) {
        await query(
          'UPDATE orders SET pickup_confirmation_number = $1, updated_at = NOW() WHERE tracking_number = $2',
          [result.dispatchConfirmationNumber, tn]
        );
      }
    }

    console.log(`✅ Pickup scheduled: ${result.dispatchConfirmationNumber}`);
    res.json({
      success: true,
      dispatchConfirmationNumber: result.dispatchConfirmationNumber,
      readyByTime: result.readyByTime,
    });
  } catch (error) {
    console.error('❌ Schedule pickup error:', error);
    res.status(500).json({ error: 'Failed to schedule pickup', details: error.message });
  }
});

/**
 * Cancel / void a DHL shipment
 * DELETE /api/shipping/shipments/:trackingNumber
 */
router.delete('/shipments/:trackingNumber', authenticateToken, async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    if (!dhlService.isConfigured()) {
      return res.status(503).json({ error: 'DHL is not configured' });
    }

    const result = await dhlService.cancelShipment(trackingNumber);

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to cancel shipment', details: result.error });
    }

    // Clear tracking info on any matching order
    await query(
      `UPDATE orders SET
        tracking_number  = NULL,
        shipping_carrier = NULL,
        shipping_service = NULL,
        shipping_rate_id = NULL,
        status           = 'processing',
        updated_at       = NOW()
      WHERE tracking_number = $1`,
      [trackingNumber]
    );

    console.log(`✅ Shipment ${trackingNumber} cancelled`);
    res.json({ success: true, message: 'Shipment cancelled successfully' });
  } catch (error) {
    console.error('❌ Cancel shipment error:', error);
    res.status(500).json({ error: 'Failed to cancel shipment', details: error.message });
  }
});

module.exports = router;