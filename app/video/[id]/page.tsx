import Link from "next/link";
import { getAssetStatus } from "@/app/actions";
import MuxPlayerWrapper from "@/components/MuxPlayerWrapper";
import VideoStatusPoller from "@/components/VideoStatusPoller";
import ShareButton from "@/components/ShareButton";
import VideoSummary from "@/VideoSummary";
import { ArrowLeft, Download } from "lucide-react";
import { getSignedPlaybackToken } from "@/app/actions";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: playbackId } = await params;

  const { status, transcriptStatus, transcript } =
    await getAssetStatus(playbackId);

  const isVideoReady = status === "ready";
  const isTranscriptReady = transcriptStatus === "ready";

  const downloadUrl = `https://stream.mux.com/${playbackId}/high.mp4?download=screen-recording`;

  const token = await getSignedPlaybackToken(playbackId);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Navigation */}
        <div className="lg:col-span-3 mb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Record New Video
          </Link>
        </div>

        {/* Left Column: Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            {isVideoReady ? (
              <MuxPlayerWrapper playbackId={playbackId} token={token} />
            ) : (
              <VideoStatusPoller id={playbackId} />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ShareButton />

            <a
              href={downloadUrl}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>

          {isVideoReady && (
            <VideoSummary playbackId={playbackId} />
          )}
        </div>

        {/* Right Column: Transcript */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h2 className="text-lg font-semibold mb-4">Transcript</h2>

          {isTranscriptReady ? (
            <p className="text-slate-300 whitespace-pre-wrap">
              {transcript.map((entry) => `${entry.time} ${entry.text}`).join('\n')}
            </p>
          ) : (
            <p className="text-slate-400">Generating transcript...</p>
          )}
        </div>

      </div>
    </main>
  );
}