import { User } from "@prisma/client";
import Jwt from "jsonwebtoken";
import { JWTUser } from "../interfaces";
const JWT_SECRET = "a$W$TGS%55sg5e"
class JWTService{
        public static generateTokenForUser(user:User){
            const payload:JWTUser = {
                id:user.id,
                email:user.email,
            }
           
           const token =  Jwt.sign(payload,JWT_SECRET);
           return token;
        }
        public static decodeToken(token:string){
            try{

                return Jwt.verify(token,JWT_SECRET) as JWTUser
            }catch{
                return null
            }
        }
}

export default JWTService;