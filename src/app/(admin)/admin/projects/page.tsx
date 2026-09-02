"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  MapPin,
  ShieldCheck,
  Plus,
  Users,
  ArrowRight,
  Layers
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  projectType: string;
  status: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  geofenceRadiusMeters?: number;
  assignedEngineersCount?: number;
  minimumImages?: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectType: "BUILDING",
    status: "ACTIVE",
    latitude: "26.7606",
    longitude: "83.3732",
    address: "Gorakhpur Site Location",
    geofenceRadiusMeters: 150,
    minimumImages: 5,
    maximumImages: 20,
  });

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "DEPARTMENT_ADMIN") {
      router.push("/login");
      return;
    }

    fetchProjects();
  }, [isAuthenticated, user, router]);

  const fetchProjects = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get("/api/v1/projects");
      setProjects(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast.error("Name and location are required");
      return;
    }

    try {
      const apiClient = getApiClient();
      await apiClient.post("/api/v1/projects", {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });
      toast.success("Construction Project created successfully!");
      setFormData({
        name: "",
        description: "",
        projectType: "BUILDING",
        status: "ACTIVE",
        latitude: "26.7606",
        longitude: "83.3732",
        address: "Gorakhpur Site Location",
        geofenceRadiusMeters: 150,
        minimumImages: 5,
        maximumImages: 20,
      });
      setShowForm(false);
      fetchProjects();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.error || "Failed to create project";
      toast.error(message);
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
            <h1 className="text-xl font-bold text-white">Project & Geofence Configuration</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? "Cancel" : "Create New Project"}</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Create Project Form */}
        {showForm && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Create Construction Project</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Project Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Gorakhpur City Hospital Block A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Construction Type *</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BUILDING">🏢 Building Construction</option>
                    <option value="ROAD">🛣️ Road Construction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Site Address / Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Lines, Gorakhpur"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Latitude (GPS) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="26.7606"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Longitude (GPS) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="83.3732"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Geofence Radius (Meters) *</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={formData.geofenceRadiusMeters}
                    onChange={(e) =>
                      setFormData({ ...formData, geofenceRadiusMeters: parseInt(e.target.value) || 100 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Description</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding scope of construction, contracts, or phases..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow"
                >
                  Save Project & Set Geofence
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {project.projectType} CONSTRUCTION
                  </span>
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

                <h3 className="text-base font-bold text-white">{project.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {project.description || "Active construction project."}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Geofence:</span>
                    </span>
                    <span className="font-mono text-slate-200">
                      {project.geofenceRadiusMeters || 100}m Radius
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Assigned Engineers:</span>
                    </span>
                    <span className="font-bold text-slate-200">
                      {project.assignedEngineersCount || 0} Staff
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center space-x-1"
                >
                  <span>Configure & Assign Staff</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="py-20 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No projects created yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Click &quot;Create New Project&quot; above to configure your first construction site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
