"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Flag,
  Calendar,
  Layers,
  MapPin,
  Sparkles,
  ShieldCheck,
  Eye,
  X
} from "lucide-react";

export default function EvidenceGalleryPage() {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeModalItem, setActiveModalItem] = useState<any | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "DEPARTMENT_ADMIN") {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const apiClient = getApiClient();
        const [evRes, projRes] = await Promise.all([
          apiClient.get("/api/v1/evidence"),
          apiClient.get("/api/v1/projects"),
        ]);
        setEvidenceList(evRes.data.evidence || []);
        setProjects(projRes.data || []);
      } catch (e) {
        toast.error("Failed to load evidence feed");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  const handleFilterChange = async (projectId: string) => {
    setSelectedProject(projectId);
    setLoading(true);
    try {
      const apiClient = getApiClient();
      const url = projectId ? `/api/v1/evidence?projectId=${projectId}` : "/api/v1/evidence";
      const res = await apiClient.get(url);
      setEvidenceList(res.data.evidence || []);
    } catch (e) {
      toast.error("Failed to filter evidence");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: "VERIFIED" | "FLAGGED" | "RECAPTURE_REQUESTED") => {
    if (!activeModalItem) return;
    if (action === "RECAPTURE_REQUESTED" && !actionReason.trim()) {
      toast.error("Please provide a reason for recapture request");
      return;
    }

    setActionLoading(true);
    try {
      const apiClient = getApiClient();
      await apiClient.patch(`/api/v1/evidence/${activeModalItem.id}`, {
        action,
        reason: actionReason
      });

      toast.success(`Evidence marked as ${action.replace(/_/g, " ")}`);
      
      // Update local state
      setEvidenceList((prev) =>
        prev.map((item) =>
          item.id === activeModalItem.id
            ? { ...item, verificationStatus: action }
            : item
        )
      );
      setActiveModalItem(null);
      setActionReason("");
    } catch (e) {
      toast.error("Failed to update evidence status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEvidence = evidenceList.filter((ev) => {
    if (selectedCategory && ev.evidenceCategory !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">Evidence Review Feed</h1>
          </div>
          <div className="text-xs text-slate-400">
            {filteredEvidence.length} Submission(s) Found
          </div>
        </div>
      </nav>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2 text-sm text-slate-400 font-medium">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span>Project:</span>
            </div>
            <select
              value={selectedProject}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectType})
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2 text-sm text-slate-400 font-medium ml-2">
              <span>Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="WIDE_SITE_VIEW">Wide Site View</option>
              <option value="ACTIVE_WORK_AREA">Active Work Area</option>
              <option value="DIFFERENT_WORK_SECTION">Different Work Section</option>
              <option value="EQUIPMENT_MATERIALS">Equipment & Materials</option>
              <option value="PROGRESS_CLOSE_UP">Progress Close-Up</option>
            </select>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        ) : filteredEvidence.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredEvidence.map((ev) => {
              const trustScore = ev.analysis?.trustScore ?? 85;
              const predictedStage = ev.analysis?.predictedStage ?? "STAGE PREDICTION READY";
              const imgUrl = ev.imageUrl?.startsWith("http")
                ? ev.imageUrl
                : `http://localhost:8000${ev.imageUrl}`;

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden group hover:border-slate-700 transition shadow-sm flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt="Site Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e: any) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=60";
                      }}
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur text-white border border-slate-700">
                        {ev.evidenceCategory?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md backdrop-blur border ${
                          trustScore >= 80
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                            : trustScore >= 50
                            ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                            : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                        }`}
                      >
                        Trust: {trustScore}/100
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveModalItem(ev)}
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2 text-white font-semibold"
                    >
                      <Eye className="w-5 h-5" />
                      <span>Inspect AI Analysis</span>
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-base truncate">{ev.projectName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Submitted by {ev.engineerName}</p>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">AI Predicted Stage</span>
                        <span className="font-bold text-indigo-300 truncate max-w-[160px]">
                          {predictedStage.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400">GPS Geofence</span>
                        <span
                          className={`font-semibold ${
                            ev.locationVerified ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {ev.locationVerified ? "Verified (Inside Radius)" : "Outside Geofence"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span
                        className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                          ev.verificationStatus === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : ev.verificationStatus === "RECAPTURE_REQUESTED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : ev.verificationStatus === "FLAGGED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {ev.verificationStatus?.replace(/_/g, " ")}
                      </span>

                      <button
                        onClick={() => setActiveModalItem(ev)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Review Actions →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800 mt-6">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No Evidence Found</p>
            <p className="text-xs text-slate-600 mt-1">Try selecting a different project or category filter.</p>
          </div>
        )}
      </div>

      {/* Inspector & Review Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 relative my-8 shadow-2xl">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Evidence Deep Inspection & Action
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              {activeModalItem.projectName} • {activeModalItem.engineerName}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    activeModalItem.imageUrl?.startsWith("http")
                      ? activeModalItem.imageUrl
                      : `http://localhost:8000${activeModalItem.imageUrl}`
                  }
                  alt="Inspection"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* AI Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Model Analysis</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      Stage:{" "}
                      <span className="text-slate-100 font-bold">
                        {activeModalItem.analysis?.predictedStage?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </div>
                    <div>
                      Confidence:{" "}
                      <span className="text-emerald-400 font-bold">
                        {Math.round((activeModalItem.analysis?.confidence ?? 0.85) * 100)}%
                      </span>
                    </div>
                  </div>
                  {activeModalItem.analysis?.detectedObjects && (
                    <div className="mt-2 text-slate-400">
                      Objects:{" "}
                      <span className="text-cyan-300 font-medium">
                        {activeModalItem.analysis.detectedObjects.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-300 flex items-center space-x-1.5 mb-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>Location & Quality Signals</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      Geofence:{" "}
                      <span
                        className={
                          activeModalItem.locationVerified
                            ? "text-emerald-400 font-bold"
                            : "text-rose-400 font-bold"
                        }
                      >
                        {activeModalItem.locationVerified ? "Verified" : "Mismatch"}
                      </span>
                    </div>
                    <div>
                      Quality:{" "}
                      <span className="text-indigo-300 font-bold">
                        {Math.round((activeModalItem.analysis?.qualityScore ?? 0.9) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recapture Reason Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supervisor Notes / Recapture Instructions:
                  </label>
                  <textarea
                    rows={2}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="e.g. Please retake wide angle photo with clearer lighting of active work area."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-3 justify-end">
              <button
                disabled={actionLoading}
                onClick={() => handleReviewAction("VERIFIED")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Evidence</span>
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleReviewAction("RECAPTURE_REQUESTED")}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Request Recapture</span>
              </button>

              <button
                disabled={actionLoading}
                onClick={() => handleReviewAction("FLAGGED")}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 shadow"
              >
                <Flag className="w-4 h-4" />
                <span>Flag Suspicious</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
