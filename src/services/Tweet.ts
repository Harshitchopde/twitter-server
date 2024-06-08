import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";
export interface CreateTweetPayload {
    content: string
    imageURl?: string
}
class TweetService{
    public static async getManyByParentId(authorId:string){
        const cashedTweets = await redisClient.get(`TWEET_BY_PARENT:${authorId}`)
        if(cashedTweets){
            console.log("Tw: cashed")
            return JSON.parse(cashedTweets);
        }
        const tweets = await prismaClient.tweet.findMany({where:{authorId}})
        await redisClient.set(`TWEET_BY_PARENT:${authorId}`,JSON.stringify(tweets))
        console.log("TW:N-GMP")
        return tweets;
    }
    public static async getAllTweets(){
        const cashedTweets = await redisClient.get(`TWEET_ALL`)
     
        if(cashedTweets){
            console.log("TW:Y-GAT")
            return JSON.parse(cashedTweets);
        } 
        const allTweets = await prismaClient.tweet.findMany({orderBy:{createdAt:"desc"}})
        await redisClient.set(`TWEET_ALL`,JSON.stringify(allTweets))
        console.log("TW:N-GAT");
        return allTweets;
    }
    public static async createTweet(payload:CreateTweetPayload,id:string){
        const rateLimitFlag = await redisClient.get(`RATE_LIMIT:TWEET:${id}`);
        if(rateLimitFlag){
            throw new Error('Please Wait...')
        }
        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURl,
                author: { connect: { id:id} },

            }
        })
        await redisClient.setex(`RATE_LIMIT:TWEET:${id}`,10,1);
        await redisClient.del(`TWEET_ALL`)
        await redisClient.del(`TWEET_BY_PARENT:${id}`)
        return tweet;
    }
}
export default TweetService;