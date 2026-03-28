'use server';

import Mux from '@mux/mux-node';
import {cookies} from 'next/headers';
import jwt from 'jsonwebtoken';

const muxTokenId =
    process.env.MUX_TOKEN_ID ??
    process.env.MUX_TOCKEN_ID ??
    process.env.MUX_ACCESS_TOKEN_ID;

const muxTokenSecret =
    process.env.MUX_TOKEN_SECRET ??
    process.env.MUX_TOCKEN_SECRET ??
    process.env.MUX_ACCESS_TOKEN_SECRET;

function getMuxClient() {
    if (!muxTokenId || !muxTokenSecret) {
        throw new Error(
            'Missing Mux credentials. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET in .env.local (or MUX_TOCKEN_ID/MUX_TOCKEN_SECRET).'
        );
    }

    return new Mux({
        tokenId: muxTokenId,
        tokenSecret: muxTokenSecret,
    });
}

export async function createUploadUrl(){
    const mux = getMuxClient();
    const upload = await mux.video.uploads.create({
        new_asset_settings: {
            playback_policy: ['signed'],
            video_quality : 'plus',
            mp4_support: 'standard',
            input: [
                {
                    generated_subtitles:[
                        { language_code: 'en', name:'English(Auto)'}
                    ]
                },
                {
                    url: 'https://design-style-guide.freecodecamp.org/downloads/fcc_primary_small.png',
                    overlay_settings: {
                        vertical_align: 'top',
                        vertical_margin: '20px',
                        horizontal_align: 'right',
                        horizontal_margin: '20px',
                        width: '150px',
                        opacity:'80%',
                    }
                }
            ]
        },
        cors_origin: '*',
    });
    return upload;
}

export async function getAssetIdFromUpload(uploadId:string){
    const mux = getMuxClient();
    const upload = await mux.video.uploads.retrieve(uploadId);

    if(upload.asset_id){
        const asset = await mux.video.assets.retrieve(upload.asset_id);
        const playbackId = asset.playback_ids?.[0]?.id;
        return {
            playbackId,
            status: asset.status
        };

    }
    return { status: 'waiting'};

}
export async function listVideos(){
    try {
        const mux = getMuxClient();
        const assets = await mux.video.assets.list({
            limit : 25,
        });
        return assets.data;
    } catch (e){
        console.log("Error listing videos",e);
        return [];
    }
}
function formatVttTime(timestamp:string){
    return timestamp.split(',')[0];
}
export async function getAssetStatus(playbackId: string) {
    try {
        const mux = getMuxClient();
        const assets = await mux.video.assets.list({ limit: 100 });
        const asset = assets.data.find(a =>
            a.playback_ids?.some(p => p.id === playbackId)
        );

        if (!asset) {
            return { status: 'errored', transcriptStatus: 'errored', transcript: [] };
        }

        let transcript: { time: string; text: string }[] = [];
        let transcriptStatus = 'preparing';

        if (asset.status === 'ready' && asset.tracks) {
            const textTrack = asset.tracks.find(
                t => t.type === 'text' && t.text_type === 'subtitles'
            );

            if (textTrack && textTrack.status === 'ready') {
                transcriptStatus = 'ready';

                const vttUrl = `https://stream.mux.com/${playbackId}/text/${textTrack.id}.vtt`;
                const response = await fetch(vttUrl);
                const vttText = await response.text();
                const blocks = vttText.split('\n\n');

                transcript = blocks.reduce((acc: { time: string; text: string }[], block) => {
                    const lines = block.split('\n');
                    if (lines.length >= 2 && lines[1].includes('-->')) {
                        const time = formatVttTime(lines[1].split('--> ')[0]);
                        const text = lines.slice(2).join(' ');
                        if (text.trim()) acc.push({ time, text });
                    }
                    return acc;
                }, []);
            }
        }

        return {
            status: asset.status,
            transcriptStatus,
            transcript
        };
    } catch (e) {
        return { status: 'errored', transcriptStatus: 'errored', transcript: [] };
    }
}
export async function generateVideoSummary(playbackId: string) {
    try {
        const mux = getMuxClient();
        const assets = await mux.video.assets.list({ limit: 100 });
        const asset = assets.data.find(a =>
            a.playback_ids?.some(p => p.id === playbackId)
        );

        if (!asset) throw new Error('Asset not found');

        const { getSummaryAndTags } = await import('@mux/ai/workflows');
        const result = await getSummaryAndTags(asset.id, {
            provider: 'google',
            tone: 'professional',
        });

        return {
            title: result.title,
            summary: result.description,
            tags: result.tags,
        };
    } catch (error) {
        console.error('Error generating summary:', error);
        return null;
    }
}

export async function getSignedPlaybackToken(playbackId: string){
    const user = await getCurrentUser();
    if(!user) {
        throw new Error('Not authenticated');
    }

    //decode the base64 private key 
    const privateKey = Buffer.from(process.env.MUX_SIGNING_PRIVATE_KEY!, 'base64'
    ).toString('ascii');

    //create a signed jwt
    const token = jwt.sign(
        {
            sub: playbackId,
            aud: 'v', //audience : 'v' for video
            exp: Math.floor(Date.now() / 1000) + (60 * 60),
        },
        privateKey,
        {
            algorithm: 'RS256',
            keyid: process.env.MUX_SIGNING_KEY_ID,
        }
    );
    return token;
}
async function getCurrentUser(){
    const cookieStore = await cookies();
    return cookieStore.get('user') ?.value || null;
}