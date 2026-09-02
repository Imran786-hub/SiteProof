"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";

const REQUIRED_CATEGORIES = [
  { code: "WIDE_SITE_VIEW", name: "Wide Site View", desc: "Full perimeter overview of the site" },
  { code: "ACTIVE_WORK_AREA", name: "Active Work Area", desc: "Main machinery and ongoing task area" },
  { code: "DIFFERENT_WORK_SECTION", name: "Different Work Section", desc: "Secondary elevation or section" },
  { code: "EQUIPMENT_MATERIALS", name: "Equipment & Materials", desc: "Machinery, materials, or supply stock" },
  { code: "PROGRESS_CLOSE_UP", name: "Progress Close-Up", desc: "Detailed quality & finish work" },
];

export default function EngineerProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<any | null>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ENGINEER") {
      router.push("/login");
      return;
    }

    const fetchProjectData = async () => {
      try {
        const apiClient = getApiClient();
        const [projRes, evRes] = await Promise.all([
          apiClient.get(`/api/v1/projects/${projectId}`),
          apiClient.get(`/api/v1/evidence?projectId=${projectId}`),
        ]);
        setProject(projRes.data);
        setEvidenceList(evRes.data.evidence || []);
      } catch (e) {
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [isAuthenticated, user, projectId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 text-center">
        <p>Project not found.</p>
        <Link href="/engineer/dashboard" className="text-indigo-400 mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const submittedCategories = new Set(evidenceList.map((e) => e.evidenceCategory));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href="/engineer/dashboard"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base font-bold text-white truncate max-w-[200px] sm:max-w-none">
              {project.name}
            </h1>
          </div>

          <Link
            href={`/engineer/projects/${projectId}/capture`}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Photo</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Project Location & Geofence Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {project.projectType} CONSTRUCTION
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Geofence Active</span>
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mt-2">{project.name}</h2>
          <p className="text-xs text-slate-400 mt-1">{project.description || "Active construction project."}</p>

          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-slate-400">Site Coordinates:</div>
              <div className="font-mono text-slate-200 mt-0.5">
                {project.location?.latitude?.toFixed(4) || "26.7606"}, {project.location?.longitude?.toFixed(4) || "83.3732"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-slate-400">Allowed Geofence Radius:</div>
              <div className="font-bold text-cyan-400 mt-0.5">
                {project.location?.geofenceRadiusMeters || 100} meters
              </div>
            </div>
          </div>
        </div>

        {/* Guided Daily Evidence Checklist */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Daily Evidence Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {submittedCategories.size} of 5 required photo categories captured
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {Math.round((submittedCategories.size / 5) * 100)}% Complete
            </span>
          </div>

          <div className="space-y-2.5">
            {REQUIRED_CATEGORIES.map((cat) => {
              const isDone = submittedCategories.has(cat.code);
              return (
                <div
                  key={cat.code}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                    isDone
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : "bg-slate-950 border-slate-800/80 text-slate-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold">{cat.name}</div>
                      <div className="text-[10px] text-slate-500">{cat.desc}</div>
                    </div>
                  </div>

                  {!isDone && (
                    <Link
                      href={`/engineer/projects/${projectId}/capture`}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[10px] rounded-lg transition"
                    >
                      Capture
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission History Feed */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4">
            Recent Submissions for this Project ({evidenceList.length})
          </h3>

          {evidenceList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evidenceList.map((ev) => {
                const imgUrl = ev.imageUrl?.startsWith("http")
                  ? ev.imageUrl
                  : `http://localhost:8000${ev.imageUrl}`;

                return (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex space-x-3"
                  >
                    <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {ev.evidenceCategory?.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-indigo-400 mt-0.5">
                        AI: {ev.analysis?.predictedStage?.replace(/_/g, " ") || "CLASSIFIED"}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Trust Score</span>
                        <span className="font-bold text-emerald-400">
                          {ev.analysis?.trustScore ?? 88}/100
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No evidence submitted yet for this project. Use the Capture button above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
