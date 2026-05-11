"use client";

import { useEffect } from "react";

const ACTIVE_GROUP_KEY = "smaka-active-group";

export function readActiveGroup(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ACTIVE_GROUP_KEY) ?? "";
}

export default function SaveGroupToStorage({ group }: { group: string }) {
  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_GROUP_KEY, group);
    } catch {
      // localStorage not available in this browser
    }
  }, [group]);

  return null;
}
