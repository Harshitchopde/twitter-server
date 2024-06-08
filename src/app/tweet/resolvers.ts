import { Tweet } from "@prisma/client";

import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import TweetService, { CreateTweetPayload } from "../../services/Tweet";

const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
if(!accessKeyId || !secretAccessKey)throw new Error("Accesskey and secretkey can't be null")
const s3Client = new S3Client({
    region:'ap-south-1',
    credentials:{ 
        accessKeyId:accessKeyId,
        secretAccessKey: secretAccessKey,
    }
})
const queries = {
    getAllTweets:()=> TweetService.getAllTweets(),
    getSignedURLForTweet: async (
        parent:any,
        {imageName,imageType}:{imageName:string,imageType:string},
        ctx:GraphqlContext
    )=>{
        if(!ctx.user || !ctx.user.id)throw new Error("User is UnAuthenticated");
        const allowedTypes = ['jpg','jpeg','png','webp'];
        if(!allowedTypes.includes(imageType))throw new Error("UnSupported type");

        const putObjectCommand =new PutObjectCommand({
            Bucket:process.env.AWS_S3_BUCKET,
            Key:`uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}.${imageType}`,
        }) 
        const signedUrl = await getSignedUrl(s3Client,putObjectCommand);
        return signedUrl;
    }
}
const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetPayload }, ctx: GraphqlContext) => {
        // first check user is login or not
        if (!ctx.user) throw new Error("You are not logged in")
        return TweetService.createTweet(payload,ctx.user?.id);
    }
}
const extraResolver = {
    Tweet:{
        author:(parent:Tweet)=> prismaClient.user.findUnique({where:{id:parent.authorId}})
    }
}
export const resolvers = {mutations,extraResolver,queries}