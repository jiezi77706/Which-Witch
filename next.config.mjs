import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    
    // 修复 MetaMask SDK 和其他依赖的问题
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': path.resolve(__dirname, './lib/polyfills/async-storage.js'),
        'react-native': false,
        'react-native-randombytes': false,
        'pino-pretty': false,
        'lokijs': false,
        'encoding': false,
        'fs': false,
        'net': false,
        'tls': false,
        'crypto': false,
        'stream': false,
        'url': false,
        'zlib': false,
        'http': false,
        'https': false,
        'assert': false,
        'os': false,
        'path': false,
      };
      
      // 添加 ProvidePlugin 来处理全局变量
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    // 忽略 MetaMask SDK 的警告和错误
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { file: /node_modules\/@metamask\/sdk/ },
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
      /Can't resolve '@react-native-async-storage\/async-storage'/,
    ];
    
    return config;
  },
}

export default nextConfig