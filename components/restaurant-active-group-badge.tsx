"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { allGroupDefinitions, groupThemeBySlug, type GroupSlug } from "@/lib/tour-data";
import { readActiveGroup } from "@/components/save-group-to-storage";

type RestaurantActiveGroupBadgeProps = {
  fallbackGroupSlug: GroupSlug;
};

function isGroupSlug(value: string): value is GroupSlug {
  return allGroupDefinitions.some((group) => group.slug === value);
}

export default function RestaurantActiveGroupBadge({
  fallbackGroupSlug,
}: RestaurantActiveGroupBadgeProps) {
  const [activeGroupSlug, setActiveGroupSlug] = useState<GroupSlug>(
    fallbackGroupSlug,
  );

  useEffect(() => {
    const storedGroup = readActiveGroup();
    if (isGroupSlug(storedGroup)) {
      setActiveGroupSlug(storedGroup);
    }
  }, []);

  const activeGroup =
    allGroupDefinitions.find((group) => group.slug === activeGroupSlug) ??
    allGroupDefinitions[0];
  const groupTheme = groupThemeBySlug[activeGroup.slug];

  return (
    <Link
      href={`/grupper/${activeGroup.slug}`}
      className={`inline-flex items-center rounded-full px-4 py-2 text-base font-semibold transition hover:opacity-90 ${groupTheme.headerBadgeClassName}`}
    >
      <span aria-hidden="true" className="mr-2 text-base">
        ←
      </span>
      Grupp {activeGroup.name}
    </Link>
  );
}
