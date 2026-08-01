import { NextResponse } from "next/server";
import { adminMessaging } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const response = await adminMessaging.send({
      token,
      notification: {
        title: "🎉 قولها",
        body: "أول Push Notification شغال بنجاح!",
      },
      data: {
        url: "/notifications",
      },
      webpush: {
        fcmOptions: {
          link: "/notifications",
        },
      },
    });

    return NextResponse.json({
      success: true,
      messageId: response,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}