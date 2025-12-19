import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ContractState {
  // 合约连接状态
  isConnected: boolean;
  chainId: number | null;
  
  // 交易状态
  pendingTransactions: Record<string, {
    hash: string;
    type: 'createWork' | 'mintNFT' | 'createVoting' | 'vote' | 'buyNFT';
    status: 'pending' | 'confirmed' | 'failed';
    timestamp: number;
  }>;
  
  // 缓存数据
  works: Record<number, any>;
  votings: Record<number, any>;
  nfts: Record<number, any>;
  
  // Actions
  setConnectionStatus: (connected: boolean, chainId?: number) => void;
  addPendingTransaction: (hash: string, type: string) => void;
  updateTransactionStatus: (hash: string, status: 'confirmed' | 'failed') => void;
  cacheWork: (workId: number, work: any) => void;
  cacheVoting: (votingId: number, voting: any) => void;
  cacheNFT: (tokenId: number, nft: any) => void;
  clearCache: () => void;
}

export const useContractStore = create<ContractState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      chainId: null,
      pendingTransactions: {},
      works: {},
      votings: {},
      nfts: {},

      setConnectionStatus: (connected, chainId) => {
        set({ isConnected: connected, chainId: chainId || null });
      },

      addPendingTransaction: (hash, type) => {
        set((state) => ({
          pendingTransactions: {
            ...state.pendingTransactions,
            [hash]: {
              hash,
              type: type as any,
              status: 'pending',
              timestamp: Date.now(),
            },
          },
        }));
      },

      updateTransactionStatus: (hash, status) => {
        set((state) => ({
          pendingTransactions: {
            ...state.pendingTransactions,
            [hash]: {
              ...state.pendingTransactions[hash],
              status,
            },
          },
        }));
      },

      cacheWork: (workId, work) => {
        set((state) => ({
          works: {
            ...state.works,
            [workId]: work,
          },
        }));
      },

      cacheVoting: (votingId, voting) => {
        set((state) => ({
          votings: {
            ...state.votings,
            [votingId]: voting,
          },
        }));
      },

      cacheNFT: (tokenId, nft) => {
        set((state) => ({
          nfts: {
            ...state.nfts,
            [tokenId]: nft,
          },
        }));
      },

      clearCache: () => {
        set({
          works: {},
          votings: {},
          nfts: {},
          pendingTransactions: {},
        });
      },
    }),
    {
      name: 'contract-store',
      partialize: (state) => ({
        works: state.works,
        votings: state.votings,
        nfts: state.nfts,
        pendingTransactions: state.pendingTransactions,
      }),
    }
  )
);