/** @type {import('next').NextConfig} */
// Ensure environment variables are available on the client side
const nextConfig = {
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  // 确保环境变量在客户端可用
  publicRuntimeConfig: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
  }
};

export default nextConfig;
