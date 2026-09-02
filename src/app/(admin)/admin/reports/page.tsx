"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Building2,
  TrendingUp,
  Percent
} from "lucide-react";

export default function DailyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);

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
        const [repRes, projRes] = await Promise.all([
          apiClient.get("/api/v1/reports/daily"),
          apiClient.get("/api/v1/projects"),
        ]);
        setReports(repRes.data.reports || []);
        setProjects(projRes.data || []);
      } catch (e) {
        toast.error("Failed to load daily reports");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  const handleProjectFilter = async (projectId: string) => {
    setSelectedProject(projectId);
    setLoading(true);
    try {
      const apiClient = getApiClient();
      const url = projectId ? `/api/v1/reports/daily?projectId=${projectId}` : "/api/v1/reports/daily";
      const res = await apiClient.get(url);
      setReports(res.data.reports || []);
    } catch (e) {
      toast.error("Failed to filter reports");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center space-x-2">
              <FileText className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold text-white">Daily Site Reports</h1>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Controls */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400">Filter By Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectType})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-400">
            {reports.length} Daily Site Digest(s) Generated
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((rep) => {
              const dateStr = new Date(rep.reportDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const trustScore = rep.trustScore ?? 88;

              return (
                <div
                  key={rep.id}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {rep.projectType}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-1">{rep.projectName}</h3>
                      <p className="text-xs text-slate-400">Field Engineer: {rep.engineerName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-300 flex items-center justify-end space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                        <span>{dateStr}</span>
                      </div>
                      <div
                        className={`text-xs font-bold mt-1.5 ${
                          trustScore >= 80
                            ? "text-emerald-400"
                            : trustScore >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        Trust: {trustScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Evidence Photos</div>
                      <div className="text-base font-bold text-slate-100 mt-0.5">
                        {rep.totalSubmitted} / {rep.totalRequired}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {rep.totalSubmitted >= rep.totalRequired ? "Quotas Met" : "In Progress"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Photo Diversity</div>
                      <div className="text-base font-bold text-cyan-400 mt-0.5">
                        {Math.round((rep.photoDiversity ?? 0.88) * 100)}%
                      </div>
                      <div className="text-[10px] text-slate-500">Angle Variety</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-medium">Duplicate Risk</div>
                      <div
                        className={`text-base font-bold mt-0.5 ${
                          rep.duplicateCount > 0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {rep.duplicateCount} Found
                      </div>
                      <div className="text-[10px] text-slate-500">SHA-256 / pHash</div>
                    </div>
                  </div>

                  {/* AI Prediction Box */}
                  <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-purple-300 flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>AI Stage Progression:</span>
                      </div>
                      <span className="font-bold text-slate-100">
                        {rep.aiPredictedStage?.replace(/_/g, " ") || "PROGRESSING"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No Daily Reports Yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Daily digests will automatically generate as engineers submit evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
