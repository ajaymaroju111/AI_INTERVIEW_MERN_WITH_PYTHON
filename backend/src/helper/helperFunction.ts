import  Jwt  from "jsonwebtoken";

export const generateToken = (Payload: object): string => {
    const token = Jwt.sign(Payload, process.env.JWT_SECRET_KEY as string, {
        expiresIn: "7d",
        algorithm: "RS256",
    });
    return token;
}