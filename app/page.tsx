import ScreenRecorder from "@/components/ScreenRecorder";
import Link from "next/link";
import { LayoutGrid, Video, Github, MapPin } from "lucide-react";
import { cookies } from "next/headers";
import SimpleAuth from "../components/SimpleAuth";
import Image from "next/image";

async function getCurrentUser() {
  const cookiesStore = await cookies();
  return cookiesStore.get("user")?.value || null;
}

export default async function Home() {
  const currentUser = await getCurrentUser();
  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-12 text-slate-200 flex flex-col">
      <div className="max-w-5xl mx-auto space-y-8 flex-1 w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Screen Recorder</h1>
            <p className="text-slate-400 mt-1">
              Record, upload, and summarize your videos with Mux + AI.
            </p>
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

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="max-w-5xl mx-auto w-full mt-16 pt-8 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

          {/* Avatar */}
          <Image
            src="https://github.com/piyushrajpandit.png"
            alt="Piyush Raj"
            width={56}
            height={56}
            className="rounded-full ring-2 ring-blue-500/50 shrink-0"
          />

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-white font-semibold text-base">Piyush Raj</p>

            <p className="text-slate-400 text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-3 h-3" />
              CS Student · BMSIT Bangalore
            </p>

            <p className="text-slate-300 text-sm mt-2 max-w-sm">
              Building full-stack products with Next.js, MongoDB & AI.{" "}
              <span className="text-blue-400 font-medium">
                Open to internships — let's build something.
              </span>
            </p>

            <a
              href="https://github.com/piyushrajpandit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              github.com/piyushrajpandit
            </a>
          </div>

          {/* Hire Me badge */}
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Available for Hire
            </span>
          </div>

        </div>

        <p className="text-center text-slate-600 text-xs mt-8">
          Built with Next.js · Mux · AI — © {new Date().getFullYear()} Piyush Raj
        </p>
      </footer>
    </main>
  );
}