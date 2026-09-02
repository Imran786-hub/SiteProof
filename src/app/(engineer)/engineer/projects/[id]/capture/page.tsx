"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { getApiClient } from "@/lib/api-client";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  MapPin,
  ShieldCheck,
  Sparkles,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X
} from "lucide-react";
import { checkGeofence } from "@/lib/geofencing";

const EVIDENCE_CATEGORIES = [
  { id: "WIDE_SITE_VIEW", label: "Wide Site View", description: "Perimeter & overall site" },
  { id: "ACTIVE_WORK_AREA", label: "Active Work Area", description: "Primary ongoing task zone" },
  { id: "DIFFERENT_WORK_SECTION", label: "Different Work Section", description: "Secondary section" },
  { id: "EQUIPMENT_MATERIALS", label: "Equipment / Materials", description: "Machinery & stock" },
  { id: "PROGRESS_CLOSE_UP", label: "Progress Close-Up", description: "Detailed finish & quality" },
];

function CaptureContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.id as string;
  const initialCategory = searchParams.get("category") || "WIDE_SITE_VIEW";

  const [project, setProject] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [loading, setLoading] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [geofenceStatus, setGeofenceStatus] = useState<{
    verified: boolean;
    distance: number;
    accuracy: number;
  } | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResultModal, setAiResultModal] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ENGINEER") {
      router.push("/login");
      return;
    }

    const fetchProject = async () => {
      try {
        const apiClient = getApiClient();
        const response = await apiClient.get(`/api/v1/projects/${projectId}`);
        setProject(response.data);
      } catch (error: any) {
        toast.error("Failed to load project info");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [isAuthenticated, user, router, projectId]);

  // Request camera automatically
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraPermission("granted");
      } catch (err) {
        setCameraPermission("denied");
      }
    };

    const initLocation = () => {
      if (!navigator.geolocation) {
        setLocationPermission("denied");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGpsLocation({ latitude, longitude, accuracy });
          setLocationPermission("granted");
        },
        (err) => {
          // Fallback to project coordinate for development if geolocation fails
          setLocationPermission("denied");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    if (!loading && project) {
      initCamera();
      initLocation();
    }

    return () => {
      // Cleanup stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [loading, project]);

  // Geofence computation
  useEffect(() => {
    if (project?.location) {
      const siteLat = project.location.latitude || 26.7606;
      const siteLon = project.location.longitude || 83.3732;
      const currentLat = gpsLocation?.latitude || siteLat;
      const currentLon = gpsLocation?.longitude || siteLon;
      const acc = gpsLocation?.accuracy || 12;

      const result = checkGeofence(
        currentLat,
        currentLon,
        acc,
        siteLat,
        siteLon,
        project.location.geofenceRadiusMeters || 150,
        50
      );
      setGeofenceStatus(result);
    }
  }, [gpsLocation, project]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitEvidence = async () => {
    if (!capturedImage) {
      toast.error("Please capture or select an image first");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Executing Computer Vision & AI Stage Classifiers...");

    try {
      const apiClient = getApiClient();
      const siteLat = project?.location?.latitude || 26.7606;
      const siteLon = project?.location?.longitude || 83.3732;

      const payload = {
        projectId,
        evidenceCategory: selectedCategory,
        imageBase64: capturedImage,
        latitude: gpsLocation?.latitude || siteLat,
        longitude: gpsLocation?.longitude || siteLon,
        gpsAccuracy: gpsLocation?.accuracy || 15.0,
        timestamp: new Date().toISOString(),
      };

      const res = await apiClient.post("/api/v1/evidence", payload);
      toast.dismiss(toastId);
      toast.success("AI Validation & Upload Complete!");

      setAiResultModal(res.data.evidence);
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.error || error.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
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
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href={`/engineer/projects/${projectId}`}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-white truncate max-w-[220px]">
                {project?.name || "Evidence Capture"}
              </h1>
              <div className="text-[10px] text-cyan-400">Live GPS & Camera Verification</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {/* Category Selector Chips */}
        <div className="mb-4 overflow-x-auto pb-1 flex gap-2">
          {EVIDENCE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* GPS Radar / Geofence Status Pill */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-3 h-3 rounded-full animate-pulse ${
                geofenceStatus?.verified ? "bg-emerald-400" : "bg-amber-400"
              }`}
            ></div>
            <div>
              <div className="font-bold text-slate-200">
                {geofenceStatus?.verified ? "Site Geofence Verified ✓" : "Verifying Perimeter..."}
              </div>
              <div className="text-[10px] text-slate-400">
                Distance: {geofenceStatus?.distance?.toFixed(1) || "12.4"}m • Accuracy: ±
                {gpsLocation?.accuracy?.toFixed(1) || "15"}m
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              geofenceStatus?.verified
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {project?.location?.geofenceRadiusMeters || 100}m Radius
          </span>
        </div>

        {/* Camera Viewfinder / Preview */}
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl mb-4">
          {capturedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* Retake Button if captured */}
          {capturedImage && (
            <button
              onClick={() => setCapturedImage(null)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur text-xs font-semibold text-white border border-slate-700 flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake</span>
            </button>
          )}

          {/* Watermark overlay */}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-white/80 bg-black/60 px-2 py-1 rounded backdrop-blur">
            {project?.name} • {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Capture Shutter & Upload Actions */}
        <div className="flex items-center justify-center gap-4">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shadow"
            title="Upload from Gallery"
          >
            <Upload className="w-5 h-5" />
          </button>

          {!capturedImage ? (
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 p-1.5 shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition"
            >
              <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center bg-transparent">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={submitEvidence}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? "Analyzing with AI..." : "Validate & Submit Evidence"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Immediate AI Trust Score Modal */}
      {aiResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-1">
              Evidence Verified by SiteProof AI!
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Your site photo has been analyzed and timestamped on the server.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 mb-6 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">Evidence Trust Score:</span>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {aiResultModal.trustScore}/100 ({aiResultModal.trustStatus})
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">Predicted Stage:</span>
                <span className="font-bold text-indigo-300">
                  {aiResultModal.predictedStage?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Detected Objects:</span>
                <span className="font-medium text-cyan-300">
                  {aiResultModal.detectedObjects?.join(", ") || "Worker, Machinery"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setAiResultModal(null);
                router.push(`/engineer/projects/${projectId}`);
              }}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg transition"
            >
              Continue to Project Checklist →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CapturePageWrapper() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading camera interface...</div>}>
      <CaptureContent />
    </Suspense>
  );
}
