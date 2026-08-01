"use client";

import { useEffect } from "react";
import { requestNotificationPermission } from "@/lib/firebase-messaging";
import { createClient } from "@/lib/supabase/client";

export function usePushNotifications() {
  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const token = await requestNotificationPermission();

        if (!token) return;

        const { error } = await supabase
          .from("user_push_tokens")
          .upsert(
            {
              user_id: user.id,
              token,
              platform: "web",
            },
            {
              onConflict: "token",
            }
          );

        if (error) {
          console.error(error);
          return;
        }

        console.log("✅ Push token saved successfully");
      } catch (error) {
        console.error(error);
      }
    }

    init();
  }, []);
}