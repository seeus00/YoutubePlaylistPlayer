const express = require('express')
const axios = require('axios');
const fs = require('fs');
const ytdl = require('ytdl-core');
const passport =require("passport")
const googleAuth = require('./util/googleAuth')
var {google} = require('googleapis');

const app = express()
const port = 5000

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.send("ROOT")
})


app.get('/google/callback', (req, res) => {
    res.send("SUCCESS")
});

app.get('home', (req, res) => {
    res.send("You're on the home page.")
})

app.get('/authPlaylist', (req, res) => {
    googleAuth.getOAuthClient((auth) => {
        const params = {
            "playlistId": req.query.id,
            "auth": auth,
            "key": "AIzaSyCvuv0GDFqS851Y0d6N43atkiV4PHTrTW8",
            "part": "snippet",
            "maxResults": 50
        }
    
        if (req.query.pageToken !== undefined) {
            params.pageToken = req.query.pageToken
        }
    
        var service = google.youtube('v3')
        service.playlistItems.list(params).then((resp) => {
            let videos = resp.data.items.filter(item => item.snippet.resourceId.kind === "youtube#video")
            videos = videos.map(item => {
                return {
                    "id": item.snippet.resourceId.videoId,
                    "thumbnails": item.snippet.thumbnails,
                    "title": item.snippet.title,
                    "channelId": item.snippet.channelId,
                    "publishedAt": item.snippet.publishedAt
                }
            })
    
            //Filter out privated or unavailable videos
            videos = videos.filter(video => video.thumbnails.default !== undefined)
            res.json({'videos': videos, 'nextPageToken' : resp.data.nextPageToken, 
                'prevPageToken' : resp.data.prevPageToken})
    
            }).catch((err) => {
                res.status(404).json({message: err})
            })
        })
    })
// app.get('/playlist', (req, res) => {
//     const params = {
//         "playlistId": req.query.id,
//         "key": "AIzaSyCvuv0GDFqS851Y0d6N43atkiV4PHTrTW8",
//         "part": "snippet",
//         "maxResults": 50
//     }
//     console.log(req.query)
//     if (req.query.pageToken !== undefined) {
//         params.pageToken = req.query.pageToken
//     }

//     axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
//         params: params
//     }).then((resp) => {
//         let videos = resp.data.items.filter(item => item.snippet.resourceId.kind === "youtube#video")
//         videos = videos.map(item => {
//             return {
//                 "id": item.snippet.resourceId.videoId,
//                 "thumbnails": item.snippet.thumbnails,
//                 "title": item.snippet.title,
//                 "channelId": item.snippet.channelId,
//                 "publishedAt": item.snippet.publishedAt
//             }
//         })

//         //Filter out privated or unavailable videos
//         videos = videos.filter(video => video.thumbnails.default !== undefined)
//         res.json({'videos': videos, 'nextPageToken' : resp.data.nextPageToken, 
//             'prevPageToken' : resp.data.prevPageToken})

//     }).catch((err) => {
//         res.status(404).json({message: 'ERROR: Youtube video ID invalid!'})
//     })
// })

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/video', async (req, res) => {
    await sleep(20)

    const videoId = req.query.id
    if (videoId === 'undefined') {
        res.status(400).send({
            message: "VIDEO ID IS INVALID"
        })
        return
    }

    try {
        const info = await ytdl.getInfo('http://www.youtube.com/watch?v=' + videoId)
        const audioSources = info.formats.filter(video => video.mimeType.includes("audio"))
    
        const bestQualityAudioSource = audioSources[0];
        res.json(bestQualityAudioSource)
    }catch (e) {
        res.status(400).send({ 
            message: "ERROR, video is invalid or unavailible!"
        })
    }
})

app.listen(port, () => {
    console.log("APP is listening for requests")
})