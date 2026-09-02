"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Flag,
  ShieldAlert,
  Layers,
  X,
  MessageSquare
} from "lucide-react";

export default function SuspiciousHubPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [recaptureReason, setRecaptureReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "DEPARTMENT_ADMIN") {
      router.push("/login");
      return;
    }

    const fetchEvents = async () => {
      try {
        const apiClient = getApiClient();
        const res = await apiClient.get("/api/v1/suspicious");
        setEvents(res.data.suspiciousEvents || []);
      } catch (e) {
        toast.error("Failed to load suspicious events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isAuthenticated, user, router]);

  const handleAction = async (action: "APPROVED" | "FLAGGED" | "RECAPTURE_REQUESTED") => {
    if (!selectedEvent) return;
    if (action === "RECAPTURE_REQUESTED" && !recaptureReason.trim()) {
      toast.error("Please enter a reason for recapture request");
      return;
    }

    setActionLoading(true);
    try {
      const apiClient = getApiClient();
      await apiClient.post(`/api/v1/suspicious/${selectedEvent.id}/action`, {
        action,
        recaptureReason: action === "RECAPTURE_REQUESTED" ? recaptureReason : undefined
      });

      toast.success(`Event marked as ${action.replace(/_/g, " ")}`);
      
      // Update local state
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEvent.id ? { ...ev, status: action, recaptureReason } : ev
        )
      );
      setSelectedEvent(null);
      setRecaptureReason("");
    } catch (e) {
      toast.error("Failed to resolve event");
    } finally {
      setActionLoading(false);
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
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl font-bold text-white">Suspicious Evidence Hub</h1>
            </div>
          </div>
          <div className="text-xs text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            {events.filter((e) => e.status === "NEEDS_REVIEW").length} Active Anomaly Alerts
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-100">AI Anomaly & Fraud Prevention Queue</h2>
          <p className="text-xs text-slate-400 mt-1">
            SiteProof AI automatically evaluates GPS distance, perceptual hash duplicates, and image quality. Review flagged items below.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const imgUrl = ev.imageUrl?.startsWith("http")
                ? ev.imageUrl
                : `http://localhost:8000${ev.imageUrl}`;

              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    {/* Top Row: Risk and Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Risk Score: {ev.riskScore}/100
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          ev.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : ev.status === "RECAPTURE_REQUESTED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : ev.status === "FLAGGED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {ev.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Image Preview if available */}
                    {ev.imageUrl && (
                      <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgUrl}
                          alt="Suspicious Evidence"
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=400&auto=format&fit=crop&q=60";
                          }}
                        />
                      </div>
                    )}

                    <h4 className="font-bold text-slate-100 text-sm truncate">{ev.projectName}</h4>
                    <p className="text-xs text-slate-400 mb-2">Submitted by {ev.engineerName}</p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 text-xs">
                      <div className="font-semibold text-amber-300 flex items-center space-x-1 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{ev.issueType.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{ev.description}</p>
                    </div>

                    {ev.recaptureReason && (
                      <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 mb-3">
                        <span className="font-bold">Recapture Note:</span> {ev.recaptureReason}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEvent(ev);
                      setRecaptureReason(ev.recaptureReason || "");
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow"
                  >
                    Take Supervisor Action
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
            <p className="text-lg font-medium text-slate-300">All Evidence In Order</p>
            <p className="text-xs text-slate-500 mt-1">
              No anomalies, duplicates, or geofence breaches currently detected.
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Resolve Anomaly: {selectedEvent.projectName}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Issue: {selectedEvent.issueType.replace(/_/g, " ")}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recapture Instructions (Required for Recapture Request):</span>
                </label>
                <textarea
                  rows={3}
                  value={recaptureReason}
                  onChange={(e) => setRecaptureReason(e.target.value)}
                  placeholder="Explain clearly to the engineer why a recapture is needed (e.g., photo is blurry, take another shot facing east)."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("APPROVED")}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition flex flex-col items-center justify-center space-y-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("RECAPTURE_REQUESTED")}
                  className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition flex flex-col items-center justify-center space-y-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Request Recapture</span>
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleAction("FLAGGED")}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition flex flex-col items-center justify-center space-y-1"
                >
                  <Flag className="w-4 h-4" />
                  <span>Flag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
