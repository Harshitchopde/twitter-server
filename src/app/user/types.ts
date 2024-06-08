export const types = `#graphql
    type User{
        id:ID!
        firstName:String!
        lastName:String
        email:String!
        profilePic:String
        followers:[User]
        following:[User]
        recommendation:[User]
        tweets:[Tweet]
    }
`;