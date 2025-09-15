import express from "express";
import {
  Login,
  Logout,
  Signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import passport from "passport";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

const router = express.Router();
router.get("/check-auth", verifyToken, checkAuth);
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/logout", Logout);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    // req.user is set by Passport after successful Google auth
    const token = generateTokenAndSetCookie(res, req.user._id);

    // You can redirect to frontend with JWT cookie already set
    res.redirect(`${process.env.CLIENT_URL}/`);
  }
);

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const token = generateTokenAndSetCookie(res, req.user._id);
    // Successful authentication, redirect to the dashboard or home page.
    res.redirect(`${process.env.CLIENT_URL}/`);
  }
);

export default router;
