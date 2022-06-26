// 1.apollo-server-expressとexpressを読み込む
const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const expressPlayground = require('graphql-playground-middleware-express').default;
const { readFileSync } = require('fs');

const typeDefs = readFileSync('./typeDefs.graphql', 'UTF-8');
const resolvers = require('./resolvers');

// 写真を格納するための配列を定義する
// var _id = 0;
// var users = [
//     {"githubLogin": "oijfweauhfewauio", "name": "hoge tarou"},
//     {"githubLogin": "jidfoewauihuieasw", "name": "fuga jirou"},
//     {"githubLogin": "uhujikolk", "name": "piyo saburou"},
// ]

// var photos = [
//     {
//         "id": "1",
//         "name": "aaaaaaaa",
//         "description":"aaaaaaaaaaaaaaaa",
//         "category":"ACTION",
//         "githubUser":"oijfweauhfewauio",
//         "created":"3-28-2017",
//     },
//     {
//         "id": "2",
//         "name": "bbbbbbb",
//         "description":"bbbbbbbbbbbbbb",
//         "category":"SELFIE",
//         "githubUser":"jidfoewauihuieasw",
//         "created":"4-29-2018",
//     },
//     {
//         "id": "3",
//         "name": "cccccccccc",
//         "description":"cccccccccccccccccccc",
//         "category":"LANDSCAPE",
//         "githubUser":"uhujikolk",
//         "created":"5-30-2019",
//     },
// ]

// var tags = [
//     { "photoId": "1", "userId":"oijfweauhfewauio" },
//     { "photoId": "2", "userId":"jidfoewauihuieasw" },
//     { "photoId": "2", "userId":"uhujikolk" },
//     { "photoId": "2", "userId":"oijfweauhfewauio" },
// ]

// 2.express()を呼び出し Express アプリケーションを作成する
var app = express();
const server = new ApolloServer({ typeDefs, resolvers });

// 3.applyMiddleware()を呼び出しExpressにミドルウェアを追加する
server.applyMiddleware({ app });

//4.ホームルートを作成する
app.get(`/`, (req, res) => res.end(`Welcome to the PhotoShare API`));
app.get(`/playground`, expressPlayground({ endpoint: `/graphql` }))

// 5.特定のポートでリッスンする
app.listen({ port: 4000 }, () =>
    console.log(`GraphQL Server running @ http://localhost:4000${server.graphqlPath}`)
);
