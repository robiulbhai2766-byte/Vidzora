import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      );
    }

    const { data: video, error: videoError } =
      await supabaseAdmin
        .from("videos")
        .select("id, views, moderation_status")
        .eq("id", videoId)
        .eq("moderation_status", "approved")
        .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const currentViews = Number(video.views || 0);
    const newViews = currentViews + 1;

    const { error: updateError } =
      await supabaseAdmin
        .from("videos")
        .update({
          views: newViews,
        })
        .eq("id", videoId);

    if (updateError) {
      console.error(updateError);

      return NextResponse.json(
        { error: "Could not update views" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      views: newViews,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
