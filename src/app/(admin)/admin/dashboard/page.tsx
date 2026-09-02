"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Building2,
  Users,
  AlertTriangle,
  FileCheck2,
  Camera,
  Layers,
  ArrowRight,
  ShieldCheck,
  MapPin,
  TrendingUp,
  FileText
} from "lucide-react";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalEngineers: number;
  activeEngineers: number;
  totalEvidence: number;
  suspiciousCount: number;
  recentEvidence: Array<{
    id: string;
    projectName: string;
    engineerName: string;
    category: string;
    imageUrl: string;
    trustScore: number;
    trustStatus: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalEngineers: 0,
    activeEngineers: 0,
    totalEvidence: 0,
    suspiciousCount: 0,
    recentEvidence: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "DEPARTMENT_ADMIN") {
      router.push("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const apiClient = getApiClient();
        const res = await apiClient.get("/api/v1/dashboard/stats");
        setStats(res.data);
      } catch (error: any) {
        // Fallback fetch if stats endpoint fails
        try {
          const apiClient = getApiClient();
          const [projRes, engRes] = await Promise.all([
            apiClient.get("/api/v1/projects"),
            apiClient.get("/api/v1/engineers"),
          ]);
          const projects = projRes.data || [];
          const engineers = engRes.data || [];
          setStats((prev) => ({
            ...prev,
            totalProjects: projects.length,
            activeProjects: projects.filter((p: any) => p.status === "ACTIVE").length,
            totalEngineers: engineers.length,
            activeEngineers: engineers.filter((e: any) => e.isActive).length,
          }));
        } catch (e) {
          toast.error("Failed to load dashboard data");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
                SiteProof AI
              </span>
              <span className="ml-2 text-xs uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                Department Admin
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user?.name}</div>
              <div className="text-xs text-slate-400">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Suspicious Alert Banner if any */}
        {stats.suspiciousCount > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-amber-300">
                  {stats.suspiciousCount} Evidence Submission(s) Require Review
                </div>
                <div className="text-xs text-amber-400/80">
                  Potential duplicates, location mismatches, or low GPS accuracy detected by AI pipeline.
                </div>
              </div>
            </div>
            <Link
              href="/admin/suspicious"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm rounded-lg transition shadow flex items-center space-x-1"
            >
              <span>Review Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Projects</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">{stats.totalProjects}</div>
            <div className="text-xs text-indigo-400 font-medium mt-1">
              {stats.activeProjects} Active construction sites
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Field Engineers</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">{stats.totalEngineers}</div>
            <div className="text-xs text-cyan-400 font-medium mt-1">
              {stats.activeEngineers} Activated on field
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Submissions</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">{stats.totalEvidence}</div>
            <div className="text-xs text-emerald-400 font-medium mt-1">
              Verified by GPS & AI Router
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Suspicious Events</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3">{stats.suspiciousCount}</div>
            <div className="text-xs text-amber-400 font-medium mt-1">
              Requires supervisor action
            </div>
          </div>
        </div>

        {/* Quick Hub Navigation Cards */}
        <h3 className="text-lg font-bold text-slate-200 mb-4">Operations & Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <Link
            href="/admin/projects"
            className="p-5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition group shadow-sm hover:shadow-indigo-500/10"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition">
              Manage Projects
            </div>
            <div className="text-xs text-slate-400 mt-1">Building & Road geofences, policies</div>
          </Link>

          <Link
            href="/admin/engineers"
            className="p-5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-cyan-500/50 transition group shadow-sm hover:shadow-cyan-500/10"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition">
              Manage Engineers
            </div>
            <div className="text-xs text-slate-400 mt-1">Add engineers & copy invite links</div>
          </Link>

          <Link
            href="/admin/evidence"
            className="p-5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition group shadow-sm hover:shadow-emerald-500/10"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Camera className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-100 group-hover:text-emerald-300 transition">
              Evidence Feed
            </div>
            <div className="text-xs text-slate-400 mt-1">Review live photo submissions</div>
          </Link>

          <Link
            href="/admin/suspicious"
            className="p-5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition group shadow-sm hover:shadow-amber-500/10"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-100 group-hover:text-amber-300 transition">
              Suspicious Hub
            </div>
            <div className="text-xs text-slate-400 mt-1">Request recaptures & resolve flags</div>
          </Link>

          <Link
            href="/admin/reports"
            className="p-5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition group shadow-sm hover:shadow-purple-500/10"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-100 group-hover:text-purple-300 transition">
              Daily Reports
            </div>
            <div className="text-xs text-slate-400 mt-1">Automated daily site digests</div>
          </Link>
        </div>

        {/* Recent Submissions Feed */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Recent Evidence Submissions</h3>
              <p className="text-xs text-slate-400">Live AI analysis and verification stream</p>
            </div>
            <Link
              href="/admin/evidence"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentEvidence && stats.recentEvidence.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex space-x-3"
                >
                  <div className="w-20 h-20 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ev.imageUrl.startsWith("http") ? ev.imageUrl : `http://localhost:8000${ev.imageUrl}`}
                      alt="Site Evidence"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&auto=format&fit=crop&q=60";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200 truncate">{ev.projectName}</div>
                    <div className="text-xs text-slate-400 truncate">By {ev.engineerName}</div>
                    <div className="mt-1">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ev.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-slate-400 font-medium">Trust Score</span>
                      <span
                        className={`font-bold ${
                          ev.trustScore >= 80
                            ? "text-emerald-400"
                            : ev.trustScore >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {ev.trustScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No evidence submitted yet today.</p>
              <p className="text-xs text-slate-600 mt-1">Field engineer submissions will appear here live.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
