
import { supabase } from "./supabase";

import { 
    loginUser, 
    signupUser 
} from "./db/auth";

import { 
    getOrCreateCustomer, 
    updateCustomerDetails, 
    createNewAuthUserAndCustomer, 
    createNewGuestCustomerRecord 
} from "./db/customer";

import { 
    fetchFAQsByProductId, 
    fetchAllFAQsForAdmin, 
    addFAQ, 
    deleteFAQ, 
    fetchGeneralFAQs 
} from "./db/faqs";

import { 
    fetchAllProducts, 
    fetchProductById, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    fetchFeaturedProducts, 
    fetchProductsByCategory 
} from "./db/products";

import { 
    fetchOrdersForAdmin, 
    fetchOrderByIdForAdmin, 
    updateOrderStatusForAdmin, 
    fetchOrdersByUserId 
} from "./db/orders";

import { 
    fetchGiftVoucherTypes, 
    addGiftVoucherType, 
    updateGiftVoucherType, 
    deleteGiftVoucherType, 
    fetchActiveGiftVoucherTypes, 
    fetchGiftVoucherTypeById 
} from "./db/giftVoucherTypes";

import { 
    fetchIssuedGiftVouchersForAdmin, 
    updateIssuedGiftVoucherStatus, 
    fetchGiftVoucherByCode, 
    redeemGiftVoucher, 
    createGiftVoucher 
} from "./db/issuedGiftVouchers";

import { 
    fetchUserProfile,
    createInitialUserProfile,
    updateUserProfileLastSignIn,
    fetchUsersWithEdgeFunction,
    updateUserRoleWithEdgeFunction,
    deleteUserWithEdgeFunction,
    inviteUserByEmailWithEdgeFunction 
} from "./db/users";

import {
    fetchAllCoupons,
    addCoupon as addCouponDb,
    updateCoupon as updateCouponDb,
    deleteCoupon as deleteCouponDb
} from "./db/coupons";


export {
  supabase,
  loginUser,
  signupUser,
  getOrCreateCustomer,
  updateCustomerDetails,
  createNewAuthUserAndCustomer,
  createNewGuestCustomerRecord,
  fetchFAQsByProductId,
  fetchAllFAQsForAdmin,
  addFAQ,
  deleteFAQ,
  fetchGeneralFAQs,
  fetchAllProducts,
  fetchProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  fetchFeaturedProducts,
  fetchProductsByCategory,
  fetchOrdersForAdmin,
  fetchOrderByIdForAdmin,
  updateOrderStatusForAdmin,
  fetchOrdersByUserId,
  fetchGiftVoucherTypes,
  addGiftVoucherType,
  updateGiftVoucherType,
  deleteGiftVoucherType,
  fetchActiveGiftVoucherTypes,
  fetchGiftVoucherTypeById,
  fetchIssuedGiftVouchersForAdmin,
  updateIssuedGiftVoucherStatus,
  fetchGiftVoucherByCode,
  redeemGiftVoucher,
  createGiftVoucher,
  fetchUserProfile,
  createInitialUserProfile,
  updateUserProfileLastSignIn,
  fetchUsersWithEdgeFunction,
  updateUserRoleWithEdgeFunction,
  deleteUserWithEdgeFunction,
  inviteUserByEmailWithEdgeFunction,
  fetchAllCoupons,
  addCouponDb,
  updateCouponDb,
  deleteCouponDb
};
