const { GraphQLScalarType } = require('graphql');
const { authorizeWithGithub } = require('./lib')
require('dotenv').config();
const fetch = require('node-fetch')

module.exports = {
    Query: {
        me: (parent, args, { currentUser }) => currentUser,
        totalPhotos: (parent, args, { db }) =>
            db.collection('photos').estimatedDocumentCount(),

        allPhotos: (parent, args, { db }) =>
            db.collection('photos').find().toArray(),

        totalUsers: (parent, args, { db }) =>
            db.collection('users').estimatedDocumentCount(),

        allUsers: (parent, args, { db }) =>
            db.collection('users').find().toArray(),
    },
    Mutation: {
        async postPhoto(parent, args, { db, currentUser }) {
            // 1.コンテキストにユーザーがいなければエラーを投げる
            if (!currentUser) {
                throw new Error('only an authorized user can post a photo');
            }

            // 2.現在のユーザーIDと1photoを保存する
            var newPhoto = {
                ...args.input,
                userID: currentUser.githubLogin,
                created: new Date()
            }

            // 3. 新しいphotoを追加して、データベースが生成したIDを取得する
            const { insertedIds } = await db.collection('photos').insert(newPhoto);
            newPhoto.id = insertedIds[0];
            return newPhoto
        },
        async githubAuth(parent, { code }, { db }) {

            let {
                message,
                access_token,
                avatar_url,
                login,
                name
            } = await authorizeWithGithub({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                code
            })
            console.log('=======================================');
            console.log(message);
            console.log(access_token);
            console.log(avatar_url);
            console.log(login);
            console.log(name);
            console.log('=======================================');
            if (message) {
                console.log('into error message');
                throw new Error(message)
            }

            let latestUserInfo = {
                name,
                githubLogin: login,
                githubToken: access_token,
                avatar: avatar_url
            }

            const { ops:[user] } = await db
                .collection('users')
                .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });
            console.log('hugahugahuga');
            console.log(user);
            console.log(access_token);
            return { user, token: access_token }

        },
        addFakeUsers: async (root, { count }, {db}) => {
            var randomUserApi = `https://randomuser.me/api/?results=${count}`;
            var { results } = await fetch(randomUserApi).then(res => res.json());
            var users = results.map(r => ({
                githubLogin: r.login.username,
                name: `${r.name.first} ${r.name.last}`,
                avatar: r.picture.thumnail,
                githubToken: r.login.sha1
            }))
            await db.collection('users').insert(users);
            return users;
        },
        async fakeUserAuth(parent, { githubLogin }, { db }) {
            var user = await db.collection('users').findOne({ githubLogin })

            if (!user) {
                throw new Error(`Cannot find user with githubLogin "${githubLogin}"`)
            }

            return {
                token: user.githubToken,
                user
            }
        }
    },
    Photo: {
        id: parent => parent.id || parent._id,
        url: parent => `/img/${parent.id}.jpg`,
        postedBy: (parent, args, { db }) =>
            db.collection('users').findOne({ githubLogin: parent.userId }),
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