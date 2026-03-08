import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, generateAuthToken } from "@/lib/otp-store";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    const result = verifyOtp(phone, otp);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const token = generateAuthToken(phone);

    return NextResponse.json({
      success: true,
      token,
      phone,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
