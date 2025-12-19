import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { WorkRegistryService } from '../contracts/services/workRegistry.service';
import { CreationRightsNFTService } from '../contracts/services/creationRightsNFT.service';
import { VotingSystemService } from '../contracts/services/votingSystem.service';
import { NETWORK_CONFIG } from '../contracts/config';

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // 初始化provider和signer
  useEffect(() => {
    const initProvider = async () => {
      // 创建provider
      const rpcProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.SEPOLIA.rpcUrl);
      setProvider(rpcProvider);

      // 如果钱包已连接，创建signer
      if (walletClient && isConnected) {
        try {
          const ethersSigner = await ethers.BrowserProvider.from(walletClient).getSigner();
          setSigner(ethersSigner);
        } catch (error) {
          console.error('Failed to create signer:', error);
          setSigner(null);
        }
      } else {
        setSigner(null);
      }
    };

    initProvider();
  }, [walletClient, isConnected]);

  // 创建合约服务实例
  const contracts = useMemo(() => {
    if (!provider) return null;

    return {
      workRegistry: new WorkRegistryService(provider, signer || undefined),
      creationRightsNFT: new CreationRightsNFTService(provider, signer || undefined),
      votingSystem: new VotingSystemService(provider, signer || undefined),
    };
  }, [provider, signer]);

  return {
    contracts,
    provider,
    signer,
    isConnected,
    address,
  };
}

// 专门用于WorkRegistry的hook
export function useWorkRegistry() {
  const { contracts } = useContracts();
  return contracts?.workRegistry || null;
}

// 专门用于CreationRightsNFT的hook
export function useCreationRightsNFT() {
  const { contracts } = useContracts();
  return contracts?.creationRightsNFT || null;
}

// 专门用于VotingSystem的hook
export function useVotingSystem() {
  const { contracts } = useContracts();
  return contracts?.votingSystem || null;
}