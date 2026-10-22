import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 允许手机通过局域网 IP 访问 dev 服务器（否则 Next 16 会屏蔽其前端 JS，导致页面无交互）
  allowedDevOrigins: ["192.168.1.7"],
  // undici 是 Node 原生包，Turbopack 打包会报错（import { Agent } 时 undefined），标记为外部包
  serverExternalPackages: ["undici"],
  experimental: {
    cpus: 2,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
