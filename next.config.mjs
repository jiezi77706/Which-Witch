/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 配置路径别名和 fallback
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './',
    };
    
    // 修复 MetaMask SDK 和其他依赖的问题
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'react-native': false,
        'react-native-randombytes': false,
        'pino-pretty': false,
        'lokijs': false,
        'encoding': false,
      };
    }
    
    return config;
  },
}

export default nextConfig