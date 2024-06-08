import axios from "axios";
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";
import { redisClient } from "../clients/redis";
interface GoogleTokenResult {
    iss?: string;
    azp?: string;
    aud?: string
    sub?: string; 
    email: string
    email_verified: string
    nbf?:  string;
    name: string;
    picture?: string 
    given_name: string;
    iat?: string; 
    exp?: string;
    jti?: string;
    alg?: string; 
    kid?: string;
    typ?: string;
}
class UserService{
    public static async verifyGoogleAuthToken(token:string){
        const GoogleOuthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
        GoogleOuthURL.searchParams.set("id_token",token);
        // console.log(GoogleOuthURL.toString())
        const {data} = await axios.get<GoogleTokenResult>(GoogleOuthURL.toString(),{
            responseType:"json"
        })
        const user = await UserService.getUserByEmail(data.email);
        // console.log("user : ",user);
         // if user not exist then create
         if(!user){
           await UserService.createUser(data.email,data.given_name,data.picture as string)
        }
        const userForDb = await UserService.getUserByEmail(data.email);
        if(!userForDb)throw new Error("User Not found with this email -> "+data.email);
        const jwtToken = JWTService.generateTokenForUser(userForDb);
        return jwtToken;

    }
    public static async getUserByEmail(email:string){
        const cashedValue = await redisClient.get(`USER_BY_EMAIL:${email}`)  
        if(cashedValue){
           return JSON.parse(cashedValue);
        } 
        const user =  await prismaClient.user.findUnique({
            where:{email:email}
        })
        await redisClient.set(`USER_BY_EMAIL:${email}`,JSON.stringify(user))
        return user;
    }
    public static async createUser(email:string,firstName:string,profilePic:string){
        return await prismaClient.user.create({
            data:{
                email,
                firstName,
                profilePic
            }
        })
    }
    public static async getUserById(id:string){
    
         const cashedValue = await redisClient.get(`USER_BY_ID:${id}`)  
         if(cashedValue){
            return JSON.parse(cashedValue);
         } 
        const user =  await prismaClient.user.findUnique({where:{id:id}});
        await redisClient.set(`USER_BY_ID:${id}`,JSON.stringify(user))
        return user;
    }
    public static  async followUser(from:string,to:string){
        const user =  prismaClient.follows.create({
            data:{
                follower:{connect:{id:from}},
                following:{ connect: {id :to}}
            }
        })
        await  redisClient.del(`RECOMMENDATION:${from}`)
        return user;
    }
    public static  async unfollowUser(from:string,to:string){
        const user =  prismaClient.follows.delete({
            where :{ followerId_followingId:{ followerId:from, followingId:to}}
        })
        await  redisClient.del(`RECOMMENDATION:${from}`)
        return user;
    }
}
export default UserService;