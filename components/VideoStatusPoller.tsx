'use client';
import {useEffect } from 'react';
import {useRouter} from 'next/navigation';
import { getAssetStatus } from '@/app/actions';
import { Loader2 } from 'lucide-react';

export default function VideoStatusPoller({
    id
}:{
    id: string;
}){
    const router = useRouter();
    useEffect(() => {
        const checkStatus = async () => {
            const {status, transcriptStatus } = await getAssetStatus(id);
            if (status === 'ready' && transcriptStatus === 'ready') {
                router.refresh();
            }
        };
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    }, [id, router]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            <span className="text-sm text-slate-400">Processing video...</span>
        </div>
    );
}