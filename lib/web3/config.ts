import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem'

// ZetaChain Athens 测试网配置
export const zetachainAthens = defineChain({
  id: 7001,
  name: 'ZetaChain Athens Testnet',
  network: 'zetachain-athens',
  nativeCurrency: {
    decimals: 18,
    name: 'ZETA',
    symbol: 'ZETA',
  },
  rpcUrls: {
    default: {
      http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
    },
    public: {
      http: ['https://zetachain-athens-evm.blockpi.network/v1/rpc/public'],
    },
  },
  blockExplorers: {
    default: {
      name: 'ZetaScan',
      url: 'https://zetachain-athens-3.blockscout.com',
    },
  },
  testnet: true,
})

// 使用环境变量或默认的公共 RPC
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';
const zetaRpcUrl = process.env.NEXT_PUBLIC_ZETA_RPC_URL || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';

export const config = createConfig({
  chains: [sepolia, zetachainAthens],
  connectors: [
    injected({ 
      target: 'metaMask',
      shimDisconnect: true,
    }),
    injected({
      target: () => ({
        id: 'onekey',
        name: 'OneKey',
        provider: typeof window !== 'undefined' ? (window as any).$onekey?.ethereum : undefined,
      }),
      shimDisconnect: true,
    }),
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
    [zetachainAthens.id]: http(zetaRpcUrl),
  },
  ssr: true, // 启用 SSR 支持
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
