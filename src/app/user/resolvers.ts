import { PrismaClient, User } from "@prisma/client";
import axios from "axios" 
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import UserService from "../../services/User";
import TweetService from "../../services/Tweet";
import { redisClient } from "../../clients/redis";




const queries = {
    verifyGoogleToken: async(parent:any ,{token}:{token:string})=>{
       return UserService.verifyGoogleAuthToken(token);
    },
    getCurrentUser: async(parent:any, args:any, ctx:GraphqlContext)=>{
        // console.log(ctx)
        const id = ctx.user?.id
        if(!id)return null
        const resUser = UserService.getUserById(id);
        if(!resUser) return "User Not Found!"
        return resUser 
    },
    getUserById: async (parent:any, {id}:{id:string},ctx:GraphqlContext)=>{
        return await UserService.getUserById(id);
    }
 
}
const mutations = {
    followUser:async(
        parent:any,
        {to}:{to:string}
        ,ctx:GraphqlContext
    )=>{
        if(!ctx.user)throw new Error("User is not Authenticated")
        await UserService.followUser(ctx.user.id,to)
    return true
    },
    unfollowUser: async(parent:any,{to}:{to:string},ctx:GraphqlContext)=>{
        if(!ctx.user || !ctx.user.id)throw new Error("User is Not Authenticated")
        await UserService.unfollowUser(ctx.user?.id,to)
    return true
    }
}
const extraQueryResolver = {
    User:{
        // tweets:(parent:User)=> prismaClient.tweet.findMany({where:{id:parent.id}})
        // tweets:(parent:User)=> prismaClient.tweet.findMany({where:{authorId:parent.id}})
        tweets:(parent:User) =>  TweetService.getManyByParentId(parent.id),
        followers:async(parent:User)=> {
            const res = await prismaClient.follows.findMany({where:{following:{id:parent.id}},include:{follower:true}});
           
            return res.map(el=> el.follower);
        },
        following:async (parent:User)=>{
            const res = await prismaClient.follows.findMany({ where:{follower:{id:parent.id}},include:{following:true}})
           
            return res.map(el=> el.following)
        },
        recommendation:async (parent:User,_:any,ctx:GraphqlContext)=>{
            if(!ctx.user)return []
            const cashedValue = await redisClient.get(`RECOMMENDATION:${ctx.user.id}`)
            if(cashedValue) {
                // console.log("cashed value")
                return JSON.parse(cashedValue)
            }
            const myFollowing = await prismaClient.follows.findMany(
                {
                    where:{follower:{id:ctx.user.id}},
                    include:{
                        following:{
                            include:{
                                followers:{
                                    include:{
                                        following:true
                                    }
                                }
                            }
                        },
                        
                    }
                })
            const user:User[]=[];
            for(const followings of myFollowing){
                for(const myfollower_following of followings.following.followers){
                    if(myfollower_following.following.id!==ctx.user.id ){
                        user.push(myfollower_following.following)
                    }
                }
            }
            // console.log("Not chased")
            await redisClient.set(`RECOMMENDATION:${ctx.user.id}`,JSON.stringify(user));
            return user;
        }
    }
}
export const resolvers = {queries,extraQueryResolver,mutations}

   // haloChalo:async(parent:any ,{hello,kha}:{hello:string,kha:string})=>{
    //     return hello+" "+kha;
    // }