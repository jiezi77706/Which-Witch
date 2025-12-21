"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { sepolia } from "wagmi/chains"

// 获取当前网络名称
function getCurrentNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: "Ethereum Mainnet",
    11155111: "Sepolia Testnet",
    5: "Goerli Testnet",
    137: "Polygon Mainnet",
    80001: "Polygon Mumbai",
    56: "BSC Mainnet",
    97: "BSC Testnet",
  }
  
  return networks[chainId] || `Unknown Network (${chainId})`
}

// 添加Sepolia网络到MetaMask
async function addSepoliaNetwork() {
  if (typeof window === 'undefined' || !window.ethereum) {
    return
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0xaa36a7', // 11155111 in hex
        chainName: 'Sepolia Testnet',
        nativeCurrency: {
          name: 'Sepolia ETH',
          symbol: 'SEP',
          decimals: 18,
        },
        rpcUrls: [
          'https://rpc.sepolia.org',
          'https://eth-sepolia.g.alchemy.com/v2/demo',
        ],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      }],
    })
  } catch (error) {
    console.error('Failed to add Sepolia network:', error)
  }
}

export function NetworkSwitcher() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const [showAlert, setShowAlert] = useState(false)

  const isCorrectNetwork = chainId === sepolia.id
  const currentNetworkName = getCurrentNetworkName(chainId)

  useEffect(() => {
    if (isConnected && !isCorrectNetwork) {
      setShowAlert(true)
    } else {
      setShowAlert(false)
    }
  }, [isConnected, isCorrectNetwork])

  const handleSwitchNetwork = async () => {
    try {
      switchChain({ chainId: sepolia.id })
    } catch (error) {
      console.error('Failed to switch network:', error)
      // 如果切换失败，尝试添加网络
      await addSepoliaNetwork()
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* 网络切换提醒 */}
      {showAlert && (
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-medium text-yellow-800">
                需要切换到Sepolia测试网才能进行NFT铸造
              </p>
              <Button 
                onClick={handleSwitchNetwork}
                disabled={isPending}
                size="sm"
                className="mt-2"
              >
                {isPending ? "切换中..." : "切换到Sepolia测试网"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}