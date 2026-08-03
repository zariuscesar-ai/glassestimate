import { NextRequest, NextResponse } from "next/server";
import { calculateShowerEstimate } from "@/lib/shower-pricing";
import type { ShowerEstimateInput } from "@/types/shower";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { styleId, width, height, glassThickness, glassType, hardwareFinish } =
      body as ShowerEstimateInput;

    if (!styleId || !width || !height || !glassThickness || !glassType || !hardwareFinish) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: styleId, width, height, glassThickness, glassType, hardwareFinish",
        },
        { status: 400 }
      );
    }

    if (typeof width !== "number" || width < 18 || width > 144) {
      return NextResponse.json(
        { success: false, error: "Width must be between 18 and 144 inches" },
        { status: 400 }
      );
    }

    if (typeof height !== "number" || height < 24 || height > 120) {
      return NextResponse.json(
        { success: false, error: "Height must be between 24 and 120 inches" },
        { status: 400 }
      );
    }

    const input: ShowerEstimateInput = {
      styleId,
      width,
      height,
      glassThickness,
      glassType,
      hardwareFinish,
      doorConfig: body.doorConfig || { enabled: false, width, height },
      extraCutouts: body.extraCutouts || [],
      hardwareIds: body.hardwareIds || [],
    };

    const estimate = calculateShowerEstimate(input);

    return NextResponse.json({ success: true, data: estimate });
  } catch (error) {
    console.error("Shower estimation error:", error);
    const message =
      error instanceof Error ? error.message : "Estimation failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
