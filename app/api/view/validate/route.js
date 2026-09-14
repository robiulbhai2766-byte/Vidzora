import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      videoId,
      sessionId,
      watchSeconds,
      completed = false,
    } = body;

    if (!videoId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    const seconds = Number(watchSeconds);

    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400) {
      return NextResponse.json(
        { error: "Invalid watch time" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser(
      request.headers.get("Authorization")
        ? {
            access_token: request.headers
              .get("Authorization")
              .replace("Bearer ", ""),
          }
        : undefined
    );

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("id,status")
      .eq("id", videoId)
      .single();

    if (videoError || !video || video.status !== "approved") {
      return NextResponse.json(
        { error: "Video is not available" },
        { status: 404 }
      );
    }

    const minimumWatchSeconds = 10;

    const isValid =
      seconds >= minimumWatchSeconds;

    const validationStatus = isValid
      ? "valid"
      : "rejected";

    const fraudScore = isValid ? 0 : 50;

    const { error: insertError } = await supabase
      .from("video_views")
      .insert({
        video_id: videoId,
        user_id: user.id,
        session_id: sessionId,
        watch_seconds: Math.floor(seconds),
        completed: Boolean(completed),
        is_valid: isValid,
        fraud_score: fraudScore,
        validation_status: validationStatus,
        validated_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: isValid,
      validation_status: validationStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
