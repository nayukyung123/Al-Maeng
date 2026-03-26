import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    output: 'standalone',
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "image.aladin.co.kr" },
            { protocol: "https", hostname: "image.tmdb.org" },
            { protocol: "https", hostname: "almaeng-ticket-image-547741151274-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com" },
        ],
    },
};

export default nextConfig;
