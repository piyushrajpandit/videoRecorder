'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createUploadUrl , getAssetIdFromUpload } from '@/app/actions';
import { StopCircle , Monitor } from 'lucide-react';

export default function ScreenRecorder(){
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [mediaBlob , setMediaBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const livevideoRef = useRef<HTMLVideoElement>(null);

    const router = useRouter();
    const startRecording = async () => {
        try {
             //step 1 : Capture the screen 
             const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video : true, 
                audio: false,
             });
             // step 2 : capture the microphone 
             const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation : true,
                    noiseSuppression: true, 
                    sampleRate: 44100,
                },
                video: false,
            });
            //Step 3 : Store references for cleanup 
            screenStreamRef.current = screenStream; 
            micStreamRef.current = micStream;

            //step 4 : Combine the streams
            const combinedStream = new MediaStream([
                ...screenStream.getVideoTracks(),
                ...micStream.getAudioTracks(),
            
            ]);

            //step 5 : show live preview 
            if(livevideoRef.current){
                livevideoRef.current.srcObject = combinedStream;

            }

            //step 6 : set up the recorder 
            const mediaRecorder = new MediaRecorder(combinedStream,{
                mimeType: 'video/webm; codecs=vp9'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            //step 7 : Collect chuncks as they're recorded 
            mediaRecorder.ondataavailable = (event) => {
                if(event.data.size > 0) chunksRef.current.push(event.data);
            };

            //step 8: Handle recording completion 
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {type : 'video/webm'});
                setMediaBlob(blob);
                if(livevideoRef.current){
                    livevideoRef.current.srcObject = null;
                }

                //Critaical : Stop all tracks
                screenStreamRef.current?.getTracks().forEach(t => t.stop());
                micStreamRef.current?.getTracks().forEach(t => t.stop());

            };

            //step 9 : Start recording 
            mediaRecorder.start();
            setIsRecording(true);
            

            //step 10 : Handle native "stop sharing " button
            screenStream.getVideoTracks()[0].onended = stopRecording;
        }
        catch(err){
            console.error('error starting recording:',err);

        }
    };
    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };
    const handleUpload = async () => {
        if(!mediaBlob) return ; 
        setIsUploading(true);
        try{
            //step 1 : Get a signed upload URL from our server 
            const uploadConfig = await createUploadUrl();
            //step 2 : Upload directly to Mux (not through our server!)
            await fetch(uploadConfig.url,{
                method: 'PUT',
                body: mediaBlob
            });

            //step 3 : poll until processing cpmpletes
            while(true){
                const result = await getAssetIdFromUpload(uploadConfig.id);
                if(result.playbackId){
                    router.push(`/video/${result.playbackId}`);
                    break;
                }
                await new Promise(r=> setTimeout(r,1000));
                }
            } catch(err){
                console.error('Upload failed',err);
                setIsUploading(false);
            }
        };
        return(
    

            <div className = "flex flex-col items-center gap-6 p-8 bg-slate-900 rounded-xl border border-slate-700">
                <h2 className="text-2xl font-bold text-white">
                    {isRecording ? "Recording..." : "New Recording"}

                </h2>
                {/* Preview (while recording) */}
                <video 
                    ref = {livevideoRef}
                    autoPlay
                    playsInline
                    muted 
                    className = {`w-full h-full object-cover ${isRecording ? 'block' : 'hidden'}`}
                />
                {/*Recording ready state */}
                {!isRecording && mediaBlob && (
                    <div className="flex flex-col items-center text-emerald-400">
                        <StopCircle className="w-16 h-16 mb-4" />
                        <span>Recording ready!</span>
                    </div>      
                )}
                {/*Idle state */}
                {!isRecording && !mediaBlob && (
                    <div className= "text-slate-600 flex flex-col items-center">
                        <Monitor className = "w-16 h-12 mb-2 opacity-50" />
                        <span>Preview Area  </span>
                    </div>
                )}

                {/*Recording Indicator */}
                {isRecording && (
                    <div className = "absolute top-4 right-4 animate-pulse">
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)]"                       /> 
                    </div>
                )}

                {/* Controls */}
                <div className="flex w-full gap-4">
                        {!isRecording && !mediaBlob && (

                            <button
                                onClick={startRecording}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Start Recording
                            </button>   
                        )}

                        {isRecording && (
                            <button 
                                onClick={stopRecording}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Stop Recording
                            </button>
                        )}
                        {mediaBlob && (
                            <button
                                onClick={handleUpload}
                                className={`flex-1 ${isUploading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded`}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Upload Recording'}
                            </button>
                        )}
                    </div>
                </div>
        );
    }
