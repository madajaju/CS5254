const fs = require('fs');
const {google} = require('googleapis');
const path = require("node:path");
const OAuth2 = google.auth.OAuth2;


const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
];

module.exports = {
    friendlyName: 'publish',
    description: 'Upload a video  to youtube channel.',
    static: false, // True is for Class methods. False is for object based.
    inputs: {
        artifact: {
            description: 'Artifact to upload to youtube.',
            type: 'ref',
            required: true,
        },
        channel: {
            description: "Channel to publish the video",
            type: "ref",
            required: true,
        },
        publishDate: {
            description: "Date to publish the video",
            type: "date",
            required: false,
        }
    },

    exits: {
        success: {},
        json: {},
        notFound: {
            description: 'No item with the specified ID was found in the database.',
        }
    },

    fn: async function (inputs, env) {
        // inputs contains the obj for the this method.
        let artifact = inputs.artifact;
        if (typeof artifact === 'string') {
            console.log("artifact is a string", artifact);
            artifact = Artifact.find({id:artifact});
            console.log("artifact is now an object", artifact);
            if(!artifact) {
                console.error("artifact not found");
                return;
            }
        }
        let channel = inputs.channel;
        if(typeof channel === 'string') {
            channel = Channel.find(channel);
        }
        let data = {
            title: inputs.title,
            summary: inputs.summary,
            tags: inputs.tags.join(','),
            name: inputs.name
        }
        let publishDate = inputs.publishDate || null;
        if(!inputs.url || inputs.url.length === 0) {
            console.log("Upload to Youtube:", data);
            let oauthclient = await authorize(channel);
            AEvent.emit("upload.started", {message: `Started Uploading Youtube Video, ${artifact?.name}`});
            let uploadedURL = await uploadVideo(artifact, data, oauthclient, channel, publishDate);
            AEvent.emit("upload.completed", {message: `Started Uploading Youtube Video, ${artifact?.name}, ${uploadedURL}`});
            inputs.url = uploadedURL;
        }
        return new Asset(inputs);
    }
};

async function findPlaylistIdByName(auth, playlistName) {
    const service = google.youtube('v3');
    try {
        const response = await service.playlists.list({
            auth: auth,
            mine: true,
            part: 'snippet',
            maxResults: 50
        });
        const playlists = response.data.items || [];
        const match = playlists.find(pl => pl.snippet.title === playlistName);
        if (match) {
            console.log(`Found playlist "${playlistName}" with ID: ${match.id}`);
            return match.id;
        } else {
            console.log(`Playlist named "${playlistName}" not found.`);
            return null;
        }
    } catch (err) {
        console.error('YouTube API error: ', err);
        throw err;
    }
}

async function addVideoToPlaylist(playlistId, videoID, oauthclient) {

    const service = google.youtube('v3');
    service.playlistItems.insert({
        auth: oauthclient,
        part: 'snippet',
        requestBody: {
            snippet: {
                playlistId: playlistId,
                resourceId: {
                    kind: 'youtube#video',
                    videoId: videoID,
                }
            }
        }
    }, (err, response) => {
        if (err) {
            console.log('Error adding video to playlist: ' + err);
            return;
        }
        console.log('Video added to playlist:', response.data);
    });
}
async function uploadVideo(artifact, data, oauthclient, channel, publishDate) {
    if(data.title.length > 80) {
       data.title = data.title.substring(0, 78) + '...';
    }
    try {
        const video = {
            snippet: {
                title: data.title,
                description: data.summary,
                tags: data.tags,
                categoryId: 28,
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en',
            },
            status: {
                privacyStatus: 'public',
                selfDeclaredMadeForKids: false
            }
        }
        if(publishDate) {
            video.status = {
                privacyStatus: 'private',
                publishAt: publishDate.toISOString(),
                selfDeclaredMadeForKids: false
            }
        }
        const media = {
            body: fs.createReadStream(artifact.url)
        }
        const youtube = google.youtube('v3');
        const response = await youtube.videos.insert({
            auth: oauthclient,
            part: 'snippet,status',
            requestBody: video,
            media: media
        });

        const videoID = response.data.id;
        // Ok now see if you can find the tile.png or the thumbnail.png and upload that.
        // Need to get the language from the name of the artifact
        let tileFile = path.resolve(path.dirname(artifact.url), 'tile.png');
        if(!fs.existsSync(tileFile)) {
            tileFile = path.resolve(path.dirname(artifact.url), 'thumbnail.png');
        }
        if(fs.existsSync(tileFile)) {
            await youtube.thumbnails.set({
                auth: oauthclient,
                videoId: videoID,
                media: {
                    body: fs.createReadStream(tileFile)
                }
            })
        }
        if(channel.playlist) {
            let playListID = await findPlaylistIdByName(oauthclient, channel.playlist);
            if (playListID) {
                await addVideoToPlaylist(playListID, videoID, oauthclient);
            }
        }

        return `https://youtu.be/${videoID}`;
    } catch (e) {
        AEvent.emit("upload.error", {message:"Error Uploading:" + e});
        console.error("Youtube Stats error:", e);
        console.error("parameters being passed:", data);
    }
}

function authorize(channel) {

    const clientSecret = channel.creds.client_secret;
    const clientId = channel.creds.client_id;
    const redirectUrl = channel.creds.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    oauth2Client.credentials = channel.creds.tokens || {};

    // If we have an expiry_date, check if we're already expired (or within 1 min of expiry)
    const now = Date.now();
    const buffer = 60 * 1000; // 1 minute
    const expiryDate = oauth2Client.credentials.expiry_date || 0;
    if (expiryDate - now < buffer) {
        // Token is expired (or about to); refresh!
        console.log('Access token expired (or close to it); refreshing…');
        return oauth2Client
            .refreshAccessToken()          // <-- retrieves new tokens using refresh_token
            .then(({ credentials }) => {
                // Persist the new tokens back to your channel object (or wherever you store them)
                channel.creds.tokens = credentials;
                channel.podcast.save();
                // e.g. save them to the database here…
                console.log('Refreshed tokens:', credentials);
                oauth2Client.credentials = credentials;
                return oauth2Client;
            })
            .catch(err => {
                console.error('Failed to refresh token:', err);
                throw err;
            });
    }

    // Otherwise our token is still good
    return Promise.resolve(oauth2Client);
}
