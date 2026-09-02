"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Copy,
  Check,
  Power,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase
} from "lucide-react";

interface Engineer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  designation?: string;
  isActive: boolean;
  emailVerified: boolean;
  assignedProjectCount: number;
}

export default function EngineersPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lastCreatedTokenUrl, setLastCreatedTokenUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    designation: "",
  });

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "DEPARTMENT_ADMIN") {
      router.push("/login");
      return;
    }

    fetchEngineers();
  }, [isAuthenticated, user, router]);

  const fetchEngineers = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get("/api/v1/engineers");
      setEngineers(response.data || []);
    } catch (error: any) {
      toast.error("Failed to load engineers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const apiClient = getApiClient();
      const res = await apiClient.post("/api/v1/engineers", formData);
      toast.success("Engineer account created!");
      
      if (res.data.activationUrl) {
        setLastCreatedTokenUrl(res.data.activationUrl);
      }

      setFormData({ name: "", email: "", phone: "", employeeId: "", designation: "" });
      setShowForm(false);
      fetchEngineers();
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.error || "Failed to create engineer";
      toast.error(message);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const apiClient = getApiClient();
      await apiClient.put(`/api/v1/engineers/${id}/toggle-status`);
      toast.success("Status updated");
      fetchEngineers();
    } catch (e) {
      toast.error("Failed to toggle status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Activation link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
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
            <h1 className="text-xl font-bold text-white">Field Engineer Management</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showForm ? "Cancel" : "Add New Engineer"}</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Token Invitation Banner if just created */}
        {lastCreatedTokenUrl && (
          <div className="mb-8 p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-cyan-300 text-sm">
                Engineer Invitation & Activation Link Generated
              </div>
              <div className="text-xs font-mono text-slate-300 mt-1 break-all bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                {lastCreatedTokenUrl}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(lastCreatedTokenUrl)}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        )}

        {/* Create Engineer Form */}
        {showForm && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-8 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Create Field Engineer Account</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Official Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@department.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="e.g. ENG-4089"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Junior Site Engineer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  Save & Generate Invitation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Engineer Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 bg-slate-950/50">
                  <th className="px-6 py-4">Engineer Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Assigned Projects</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {engineers.map((eng) => (
                  <tr key={eng.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold text-slate-100">
                      <div>{eng.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{eng.designation || "Engineer"}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{eng.email}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{eng.employeeId || "-"}</td>
                    <td className="px-6 py-4 text-cyan-400 font-bold">{eng.assignedProjectCount || 0} Sites</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          eng.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {eng.isActive ? "ACTIVE" : "PENDING ACTIVATION"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(eng.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          eng.isActive
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                        }`}
                        title={eng.isActive ? "Deactivate Engineer" : "Activate Engineer"}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {engineers.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs">
              No engineers registered yet. Click &quot;Add New Engineer&quot; to begin onboarding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
