"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  joinedAt: number;
}

export function usePresence(
  channelName: string,
  currentUser?: { id: string; name: string }
) {
  const [others, setOthers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const colors = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899"];
    const myColor = colors[Math.abs(currentUser.id.charCodeAt(0)) % colors.length];

    const channel = supabase.channel(channelName, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state)
          .flat()
          .filter((u) => u.userId !== currentUser.id);
        setOthers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: currentUser.id,
            name: currentUser.name,
            color: myColor,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return others;
}
