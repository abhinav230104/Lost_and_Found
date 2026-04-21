import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variable");
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendOTP(email: string, otp: string) {
  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is: ${otp}`,
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    throw error;
  }
}
