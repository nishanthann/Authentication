import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model.js";
import { Strategy as GitHubStrategy } from "passport-github2";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        // Try to find user by Google ID
        let user = await User.findOneAndUpdate(
          { googleId: profile.id },
          { $set: { lastLogin: new Date() } },
          { new: true }
        );

        // If no user found by Google ID
        if (!user) {
          // Check if a user exists with the same email
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Link Google ID to existing user
            user.googleId = profile.id;
            user.lastLogin = new Date();
            user.isVerified = true;
            await user.save();
          } else {
            // Create a new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value,
              lastLogin: new Date(),
              isVerified: true,
            });
          }
        }

        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, cb) => {
      console.log(profile);
      try {
        // Try to find user by GitHub ID
        let user = await User.findOneAndUpdate(
          { githubId: profile.id },
          { $set: { lastLogin: new Date() } },
          { new: true }
        );

        // If no user found by GitHub ID
        if (!user) {
          // Check if a user exists with the same email
          user = await User.findOne({ email: profile.emails?.[0]?.value });

          if (user) {
            // Link GitHub ID to existing user
            user.githubId = profile.id;
            user.lastLogin = new Date();
            user.isVerified = true;
            await user.save();
          } else {
            // Create a new user
            user = await User.create({
              githubId: profile.id,
              name: profile.displayName || profile.username,
              email: profile.emails?.[0]?.value,
              lastLogin: new Date(),
              isVerified: true,
            });
          }
        }

        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

export default passport;
