import { NextRequest, NextResponse } from "next/server";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { generateOtp, storeOtp } from "@/lib/otp-store-persistent";

const sns = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian phone number" },
        { status: 400 }
      );
    }

    const otp = generateOtp();
    await storeOtp(phone, otp);

    let smsSent = false;

    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      try {
        await sns.send(
          new PublishCommand({
            PhoneNumber: `+91${phone}`,
            Message: `Your KhethAi verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
            MessageAttributes: {
              "AWS.SNS.SMS.SenderID": {
                DataType: "String",
                StringValue: "KhethAi",
              },
              "AWS.SNS.SMS.SMSType": {
                DataType: "String",
                StringValue: "Transactional",
              },
            },
          })
        );
        smsSent = true;
      } catch (snsError) {
        console.error("SNS error (falling back to demo):", snsError);
      }
    }

    console.log(`[OTP] Phone: +91${phone}, OTP: ${otp}, SMS sent: ${smsSent}`);

    return NextResponse.json({
      success: true,
      message: smsSent
        ? "OTP sent to your phone! Also shown below for demo."
        : "OTP generated (SMS delivery pending — shown below for demo)",
      demo: true,
      hint: otp,
      smsSent,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
