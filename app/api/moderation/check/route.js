import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const token = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const { data: video, error: videoError } =
      await supabase
        .from("videos")
        .select(
          "id, user_id, title, description, status"
        )
        .eq("id", videoId)
        .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    if (video.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    await supabase
      .from("videos")
      .update({
        moderation_status: "processing",
        monetization_status: "pending",
      })
      .eq("id", videoId);

    /*
      IMPORTANT:
      This is the secure server-side foundation.

      Do NOT automatically declare content original
      merely because its title is different.

      A real production checker should combine:
      - copyright/similarity checks
      - metadata checks
      - duplicate detection
      - policy/safety checks
      - AI-content signals
      - risk scoring
    */

    const title = (video.title || "").trim();
    const description = (video.description || "").trim();

    let riskScore = 0;
    let similarityScore = 0;
    let reason = "Initial automated checks completed.";

    if (!title) {
      riskScore += 20;
      reason = "Missing video title.";
    }

    if (title.length < 5) {
      riskScore += 10;
    }

    if (description.length < 10) {
      riskScore += 5;
    }

    /*
      Conservative decision:
      We do NOT claim copyright originality here.
      Videos requiring deeper analysis go to manual_review.
    */

    let moderationStatus = "manual_review";
    let monetizationStatus = "manual_review";

    if (riskScore >= 40) {
      moderationStatus = "rejected";
      monetizationStatus = "not_eligible";
      reason = "Automated risk checks require rejection.";
    }

    const { error: updateError } = await supabase
      .from("videos")
      .update({
        moderation_status: moderationStatus,
        monetization_status: monetizationStatus,
        content_risk_score: riskScore,
        similarity_score: similarityScore,
        moderation_reason: reason,
        checked_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("ai_moderation_logs")
      .insert({
        video_id: videoId,
        model: "Vidzora-RuleEngine-v1",
        action: moderationStatus,
        risk_score: riskScore,
        similarity_score: similarityScore,
        result: {
          title_length: title.length,
          description_length: description.length,
          reason,
        },
      });

    return NextResponse.json({
      success: true,
      moderationStatus,
      monetizationStatus,
      riskScore,
      similarityScore,
      reason,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Moderation service error",
      },
      { status: 500 }
    );
  }
}
