'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function VideoThumbnail({playbackId }: {playbackId: string}){
    const [isHovered, setIsHovered] = useState(false);
    const [hasError, setHasError] = useState(false);

    const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=10`;
    const gifUrl = `https://image.mux.com/${playbackId}/animated.gif?time=10&duration=5`;

    if(hasError){

        return (
            <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                <span className="text-sm text-slate-500">Error loading thumbnail</span>
            </div>
        );
    }
    return (
        <div   className="w-full h-48 bg-slate-200 relative rounded-lg overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Image
                src={isHovered ? gifUrl : posterUrl}
                alt="Video Thumbnail"
                fill
                className="object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
}