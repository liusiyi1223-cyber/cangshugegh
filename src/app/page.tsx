import { Bookmark, Link } from "lucide-react";
import { platformColor } from "@/lib/platforms";
import {
  SiBilibili,
  SiInstagram,
  SiSinaweibo,
  SiTiktok,
  SiWechat,
  SiXiaohongshu,
  SiYoutube,
  SiZhihu,
} from "@icons-pack/react-simple-icons";

const platforms = [
  { key: "bilibili", name: "哔哩哔哩", Icon: SiBilibili },
  { key: "douyin", name: "抖音", Icon: SiTiktok },
  { key: "xiaohongshu", name: "小红书", Icon: SiXiaohongshu },
  { key: "zhihu", name: "知乎", Icon: SiZhihu },
  { key: "weibo", name: "微博", Icon: SiSinaweibo },
  { key: "wechat", name: "微信", Icon: SiWechat },
  { key: "instagram", name: "Instagram", Icon: SiInstagram },
  { key: "youtube", name: "YouTube", Icon: SiYoutube },
];

export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-6">
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center rounded-3xl border border-[#a8a29e] text-[#57534e]">
            <Link size={40} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-xl border border-[#a8a29e] bg-white text-[#57534e]">
            <Bookmark size={16} strokeWidth={2} />
          </div>
        </div>

        <h1 className="mt-7 text-3xl font-bold tracking-tight text-[#57534e]">
          口袋链
        </h1>
        <p className="mt-2.5 text-sm text-muted">
          把分散在各个平台的喜欢，收藏到这里。
        </p>

        <div className="mt-11 grid grid-cols-4 gap-x-6 gap-y-7">
          {platforms.map(({ key, name, Icon }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="grid h-14 w-14 place-items-center rounded-full border border-sand shadow-lg"
                style={{ backgroundColor: "#ffffff", color: platformColor(key) }}
              >
                <Icon size={24} />
              </div>
              <span className="text-[11px] text-muted">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-sm pb-4">
        <a
          href="/login"
          className="flex min-h-[50px] w-full items-center justify-center rounded-2xl border border-[#a8a29e] text-[15px] font-semibold text-[#57534e]"
        >
          登录
        </a>
        <div className="mt-4 text-center">
          <a
            href="/register"
            className="text-sm text-muted"
          >
            没有账号？<span className="text-[#57534e] font-medium">注册</span>
          </a>
        </div>
      </div>

      <div className="pb-6 text-center">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted"
        >
          蜀ICP备2026063684号-1
        </a>
      </div>
    </main>
  );
}
