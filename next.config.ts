import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 조선 영업기회 모듈은 가상 고객사 데이터뿐이라 폐기(2026-10-08). 기존 링크는 시황으로 보낸다.
  async redirects() {
    return [
      { source: "/opportunities", destination: "/market", permanent: true },
      { source: "/opportunities/:path*", destination: "/market", permanent: true },
    ];
  },
};

export default nextConfig;
