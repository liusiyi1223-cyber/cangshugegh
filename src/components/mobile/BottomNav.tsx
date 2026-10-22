"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LayoutDashboard, Plus } from "lucide-react";
import AddFavoriteSheet from "./AddFavoriteSheet";

const leftTabs = [{ href: "/favorites", icon: Bookmark }];

const rightTabs = [{ href: "/workbench", icon: LayoutDashboard }];

function TabItem({
  href,
  icon: Icon,
  active,
}: {
  href: string;
  icon: typeof Bookmark;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      replace
      className={`relative flex flex-1 flex-col items-center justify-center py-2 ${
        active ? "text-onbrand" : "text-onbrand opacity-70"
      }`}
    >
      {active && (
        <span className="absolute top-0 h-0.5 w-8 rounded-full bg-onbrand" />
      )}
      <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} />
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-sand bg-brand"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-full max-w-[1000px] items-end">
        {leftTabs.map((t) => (
          <TabItem
            key={t.href}
            {...t}
            active={pathname === t.href || pathname.startsWith(t.href + "/")}
          />
        ))}

        <div className="flex flex-1 items-center justify-center self-stretch">
          <button
            onClick={() => setAddOpen(true)}
            aria-label="添加收藏"
            className="grid h-11 w-11 place-items-center text-onbrand"
          >
            <Plus size={34} strokeWidth={2.2} />
          </button>
        </div>

        {rightTabs.map((t) => (
          <TabItem
            key={t.href}
            {...t}
            active={pathname === t.href || pathname.startsWith(t.href + "/")}
          />
        ))}
      </div>

      <a
        href="https://beian.miit.gov.cn/"
        target="_blank"
        rel="noreferrer"
        className="block pb-1 text-center text-[10px] leading-none text-onbrand opacity-60"
      >
        蜀ICP备2026063684号-1
      </a>

      <AddFavoriteSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          window.location.reload();
        }}
      />
    </nav>
  );
}
