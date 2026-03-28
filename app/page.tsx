import ScreenRecorder from "@/components/ScreenRecorder";
import Link from "next/link";
import { LayoutGrid, Video } from "lucide-react";
import { cookies } from "next/headers";
import SimpleAuth from "../components/SimpleAuth";

async function getCurrentUser(){
  const cookiesStore = await cookies();
  return cookiesStore.get('user')?.value || null;
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Screen Recorder</h1>
            <p className="text-slate-400 mt-1">Record, upload, and summarize your videos with Mux + AI.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
            >
              <LayoutGrid className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
            >
              <Video className="w-4 h-4" />
              My Videos
            </Link>
          </div>
        </div>

        <SimpleAuth currentUser={currentUser} />

        <ScreenRecorder />
      </div>
    </main>
  );
}
