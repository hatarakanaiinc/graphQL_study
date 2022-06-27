const fetch = require('node-fetch')
const fs = require('fs')

const findBy = (value, array, field='id') =>
	array[array.map(item=>item[field]).indexOf(value)]

const generateFakeUsers = count =>
    fetch(`https://randomuser.me/api/?results=${count}`)
        .then(res => res.json())

async function requestGithubToken(credentials) {
    const res = await fetch(
        'https://github.com/login/oauth/access_token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(credentials)
        }
    );
    const hoge = await res.json();
    return hoge;
}
async function requestGithubUserAccount(access_token) {
    const res = await fetch(`https://api.github.com/user`, {
        headers:{
            'Authorization': `token ${access_token}`
        }
    });
    const hoge = await res.json();
    return hoge;
}
const authorizeWithGithub = async credentials => {
    const { access_token } = await requestGithubToken(credentials);
    const githubUser = await requestGithubUserAccount(access_token);
    console.log(githubUser);
    return { ...githubUser, access_token }
}

const saveFile = (stream, path) =>
    new Promise((resolve, reject) => {
        stream.on('error', error => {
            if (stream.truncated) {
                fs.unlinkSync(path)
            }
            reject(error)
        }).on('end', resolve)
        .pipe(fs.createWriteStream(path))
    })

const uploadFile = async (file, path) => {
    const { stream } = await file
    return saveFile(stream, path)
}

module.exports = {findBy, authorizeWithGithub, generateFakeUsers, uploadFile}
