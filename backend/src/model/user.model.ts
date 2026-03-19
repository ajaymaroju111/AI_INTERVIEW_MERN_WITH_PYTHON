import mongoose, { Model, Schema } from "mongoose";
import type { IUser } from "../types/user.interface.js";
import bcrypt from "bcrypt";

const userSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Firstname is required"],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: function (this : IUser) : boolean {
        return !this.googleId;
      },
    },
    role: {
      type: String,
      default: "user",
    },
    preferredRole: {
      type: String,
      default: "Mern Stack Developer",
    },
    
  },
  {
    timestamps: true,
  },
);

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
    const user = this as IUser;
    if (!user.isModified("password")) return;
    const getSalt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, getSalt);
});

//methos to compare the password
userSchema.methods.comparePassword = async function (password : string) : Promise<boolean> {
    const user  = this as IUser;
    if(!user.password) return false;
    return await bcrypt.compare(password, user.password);
}

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
