const { authorizeWithGithub } = require('../lib');
require('dotenv').config();
const fetch = require('node-fetch')

module.exports = {
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
}