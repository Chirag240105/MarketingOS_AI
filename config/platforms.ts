import { AtSign, BriefcaseBusiness, Camera, Clapperboard, FileText, Music2, Send } from "lucide-react";
import type { ComponentType } from "react";
import type { SocialPlatform } from "@/lib/generated/prisma/client";

export type PlatformConfig = {
  id: SocialPlatform;
  label: string;
  icon: ComponentType<{ className?: string }>;
  publishingSupported: boolean;
  analyticsSupported: boolean;
  selectable: boolean;
};

export const PLATFORMS: Record<SocialPlatform, PlatformConfig> = {
  INSTAGRAM: {
    id: "INSTAGRAM",
    label: "Instagram",
    icon: Camera,
    publishingSupported: true,
    analyticsSupported: true,
    selectable: true,
  },
  FACEBOOK: {
    id: "FACEBOOK",
    label: "Facebook",
    icon: FileText,
    publishingSupported: true,
    analyticsSupported: true,
    selectable: true,
  },
  X: {
    id: "X",
    label: "X",
    icon: AtSign,
    publishingSupported: true,
    analyticsSupported: true,
    selectable: true,
  },
  LINKEDIN: {
    id: "LINKEDIN",
    label: "LinkedIn",
    icon: BriefcaseBusiness,
    publishingSupported: true,
    analyticsSupported: true,
    selectable: true,
  },
  TIKTOK: {
    id: "TIKTOK",
    label: "TikTok",
    icon: Music2,
    publishingSupported: false,
    analyticsSupported: false,
    selectable: false,
  },
  YOUTUBE: {
    id: "YOUTUBE",
    label: "YouTube",
    icon: Clapperboard,
    publishingSupported: false,
    analyticsSupported: false,
    selectable: false,
  },
  PINTEREST: {
    id: "PINTEREST",
    label: "Pinterest",
    icon: Send,
    publishingSupported: false,
    analyticsSupported: false,
    selectable: false,
  },
};

export const PLATFORM_LIST = Object.values(PLATFORMS);
export const SELECTABLE_PLATFORMS = PLATFORM_LIST.filter((platform) => platform.selectable);
export const PUBLISHING_PLATFORMS = PLATFORM_LIST.filter((platform) => platform.publishingSupported);
export const ANALYTICS_PLATFORMS = PLATFORM_LIST.filter((platform) => platform.analyticsSupported);

export function platformLabel(platform: SocialPlatform | string) {
  return PLATFORMS[platform as SocialPlatform]?.label || platform;
}
