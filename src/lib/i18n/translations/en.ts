const en = {
  common: {
    appName: "KhethAi",
    tagline: "Smart Farming, Better Harvest",
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try Again",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    save: "Save",
    offline: "You are offline",
    online: "Back online",
  },
  auth: {
    welcome: "Welcome to KhethAi",
    subtitle: "Enter your phone number to get started",
    phonePlaceholder: "Enter 10-digit phone number",
    phoneLabel: "Phone Number",
    sendOtp: "Send OTP",
    otpTitle: "Verify OTP",
    otpSubtitle: "Enter the 6-digit code sent to",
    otpPlaceholder: "Enter OTP",
    verifyOtp: "Verify & Continue",
    resendOtp: "Resend OTP",
    resendIn: "Resend in",
    seconds: "seconds",
    invalidPhone: "Please enter a valid 10-digit phone number",
    invalidOtp: "Please enter a valid 6-digit OTP",
    otpSent: "OTP sent successfully!",
    otpFailed: "Failed to send OTP. Please try again.",
    verifyFailed: "Invalid OTP. Please try again.",
  },
  dashboard: {
    greeting: "Namaste",
    title: "What would you like to do?",
    cropDoctor: "AI Crop Doctor",
    cropDoctorDesc: "Scan your crop for diseases",
    weather: "Weather",
    weatherDesc: "7-day forecast for your area",
    mandiPrices: "Mandi Prices",
    mandiPricesDesc: "Today's market prices",
    myFarm: "My Farm",
    myFarmDesc: "Manage your farm",
  },
  language: {
    title: "Choose Language",
    english: "English",
    hindi: "हिन्दी",
    telugu: "తెలుగు",
    tamil: "தமிழ்",
    kannada: "ಕನ್ನಡ",
    marathi: "मराठी",
    bengali: "বাংলা",
    gujarati: "ગુજરાતી",
  },
  offline: {
    title: "No Internet Connection",
    message: "Don't worry! You can still use KhethAi offline. Your data will sync when you're back online.",
    viewCached: "View Saved Data",
  },
};

export type TranslationKeys = {
  common: Record<keyof typeof en.common, string>;
  auth: Record<keyof typeof en.auth, string>;
  dashboard: Record<keyof typeof en.dashboard, string>;
  language: Record<keyof typeof en.language, string>;
  offline: Record<keyof typeof en.offline, string>;
};

export default en as TranslationKeys;
