
export const TOAST_MESSAGES = {
  success: {
    title: "Success",
  },
  error: {
    title: "Error",
  },
  cart: {
    add: {
      success: "Item added to cart",
      error: "Could not add item to cart. Try again.",
    },
    update: {
      success: "Cart updated successfully",
      error: "Could not update cart. Try again.",
    },
    remove: {
      success: "Item removed from cart",
      error: "Could not remove item. Try again.",
    },
    clear: {
      success: "Cart cleared successfully",
      error: "Could not clear cart. Try again.",
    },
    loadError: "Failed to load cart items.",
  },
  auth: {
    login: {
      success: "Logged in successfully",
      error: "Invalid credentials",
      emailNotConfirmed: "Login failed. Please check your email and confirm your account before logging in.",
      invalidCredentials: "Invalid email or password. Please try again.",
    },
    admin: {
      success: "Welcome to admin dashboard",
      error: "Admin access denied",
    },
    signup: {
      success: "Account created. Welcome! Please check your email to verify your account.",
      error: "Sign up failed. Try again later.",
    },
    logout: {
      success: "Logged out successfully",
      error: "Could not log out. Try again.",
    },
    passwordReset: {
      requestSuccessTitle: "Password Reset Email Sent",
      requestSuccessDescription: "If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).",
      requestError: "Failed to send password reset email. Please try again or contact support if the issue persists.",
      updateSuccessTitle: "Password Updated",
      updateSuccessDescription: "Your password has been successfully updated. You can now log in with your new password.",
      updateError: "Failed to update password. The link may be invalid or expired. Please request a new one.",
    }
  },
  consultation: {
    submit: {
      success: "Request submitted. We'll get back to you shortly.",
      error: "Could not submit request. Please try again.",
    },
  },
  wishlist: {
    add: {
      success: "Item added to your wish-list",
      error: "Could not add to wish-list.",
    },
    remove: {
      success: "Item removed from wish-list",
      error: "Could not remove from wish-list.",
    },
    loadError: "Failed to load wishlist items.",
    toggleError: "Could not update wishlist status.",
  },
  contact: {
    send: {
      success: "Message sent. Thank you for contacting us!",
      error: "Message failed to send. Please try again.",
    },
  },
  general: {
    notFound: "The requested resource was not found.",
    unexpected: "An unexpected error occurred. Please try again.",
  },
  payment: {
    initiateError: "Could not initiate payment. Please try again.",
    success: "Payment successful! Your order is confirmed.",
    failure: "Payment failed. Please try again or contact support.",
    pending: "Payment is pending. We will update you once confirmed.",
    cancelled: "Payment was cancelled.",
    simulateSuccess: "Payment simulated successfully. Order updated.",
    simulateError: "Could not simulate payment.",
  },
  order: {
    createError: "Failed to create order. Please try again.",
    fetchError: "Failed to fetch order details.",
    updateError: "Failed to update order status.",
    notFound: "Order not found or you do not have permission to view it.",
  },
  product: {
    fetchError: "Failed to fetch product details.",
    notFound: "Product not found.",
  },
  shipping: {
    fetchRulesError: "Failed to fetch shipping rules.",
    calculateError: "Failed to calculate shipping cost.",
  },
  customer: {
    updateError: "Failed to update customer details.",
    fetchError: "Failed to fetch customer details.",
  },
  giftVoucher: {
    fetchError: "Failed to fetch gift vouchers.",
    applySuccess: "Gift voucher applied successfully.",
    applyError: "Failed to apply gift voucher. It might be invalid or expired.",
    purchaseSuccess: "Gift voucher purchased successfully!",
    purchaseError: "Failed to purchase gift voucher.",
  },
};
