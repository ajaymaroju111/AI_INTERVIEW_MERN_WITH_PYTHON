import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

let isConnected : boolean = false;

export const connectDB = async(): Promise<void> => {
    if (isConnected) {
        console.log("Already connected to the database.");
        return;
    }
try {
    const connection = await mongoose.connect(process.env.MONGO_URI as string, {
        autoIndex: process.env.NODE_ENV !== "production", // disable in prod
    })
    isConnected = true;
    console.log(`Connected to the Database to : ${connection.connection.host}`);
    
} catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
}
}