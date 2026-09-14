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

    const body = await request.json();
    const otherUserId = body?.otherUserId;

    if (!otherUserId) {
      return NextResponse.json(
        { error: "Other user is required" },
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

    if (user.id === otherUserId) {
      return NextResponse.json(
        { error: "You cannot start a chat with yourself" },
        { status: 400 }
      );
    }

    const { data: otherUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", otherUserId)
      .single();

    if (!otherUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { data: myMemberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    const myConversationIds =
      (myMemberships || []).map(
        (item) => item.conversation_id
      );

    if (myConversationIds.length > 0) {
      const { data: existing } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .in("conversation_id", myConversationIds)
        .eq("user_id", otherUserId);

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          conversationId: existing[0].conversation_id,
          existing: true,
        });
      }
    }

    const { data: conversation, error: conversationError } =
      await supabase
        .from("conversations")
        .insert({})
        .select("id")
        .single();

    if (conversationError) {
      return NextResponse.json(
        { error: conversationError.message },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert([
        {
          conversation_id: conversation.id,
          user_id: user.id,
        },
        {
          conversation_id: conversation.id,
          user_id: otherUserId,
        },
      ]);

    if (memberError) {
      await supabase
        .from("conversations")
        .delete()
        .eq("id", conversation.id);

      return NextResponse.json(
        { error: memberError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      existing: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
