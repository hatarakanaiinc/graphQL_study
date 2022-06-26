// apollo-serverのモジュール読み込み
const { ApolloServer } = require('apollo-server');
const { GraphQLScalarType } = require('graphql');

const typeDefs = `
    scalar DateTime
    type User {
        githubLogin: ID!
        name: String
        avatar: String
        postedPhotos: [Photo!]!
        inPhotos: [Photo!]!
    }

    enum PhotoCategory {
        SELFIE
        POPRTRAIT
        ACTION
        LANDSCAPE
        GRAPHIC
    }

    type Photo {
        id: ID!
        url: String!
        name: String!
        description: String
        category: PhotoCategory!
        postedBy: User!
        created: DateTime!
        taggedUsers: [User!]!
    }

    type Query {
        totalPhotos: Int!
        allPhotos(after: DateTime): [Photo!]!
    }

    input PostPhotoInput {
        name: String!
        category: PhotoCategory=POPRTRAIT
        description: String
    }

    type Mutation {
        postPhoto(input: PostPhotoInput!): Photo!
    }
`

// 写真を格納するための配列を定義する
var _id = 0;
var users = [
    {"githubLogin": "oijfweauhfewauio", "name": "hoge tarou"},
    {"githubLogin": "jidfoewauihuieasw", "name": "fuga jirou"},
    {"githubLogin": "uhujikolk", "name": "piyo saburou"},
]

var photos = [
    {
        "id": "1",
        "name": "aaaaaaaa",
        "description":"aaaaaaaaaaaaaaaa",
        "category":"ACTION",
        "githubUser":"oijfweauhfewauio",
        "created":"3-28-2017",
    },
    {
        "id": "2",
        "name": "bbbbbbb",
        "description":"bbbbbbbbbbbbbb",
        "category":"SELFIE",
        "githubUser":"jidfoewauihuieasw",
        "created":"4-29-2018",
    },
    {
        "id": "3",
        "name": "cccccccccc",
        "description":"cccccccccccccccccccc",
        "category":"LANDSCAPE",
        "githubUser":"uhujikolk",
        "created":"5-30-2019",
    },
]

var tags = [
    { "photoId": "1", "userId":"oijfweauhfewauio" },
    { "photoId": "2", "userId":"jidfoewauihuieasw" },
    { "photoId": "2", "userId":"uhujikolk" },
    { "photoId": "2", "userId":"oijfweauhfewauio" },
]

const resolvers = {
    Query: {
        totalPhotos: () => photos.length,
        allPhotos: () => photos
    },
    Mutation: {
        postPhoto(parent, args) {
            var newPhoto = {
                id: _id++,
                ...args.input
            }
            photos.push(newPhoto)
            return newPhoto
        }
    },
    Photo: {
        url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
        postedBy: parent => {
            return users.find(u => u.githubLogin === parent.githubUser)
        },
        taggedUsers: parent => tags
            .filter(tag => tag.photoId === parent.id)
            .map(tag => tag.userId)
            .map(userID => users.find(u => u.githubLogin === userID))
    },
    User: {
        postedPhotos: parent => {
            return photos.filter(p => p.githubUser === parent.githubLogin)
        },
        inPhotos: parent => tags
            .filter(tag => tag.userID === parent.id)
            .map(tag => tag.photoID)
            .map(photoID => photos.find(p => p.id === photoID))
    },
    DateTime: new GraphQLScalarType({
        name: `DateTime`,
        description: `A valid date time value`,
        parseValue: value => new Date(value),
        serialize: value => new Date(value).toISOString(),
        parseliteral: ast => ast.value
    })
}

// サーバーのインスタンスを作成
// その際 typeDefsとリゾルバを引数に取る
const server = new ApolloServer({
    typeDefs,
    resolvers
})

// webサーバーを起動
server
    .listen()
    .then(({url}) => console.log(`GraphQL Service running on ${url}`))
