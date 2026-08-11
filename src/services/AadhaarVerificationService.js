/**
 * Production Adapter for connecting to the real Aadhaar/OTP backend.
 */
class ProductionAadhaarAdapter {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async startVerification(aadhaarNumber) {
    const res = await fetch(`${this.baseUrl}/verification/aadhaar/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aadhaarNumber }),
    });
    if (!res.ok) throw new Error("Failed to start verification");
    return res.json();
  }

  async verifyOtp(referenceId, otp) {
    const res = await fetch(`${this.baseUrl}/verification/aadhaar/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceId, otp }),
    });
    if (!res.ok) throw new Error("Invalid OTP");
    return res.json();
  }
}

/**
 * Development Adapter for isolated testing.
 * NEVER CLAIMS TO SEND REAL SMS.
 */
class DevelopmentAadhaarAdapter {
  constructor() {
    console.info("[AADHAAR] Running in DEVELOPMENT MODE. No real SMS will be sent.");
  }

  async startVerification(aadhaarNumber) {
    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      throw new Error("Invalid Aadhaar Number");
    }

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1200));

    return {
      success: true,
      referenceId: `dev-ref-${Date.now()}`,
      message: "[DEVELOPMENT MODE] Simulated OTP challenge created. Enter any 6-digit number to proceed.",
      maskedMobile: "******1234",
    };
  }

  async verifyOtp(referenceId, otp) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));

    if (!otp || otp.length < 6) {
      throw new Error("Invalid OTP format");
    }

    // In development mode, we accept any 6-digit OTP for testing the UI flow.
    // E.g. 123456
    return {
      success: true,
      verified: true,
      verifiedAt: new Date().toISOString(),
    };
  }
}

class AadhaarVerificationService {
  constructor() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const forceProduction = import.meta.env.VITE_FORCE_PRODUCTION_AUTH === "true";

    if (baseUrl && forceProduction) {
      this.adapter = new ProductionAadhaarAdapter(baseUrl);
    } else {
      this.adapter = new DevelopmentAadhaarAdapter();
    }
  }

  startVerification(aadhaarNumber) {
    return this.adapter.startVerification(aadhaarNumber);
  }

  verifyOtp(referenceId, otp) {
    return this.adapter.verifyOtp(referenceId, otp);
  }
}

export const aadhaarVerificationService = new AadhaarVerificationService();
