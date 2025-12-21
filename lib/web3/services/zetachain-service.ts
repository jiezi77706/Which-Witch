'use client'

import { ethers } from 'ethers'
import { toast } from 'sonner'

// ZetaChain 配置 (测试网)
export const ZETA_CHAIN_CONFIG = {
  chainId: 7001,
  name: 'ZetaChain Athens Testnet',
  rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
  blockExplorer: 'https://zetachain-athens-3.blockscout.com',
  nativeCurrency: {
    name: 'ZETA',
    symbol: 'ZETA',
    decimals: 18
  },
  // 测试网配置
  isTestnet: true,
  faucet: 'https://labs.zetachain.com/get-zeta',
  // 测试合约地址 (需要部署后更新)
  contracts: {
    crossChainTip: '0x1234567890123456789012345678901234567890', // 占位符
    crossChainLicense: '0x1234567890123456789012345678901234567890' // 占位符
  }
}

// 支持的目标链
export const SUPPORTED_TARGET_CHAINS = {
  11155111: {
    name: 'Sepolia',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    blockExplorer: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    blockExplorer: 'https://polygonscan.com'
  }
}

export interface CrossChainTipParams {
  recipientAddress: string
  amount: string // ETH amount as string
  targetChainId: number
  workId?: number
  creatorName?: string
}

export interface CrossChainLicenseFeeParams {
  recipientAddress: string
  amount: string // ETH amount as string
  targetChainId: number
  workId: number
  creatorName?: string
}

export interface CrossChainTipResult {
  success: boolean
  transactionHash?: string
  error?: string
  estimatedArrivalTime?: string
}

export class ZetaChainService {
  
