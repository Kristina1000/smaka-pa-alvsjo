"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getGroupRouteBySlug,
  type GroupSlug,
} from "@/lib/tour-data";
import { hasSubmittedForRestaurant } from "@/lib/vote-storage";

type GroupStatisticsLinkProps = {
  groupSlug: GroupSlug;
};

function hasCompletedAllVotes(groupSlug: GroupSlug): boolean {
  const groupRoute = getGroupRouteBySlug(groupSlug);
  if (!groupRoute) {
    return false;
  }

  return groupRoute.restaurants.every((restaurant) =>
    hasSubmittedForRestaurant(restaurant.slug),
  );
}

export default function GroupStatisticsLink({
  groupSlug,
}: GroupStatisticsLinkProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsUnlocked(hasCompletedAllVotes(groupSlug));
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [groupSlug]);

  if (!isUnlocked) {
    return null;
  }

  return (
    <Link
      href="/statistik"
      className="inline-flex w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      Visa statistik
    </Link>
  );
}
