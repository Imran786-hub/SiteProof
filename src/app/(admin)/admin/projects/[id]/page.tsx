"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  Users,
  UserPlus,
  Layers,
  Calendar,
  Camera
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<any | null>(null);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [assigning, setAssigning] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "DEPARTMENT_ADMIN") {
      router.push("/login");
      return;
    }

    fetchProjectAndEngineers();
  }, [isAuthenticated, user, router, projectId]);

  const fetchProjectAndEngineers = async () => {
    try {
      const apiClient = getApiClient();
      const [projectRes, engineersRes] = await Promise.all([
        apiClient.get(`/api/v1/projects/${projectId}`),
        apiClient.get("/api/v1/engineers"),
      ]);

      const projData = projectRes.data;
      setProject(projData);

      const allEng = engineersRes.data || [];
      const assignedIds = new Set((projData.assignedEngineers || []).map((e: any) => e.id));
      setEngineers(allEng.filter((e: any) => !assignedIds.has(e.id)));
    } catch (error: any) {
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEngineer = async () => {
    if (!selectedEngineer) {
      toast.error("Please select an engineer from the list");
      return;
    }

    setAssigning(true);
    try {
      const apiClient = getApiClient();
      await apiClient.post(`/api/v1/projects/${projectId}/assign-engineer`, {
        engineerId: selectedEngineer,
      });

      toast.success("Engineer successfully assigned to project!");
      setSelectedEngineer("");
      fetchProjectAndEngineers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.response?.data?.error || "Failed to assign engineer");
    } finally {
      setAssigning(false);
    }
  };

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
        <Link href="/admin/projects" className="text-indigo-400 mt-4 inline-block">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/projects"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
          </div>
          <Link
            href={`/admin/evidence?projectId=${projectId}`}
            className="px-3.5 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>View Project Evidence Feed</span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Project Info Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {project.projectType} CONSTRUCTION
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {project.status}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-white">{project.name}</h2>
          <p className="text-xs text-slate-400 mt-1">{project.description || "Active construction project."}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>GPS Location Coordinates</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-100 mt-1">
                {project.location?.latitude?.toFixed(5) || "26.7606"}, {project.location?.longitude?.toFixed(5) || "83.3732"}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{project.location?.address || "Site Address"}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Geofence Radius</span>
              </div>
              <div className="text-sm font-bold text-cyan-400 mt-1">
                {project.location?.geofenceRadiusMeters || 100} Meters
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Haversine Perimeter Enforced</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
              <div className="text-xs text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Daily Evidence Quota</span>
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1">
                Min: {project.policy?.minimumImages || 5} Photos / Day
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Max: {project.policy?.maximumImages || 20} Photos</div>
            </div>
          </div>
        </div>

        {/* Assigned Engineers Section */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Assigned Field Engineers ({(project.assignedEngineers || []).length})</span>
          </h3>

          {/* Assign Dropdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-6 flex flex-col sm:flex-row gap-3 items-center">
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select an engineer from your organization to assign...</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name} ({eng.email}) {eng.employeeId ? `[${eng.employeeId}]` : ""}
                </option>
              ))}
            </select>
            <button
              disabled={assigning}
              onClick={handleAssignEngineer}
              className="px-6 py-3 w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5 flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{assigning ? "Assigning..." : "Assign Engineer"}</span>
            </button>
          </div>

          {/* Assigned Engineers List */}
          {project.assignedEngineers && project.assignedEngineers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.assignedEngineers.map((eng: any) => (
                <div
                  key={eng.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-100">{eng.name}</div>
                    <div className="text-[10px] text-slate-400">{eng.email}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              No engineers assigned yet to this site. Select an engineer above to assign.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