  /**
   * 检查是否连接到 ZetaChain
   */
  static async isConnectedToZetaChain(): Promise<boolean> {
    if (!window.ethereum) return false
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      return parseInt(chainId, 16) === ZETA_CHAIN_CONFIG.chainId
    } catch {
      return false
    }
  }

  /**
   * 切换到 ZetaChain 网络
   */
  static async switchToZetaChain(): Promise<boolean> {
    if (!window.ethereum) {
      toast.error('请安装 MetaMask')
      return false
    }

    try {
      // 尝试切换到 ZetaChain
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${ZETA_CHAIN_CONFIG.chainId.toString(16)}` }],
      })
      return true
    } catch (switchError: any) {
      // 如果网络不存在，添加网络
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${ZETA_CHAIN_CONFIG.chainId.toString(16)}`,
              chainName: ZETA_CHAIN_CONFIG.name,
              rpcUrls: [ZETA_CHAIN_CONFIG.rpcUrl],
              nativeCurrency: ZETA_CHAIN_CONFIG.nativeCurrency,
              blockExplorerUrls: [ZETA_CHAIN_CONFIG.blockExplorer]
            }]
          })
          return true
        } catch (addError) {
          console.error('添加网络失败:', addError)
          toast.error('添加 ZetaChain 网络失败')
          return false
        }
      } else {
        console.error('切换网络失败:', switchError)
        toast.error('切换到 ZetaChain 网络失败')
        return false
      }
    }
  }

  /**
   * 获取 ZETA 余额
   */
  static async getZetaBalance(address: string): Promise<string> {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('获取余额失败:', error)
      return '0'
    }
  }

  /**
   * 估算跨链转账费用
   */
  static async estimateCrossChainFee(amount: string): Promise<{
    totalCost: string
    networkFee: string
    crossChainFee: string
  }> {
    try {
      const amountWei = ethers.parseEther(amount)
      
      // 简化的费用估算
      const networkFeeWei = ethers.parseEther('0.001') // 约 $2-3
      const crossChainFeeWei = amountWei * BigInt(25) / BigInt(10000) // 0.25%
      const totalCostWei = amountWei + networkFeeWei + crossChainFeeWei

      return {
        totalCost: ethers.formatEther(totalCostWei),
        networkFee: ethers.formatEther(networkFeeWei),
        crossChainFee: ethers.formatEther(crossChainFeeWei)
      }
    } catch (error) {
      console.error('费用估算失败:', error)
      return {
        totalCost: '0',
        networkFee: '0',
        crossChainFee: '0'
      }
    }
  }

  /**
   * 发起跨链打赏 (简化版本，直接转账 ZETA)
   */
  static async sendCrossChainTip(params: CrossChainTipParams): Promise<CrossChainTipResult> {
    const { recipientAddress, amount, targetChainId, workId, creatorName } = params

    try {
      // 1. 检查网络
      const isOnZetaChain = await this.isConnectedToZetaChain()
      if (!isOnZetaChain) {
        const switched = await this.switchToZetaChain()
        if (!switched) {
          return { success: false, error: '请切换到 ZetaChain 网络' }
        }
      }

      // 2. 获取 provider 和 signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // 3. 检查余额
      const balance = await this.getZetaBalance(userAddress)
      const requiredAmount = parseFloat(amount) + 0.001 // 加上 gas 费
      
      if (parseFloat(balance) < requiredAmount) {
        return { 
          success: false, 
          error: `余额不足。需要 ${requiredAmount} ZETA，当前余额 ${balance} ZETA` 
        }
      }

      // 4. 发送交易 (简化版本：直接转账到接收地址)
      // 注意：这是简化实现，实际应该使用 ZetaChain 的跨链合约
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount),
        gasLimit: 21000
      })

      toast.success(`跨链打赏已发起！交易哈希: ${tx.hash.slice(0, 10)}...`)

      // 5. 等待确认
      const receipt = await tx.wait()
      
      if (receipt?.status === 1) {
        // 记录到数据库 (可选)
        await this.recordCrossChainTip({
          transactionHash: tx.hash,
          fromAddress: userAddress,
          toAddress: recipientAddress,
          amount,
          targetChainId,
          workId,
          creatorName
        })

        return {
          success: true,
          transactionHash: tx.hash,
          estimatedArrivalTime: '1-3 分钟'
        }
      } else {
        return { success: false, error: '交易失败' }
      }

    } catch (error: any) {
      console.error('跨链打赏失败:', error)
      
      let errorMessage = '跨链打赏失败'
      if (error.code === 4001) {
        errorMessage = '用户取消了交易'
      } else if (error.code === -32603) {
        errorMessage = '余额不足或网络错误'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 发起跨链授权费支付 (使用 ZetaChain 合约)
   */
  static async sendCrossChainLicenseFee(params: CrossChainLicenseFeeParams): Promise<CrossChainTipResult> {
    const { recipientAddress, amount, targetChainId, workId, creatorName } = params

    try {
      // 1. 检查网络
      const isOnZetaChain = await this.isConnectedToZetaChain()
      if (!isOnZetaChain) {
        const switched = await this.switchToZetaChain()
        if (!switched) {
          return { success: false, error: '请切换到 ZetaChain 网络' }
        }
      }

      // 2. 获取 provider 和 signer
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // 3. 检查余额
      const balance = await this.getZetaBalance(userAddress)
      const requiredAmount = parseFloat(amount) + 0.001 // 加上 gas 费
      
      if (parseFloat(balance) < requiredAmount) {
        return { 
          success: false, 
          error: `余额不足。需要 ${requiredAmount} ZETA，当前余额 ${balance} ZETA` 
        }
      }

      // 4. 调用 ZetaChain 跨链支付合约
      const contractAddress = process.env.NEXT_PUBLIC_ZETA_PAYMENT_CONTRACT
      if (!contractAddress) {
        return { success: false, error: 'ZetaChain 合约地址未配置' }
      }

      // 简化的合约 ABI
      const contractABI = [
        "function initiateCrossChainLicenseFeeZeta(address recipient, uint256 workId, uint256 targetChainId) external payable returns (uint256 paymentId)"
      ]

      const contract = new ethers.Contract(contractAddress, contractABI, signer)

      // 5. 调用合约函数
      const tx = await contract.initiateCrossChainLicenseFeeZeta(
        recipientAddress,
        workId,
        targetChainId,
        { value: ethers.parseEther(amount) }
      )

      toast.success(`跨链授权费支付已发起！交易哈希: ${tx.hash.slice(0, 10)}...`)

      // 6. 等待确认
      const receipt = await tx.wait()
      
      if (receipt?.status === 1) {
        // 记录到数据库
        await this.recordCrossChainPayment({
          transactionHash: tx.hash,
          fromAddress: userAddress,
          toAddress: recipientAddress,
          amount,
          targetChainId,
          workId,
          creatorName,
          paymentType: 'license'
        })

        return {
          success: true,
          transactionHash: tx.hash,
          estimatedArrivalTime: '1-3 分钟'
        }
      } else {
        return { success: false, error: '交易失败' }
      }

    } catch (error: any) {
      console.error('跨链授权费支付失败:', error)
      
      let errorMessage = '跨链授权费支付失败'
      if (error.code === 4001) {
        errorMessage = '用户取消了交易'
      } else if (error.code === -32603) {
        errorMessage = '余额不足或网络错误'
      } else if (error.message?.includes('contract')) {
        errorMessage = '合约调用失败，请检查合约地址'
      }
      
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 记录跨链打赏到数据库
   */
  private static async recordCrossChainTip(data: {
    transactionHash: string
    fromAddress: string
    toAddress: string
    amount: string
    targetChainId: number
    workId?: number
    creatorName?: string
  }) {
    try {
      // 这里可以调用你的 API 来记录交易
      const response = await fetch('/api/cross-chain-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          status: 'pending',
          paymentType: 'tip'
        })
      })
      
      if (!response.ok) {
        console.error('记录交易失败:', await response.text())
      }
    } catch (error) {
      console.error('记录交易到数据库失败:', error)
    }
  }

  /**
   * 记录跨链支付到数据库
   */
  private static async recordCrossChainPayment(data: {
    transactionHash: string
    fromAddress: string
    toAddress: string
    amount: string
    targetChainId: number
    workId: number
    creatorName?: string
    paymentType: 'tip' | 'license' | 'nft'
  }) {
    try {
      // 这里可以调用你的 API 来记录交易
      const response = await fetch('/api/cross-chain-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          status: 'pending'
        })
      })
      
      if (!response.ok) {
        console.error('记录支付失败:', await response.text())
      }
    } catch (error) {
      console.error('记录支付到数据库失败:', error)
    }
  }

  /**
   * 获取交易状态
   */
  static async getTransactionStatus(txHash: string): Promise<{
    status: 'pending' | 'success' | 'failed'
    blockNumber?: number
    confirmations?: number
  }> {
    try {
      const provider = new ethers.JsonRpcProvider(ZETA_CHAIN_CONFIG.rpcUrl)
      const receipt = await provider.getTransactionReceipt(txHash)
      
      if (!receipt) {
        return { status: 'pending' }
      }
      
      const currentBlock = await provider.getBlockNumber()
      const confirmations = currentBlock - receipt.blockNumber
      
      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        confirmations
      }
    } catch (error) {
      console.error('获取交易状态失败:', error)
      return { status: 'failed' }
    }
  }

  /**
   * 打开区块浏览器查看交易
   */
  static openTransactionInExplorer(txHash: string) {
    const url = `${ZETA_CHAIN_CONFIG.blockExplorer}/tx/${txHash}`
    window.open(url, '_blank')
  }
}

// 类型定义
declare global {
  interface Window {
    ethereum?: any
  }
}