import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { generateVerificationCode } from "../utils/generateVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emails.js";
import crypto from "crypto";
import transporter from "../mailtrap/nodeMailer.js";

export const Signup = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required");
    }
    const userAlreadyExist = await User.findOne({ email });
    if (userAlreadyExist) {
      return res
        .status(400)
        .json({ success: false, message: "User already exist" });
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    const verificationToken = generateVerificationCode();
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry: Date.now() + 3600000,
    });
    await user.save();

    // jwt
    generateTokenAndSetCookie(res, user._id);
    const mailOptions = {
      from: "nizhanth23@gmail.com",
      to: user.email,
      subject: "Your Verification OTP",
      html: `
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Email</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(to right, #2d56ebff, #0b5972ff); padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">Verify Your Email</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                  <p>Hello,</p>
                  <p>Thank you for signing up! Your verification code is:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0877b7ff;">${verificationToken}</span>
                  </div>
                  <p>Enter this code on the verification page to complete your registration.</p>
                  <p>This code will expire in 15 minutes for security reasons.</p>
                  <p>If you didn't create an account with us, please ignore this email.</p>
                  <p>Best regards,<br>Your App Team</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                  <p>This is an automated message, please do not reply to this email.</p>
                </div>

              <div style="text-align: center; margin-top: 30px; color: #555; font-size: 0.9em;">
                <p style="margin: 0;">
                  <em>Thanks for checking out my portfolio. ❤️ </em><br>
                  <span style="font-size: 0.8em; color: #888;">
                    nizhanth23@gmail.com
                  </span>
                </p>
              </div>
              </body>
              </html>
              `,
    };
    await transporter.sendMail(mailOptions);

    // await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    const mailOptions = {
      from: "nizhanth23@gmail.com",
      to: user.email,
      subject: "Welcome to Our Platform!",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333;">
      <div style="background: linear-gradient(to right, #114fcbff, #075b77ff); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome, ${user.name} 🎉</h1>
      </div>

      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Thank you for joining our platform! 🎊 We're really excited to have you onboard.</p>
        <p>Here’s what you can do next:</p>
        <ul style="padding-left: 20px;">
          <li>✔️ Complete your profile</li>
          <li>✔️ Verify your email address</li>
          <li>✔️ Explore the features available to you</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email. We're always happy to help.</p>
        <p>Best regards,<br><strong>Your App Team</strong></p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.85em;">
        <p>This is an automated message, please do not reply.(Except YOU)</p>
      </div>

      <div style="text-align: center; margin-top: 30px; color: #555; font-size: 0.9em;">
        <p style="margin: 0;">
          <em>Thanks for checking out my portfolio ❤️</em><br>
          <span style="font-size: 0.8em; color: #888;">
            nizhanth23@gmail.com
          </span>
        </p>
      </div>
    </div>
  `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error in verifyEmail ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const Login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Error in login ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const Logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log("Forgot password email received:", email);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    // if (user.authProvider !== "local") {
    //   return res.status(400).json({
    //     message: "Password reset not available for social login accounts.",
    //   });
    // }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

    user.resetPassToken = resetToken;
    user.resetPassTokenExpiry = resetTokenExpiresAt;

    await user.save();
    console.log("Saved token:", user.resetPassToken);
    // send email
    const mailOptions = {
      from: "nizhanth23@gmail.com",
      to: user.email,
      subject: "Password resetting",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #0f8ba1ff, #0c50ceff); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
    <p>To reset your password, click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" style="background-color: #0888c3ff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>Best regards,<br>Your App Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`,
    };

    await transporter.sendMail(mailOptions);

    // await sendPasswordResetEmail(
    //   user.email,
    //   `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    // );

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.log("Error in forgotPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPassToken: token, // ✅ Use the correct field
      resetPassTokenExpiry: { $gt: Date.now() }, // ✅ Use the correct expiry field
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // Update password
    const hashedPassword = await bcryptjs.hash(password, 10);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetPassToken = undefined;
    user.resetPassTokenExpiry = undefined;

    await user.save();
    console.log("Saved token:", user.resetPassToken);

    const mailOptions = {
      from: "nizhanth23@gmail.com",
      to: user.email,
      subject: "Welcome to Back to Our Platform!",
      html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset Successful</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(to right, #1877f2ff, #08386bff); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Password Reset Successful</h1>
              </div>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <p>Hello,</p>
                <p>We're writing to confirm that your password has been successfully reset.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background-color: #0390c3ff; color: white; width: 50px; height: 50px; line-height: 50px; border-radius: 50%; display: inline-block; font-size: 30px;">
                    ✓
                  </div>
                </div>
                <p>If you did not initiate this password reset, please contact our support team immediately.</p>
                <p>For security reasons, we recommend that you:</p>
                <ul>
                  <li>Use a strong, unique password</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Avoid using the same password across multiple sites</li>
                </ul>
                <p>Thank you for helping us keep your account secure.</p>
                <p>Best regards,<br>Your App Team</p>
              </div>
              <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </body>
            </html>
            `,
    };

    await transporter.sendMail(mailOptions);

    // await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in checkAuth ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
