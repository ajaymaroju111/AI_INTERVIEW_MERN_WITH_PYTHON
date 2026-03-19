import type { NextFunction, Request, Response } from "express";
import { User } from "../model/user.model.js";
import { OAuth2Client } from "google-auth-library";
import type { RegisterInput } from "../validators/auth/register.schema.js";
import type { LoginInput } from "../validators/auth/login.schema.js";
import { generateToken } from "../helper/helperFunction.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const RegisterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userData: RegisterInput = req.body;
    const { firstName, lastName, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({ firstName, lastName, email, password });
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const loginData: LoginInput = req.body;
    const { email, password } = loginData;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = generateToken({ id: user._id });
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
};

export const googleAuthcontroller = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tokenId } = req.body;

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID is not defined");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(400).json({
        message: "Google authentication failed",
      });
    }

    const { email, given_name, family_name, sub, email_verified } = payload;

    if (!email || !email_verified) {
      return res.status(400).json({
        message: "Invalid Google account",
      });
    }

    let user = await User.findOne({ email });

    // 🧠 Case 1: New user
    if (!user) {
      user = await User.create({
        firstName: given_name ?? "User",
        lastName: family_name ?? "",
        email,
        googleId: sub,
      });
    }

    // 🧠 Case 2: Existing user without Google → link account
    else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    const token = generateToken({ id: user._id });

    return res.status(200).json({
      message: "Google authentication successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
      },
    });
  } catch (error) {
    next(error);
  }
};
