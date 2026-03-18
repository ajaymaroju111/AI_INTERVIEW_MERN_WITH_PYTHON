import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { IUser, JWTpayload } from '../type/user.interface.js';
import { User } from '../model/user.model.js';


export const authenticateToken = async (req: Request, res : Response, next: NextFunction) => {
    try {
        let token : string | undefined;
        if(req.headers.authorization && req.headers.authorization?.startsWith("Bearer")){
            token = req.headers.authorization.split(" ")[1];
        }
        if(!token && req.cookies?.token){
            token = req.cookies.token;
        }

        if(!token){
            // sendErrorResponse.unauthorized("Unable to Login user");
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JWTpayload;

        const user = await User.findById(decode.id).select("-password");

        if(!user){
            // sendErrorResponse.unauthorized("Unable to Login user");
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user as IUser;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}