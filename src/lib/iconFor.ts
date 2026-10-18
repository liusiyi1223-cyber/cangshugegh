import {
  BookOpen,
  Clapperboard,
  Coffee,
  Cpu,
  Folder,
  Inbox,
  MapPin,
  Utensils,
  type LucideIcon,
} from "lucide-react";

export function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("学习")) return BookOpen;
  if (n.includes("生活")) return Coffee;
  if (n.includes("影视")) return Clapperboard;
  if (n.includes("旅行")) return MapPin;
  if (n.includes("美食")) return Utensils;
  if (n.includes("科技")) return Cpu;
  if (n.includes("未分类")) return Inbox;
  return Folder;
}
