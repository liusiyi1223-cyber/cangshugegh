"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bookmark, Tag } from "lucide-react";

const tabs = [
  { href: "/favorites", label: "收藏", icon: Bookmark },
  { href: "/tags", label: "标签", icon: Tag },
  { href: "/stats", label: "统计", icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sand bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-[1000px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              replace
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
