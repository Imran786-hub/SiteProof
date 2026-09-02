import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  siteEvidence,
  projectEngineers,
  projectLocations,
  auditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest, checkAuthorization } from "@/lib/auth-middleware";
import { calculateDistance } from "@/lib/geofencing";
import crypto from "crypto";

// Submit evidence
export async function POST(request: NextRequest) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  const authError2 = checkAuthorization(auth!, "ENGINEER");
  if (authError2) return authError2;

  try {
    const {
      projectId,
      evidenceCategory,
      imageBase64,
      latitude,
      longitude,
      gpsAccuracy,
      timestamp,
    } = await request.json();

    if (!projectId || !evidenceCategory || !imageBase64) {
      return NextResponse.json(
        { error: "Project ID, category, and image are required" },
        { status: 400 }
      );
    }

    // Verify engineer is assigned to project
    const assignment = await db
      .select()
      .from(projectEngineers)
      .where(
        and(
          eq(projectEngineers.projectId, projectId),
          eq(projectEngineers.engineerId, auth!.userId)
        )
      )
      .limit(1);

    if (!assignment.length) {
      return NextResponse.json(
        { error: "You are not assigned to this project" },
        { status: 403 }
      );
    }

    // Get project location for geofence check
    const location = await db
      .select()
      .from(projectLocations)
      .where(eq(projectLocations.projectId, projectId))
      .limit(1);

    if (!location.length) {
      return NextResponse.json(
        { error: "Project location not configured" },
        { status: 400 }
      );
    }

    // Calculate distance and verify geofence
    let distance = null;
    let locationVerified = false;

    if (latitude && longitude) {
      const siteLat = parseFloat(location[0].latitude);
      const siteLon = parseFloat(location[0].longitude);
      distance = calculateDistance(
        latitude,
        longitude,
        siteLat,
        siteLon
      );
      locationVerified = distance <= location[0].geofenceRadiusMeters;
    }

    // Calculate SHA-256 hash of image
    const imageHash = crypto.createHash("sha256").update(imageBase64).digest("hex");

    // Store evidence
    const newEvidence = await db
      .insert(siteEvidence)
      .values({
        organizationId: auth!.organizationId,
        projectId,
        engineerId: auth!.userId,
        evidenceCategory: evidenceCategory as any,
        imagePath: `evidence/${auth!.organizationId}/${projectId}/${auth!.userId}/${Date.now()}.jpg`,
        imageHash,
        captureTimestamp: timestamp ? new Date(timestamp) : new Date(),
        submissionTimestamp: new Date(),
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        gpsAccuracy: gpsAccuracy?.toString(),
        distanceFromSite: distance?.toString(),
        locationVerified,
        verificationStatus: "PENDING",
      })
      .returning();

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "EVIDENCE_SUBMITTED",
      resourceType: "EVIDENCE",
      resourceId: newEvidence[0].id,
      metadata: {
        projectId,
        category: evidenceCategory,
      },
    });

    return NextResponse.json(
      {
        message: "Evidence submitted successfully",
        evidence: {
          id: newEvidence[0].id,
          status: "PENDING",
          locationVerified,
          distance: distance?.toFixed(2),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Evidence submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get evidence for a project (admin only)
export async function GET(request: NextRequest) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    let query = db.select().from(siteEvidence);

    if (projectId) {
      const evidenceList = await db
        .select()
        .from(siteEvidence)
        .where(
          and(
            eq(siteEvidence.organizationId, auth!.organizationId),
            eq(siteEvidence.projectId, projectId)
          )
        );

      return NextResponse.json({ evidence: evidenceList });
    }

    const evidence = await db
      .select()
      .from(siteEvidence)
      .where(eq(siteEvidence.organizationId, auth!.organizationId));

    return NextResponse.json({ evidence });
  } catch (error) {
    console.error("Get evidence error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
