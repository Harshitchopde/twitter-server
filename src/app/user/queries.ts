export const queries = `#graphql
        verifyGoogleToken(token: String!):String
        getCurrentUser :User
        getUserById(id:ID!): User
        `
        // haloChalo(hello:String!,kha:String!):String!