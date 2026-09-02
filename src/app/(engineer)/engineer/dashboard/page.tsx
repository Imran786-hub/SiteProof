"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Camera,
  RotateCcw,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function EngineerDashboard() {
  const [dashboardData, setDashboardData] = useState<{
    assignedProjects: any[];
    recaptureRequests: any[];
  }>({
    assignedProjects: [],
    recaptureRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ENGINEER") {
      router.push("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const apiClient = getApiClient();
        const res = await apiClient.get("/api/v1/engineer/dashboard");
        setDashboardData(res.data);
      } catch (error: any) {
        // Fallback fetch if custom endpoint fails
        try {
          const apiClient = getApiClient();
          const projRes = await apiClient.get("/api/v1/projects");
          const projs = projRes.data || [];
          setDashboardData({
            assignedProjects: projs.map((p: any) => ({
              ...p,
              todaySubmissions: 0,
              minimumRequired: p.minimumImages || 5,
              isCompletedToday: false,
            })),
            recaptureRequests: [],
          });
        } catch (e) {
          toast.error("Failed to load assigned projects");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isAuthenticated, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Mobile-First Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
                SiteProof AI
              </span>
              <div className="text-[10px] text-cyan-400 font-medium">Field Engineer Portal</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-300 hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Welcome Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-500/30 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Field Operations
            </div>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Welcome, {user?.name || "Engineer"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Capture live site photos within verified geofence perimeters for AI evidence validation.
            </p>
          </div>
        </div>

        {/* Recapture Request Notification Banners */}
        {dashboardData.recaptureRequests && dashboardData.recaptureRequests.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Action Required: Supervisor Recapture Requests ({dashboardData.recaptureRequests.length})</span>
            </h3>
            {dashboardData.recaptureRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="text-sm font-bold text-amber-300">{req.projectName}</div>
                  <div className="text-xs text-amber-200/90 mt-0.5">
                    <span className="font-semibold">Reason:</span> {req.reason}
                  </div>
                  <div className="text-[10px] text-amber-400/70 mt-0.5">
                    Category: {req.category?.replace(/_/g, " ")}
                  </div>
                </div>
                <Link
                  href={`/engineer/projects/${req.projectId}/capture`}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recapture Now</span>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Assigned Projects List */}
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
          Assigned Construction Sites ({dashboardData.assignedProjects.length})
        </h3>

        {dashboardData.assignedProjects.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
            <p className="font-medium text-sm">No Projects Assigned Yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Your department administrator will assign construction projects to your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboardData.assignedProjects.map((project) => {
              const progressPct = Math.min(
                100,
                Math.round(
                  ((project.todaySubmissions || 0) / (project.minimumRequired || 5)) * 100
                )
              );

              return (
                <div
                  key={project.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {project.projectType}
                      </span>
                      <h4 className="text-base font-bold text-white mt-1.5">{project.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{project.address || "Configured Site Location"}</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        project.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Daily Progress Counter */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400 font-medium">Today&apos;s Evidence Quota</span>
                      <span className="font-bold text-slate-200">
                        {project.todaySubmissions || 0} / {project.minimumRequired || 5} Photos
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progressPct >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <Link
                      href={`/engineer/projects/${project.id}`}
                      className="text-xs font-semibold text-slate-300 hover:text-white transition"
                    >
                      View Checklist & Details →
                    </Link>

                    <Link
                      href={`/engineer/projects/${project.id}/capture`}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center space-x-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Open Camera</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
