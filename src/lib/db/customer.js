
import { supabase } from "@/lib/supabase";

const isRegisteredUserUUID = (id) => {
  return id && typeof id === 'string' && id.length === 36;
};

export const updateCustomerDetails = async (customerId, customerData) => {
  const { data, error } = await supabase
    .from("customers")
    .update({
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      country: customerData.country,
      postal_code: customerData.postalCode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customerId)
    .select()
    .single();

  if (error) {
    console.error("Error updating customer details:", error);
    throw new Error(`Failed to update customer information: ${error.message}`);
  }
  return data;
};

export const createNewAuthUserAndCustomer = async (customerData) => {
  if (!customerData.password || customerData.password.length < 6) {
    throw new Error("Password must be at least 6 characters long to create an account.");
  }

  const { data: authUserResponse, error: authError } = await supabase.auth.signUp({
    email: customerData.email,
    password: customerData.password,
    options: {
      data: {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        phone: customerData.phone,
      },
    },
  });

  if (authError) {
    console.error("Error signing up new user:", authError);
    if (authError.message.includes("User already registered")) {
        throw new Error("An account with this email already exists. Please log in or use a different email.");
    }
    throw new Error(`Failed to create user account: ${authError.message}`);
  }

  if (!authUserResponse || !authUserResponse.user || !authUserResponse.user.id) {
    throw new Error("Auth user creation did not return a valid user ID.");
  }
  
  const newCustomerRecord = {
    id: authUserResponse.user.id, 
    email: customerData.email,
    first_name: customerData.firstName,
    last_name: customerData.lastName,
    phone: customerData.phone,
    address: customerData.address,
    city: customerData.city,
    state: customerData.state,
    country: customerData.country,
    postal_code: customerData.postalCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: newDbCustomer, error: insertError } = await supabase
    .from("customers")
    .insert([newCustomerRecord])
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting new customer for new auth user:", insertError);
    
    console.warn("Customer record creation failed. Auth user may be orphaned. User ID:", authUserResponse.user.id);
    throw new Error(`Failed to create customer record for new user: ${insertError.message}`);
  }
  return newDbCustomer; 
};

export const createNewGuestCustomerRecord = async (customerData) => {
    const newCustomerRecord = {
      email: customerData.email,
      first_name: customerData.firstName,
      last_name: customerData.lastName,
      phone: customerData.phone,
      address: customerData.address,
      city: customerData.city,
      state: customerData.state,
      country: customerData.country,
      postal_code: customerData.postalCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  
    const { data: newDbCustomer, error: insertError } = await supabase
      .from("customers")
      .insert([newCustomerRecord])
      .select()
      .single();
  
    if (insertError) {
      console.error("Error inserting new guest customer:", insertError);
      throw new Error(`Failed to create guest customer record: ${insertError.message}`);
    }
    return newDbCustomer;
};

export const getOrCreateCustomer = async (customerData, attemptAccountCreation = false) => {
  try {
    const { data: existingCustomer, error: searchError } = await supabase
      .from("customers")
      .select("*")
      .eq("email", customerData.email)
      .maybeSingle(); 

    if (searchError) {
      console.error("Error searching for existing customer:", searchError);
      throw new Error(`Error checking existing customer: ${searchError.message}`);
    }

    if (existingCustomer) {
      if (isRegisteredUserUUID(existingCustomer.id)) { 
        if (attemptAccountCreation) {
          throw new Error("An account with this email already exists. Please log in or use a different email.");
        }
        const updatedCustomerData = { 
            firstName: customerData.firstName || existingCustomer.first_name,
            lastName: customerData.lastName || existingCustomer.last_name,
            phone: customerData.phone || existingCustomer.phone,
            address: customerData.address || existingCustomer.address,
            city: customerData.city || existingCustomer.city,
            state: customerData.state || existingCustomer.state,
            country: customerData.country || existingCustomer.country,
            postalCode: customerData.postalCode || existingCustomer.postal_code,
        };
        return await updateCustomerDetails(existingCustomer.id, updatedCustomerData);
      } else { 
        if (attemptAccountCreation) {
          return await createNewAuthUserAndCustomer(customerData);
        }
        return await updateCustomerDetails(existingCustomer.id, customerData);
      }
    } else { 
      if (attemptAccountCreation) {
        return await createNewAuthUserAndCustomer(customerData);
      } else {
        return await createNewGuestCustomerRecord(customerData);
      }
    }
  } catch (error) {
    console.error("Error in getOrCreateCustomer:", error.message);
    throw error; 
  }
};
