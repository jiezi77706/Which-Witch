'use client'

import { ethers } from 'ethers'
import { toast } from 'sonner'
import { ExchangeRateService } from './exchange-rate.service'

// 测试网配置
export const TESTNET_CHAINS = {
  // Sepolia (目标链)
  11155111: {
    name: 'Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorer: 'https://sepolia.etherscan.io',
    faucet: 'https://sepoliafaucet.com',
    isTarget: true
  },
  // BSC Testnet
  97: {
    name: 'BSC Testnet',
    symbol: 'BNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorer: 'https://testnet.bscscan.com',
    faucet: 'https://testnet.binance.org/faucet-smart'
  },
  // Polygon Mumbai
  80001: {
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    faucet: 'https://faucet.polygon.technology'
  },
  // ZetaChain Athens
  7001: {
    name: 'ZetaChain Athens',
    symbol: 'ZETA',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://zetachain-athens-3.blockscout.com',
    faucet: 'https://labs.zetachain.com/get-zeta'
  }
}

// 简化的跨链支付服务 (测试币版本)
export class TestnetCrossChainService {
  
  /**
   * 获取支持的测试网链
   */
  static getSupportedChains() {
    return Object.entries(TESTNET_CHAINS).map(([chainId, config]) => ({
      id: parseInt(chainId),
      ...config
    }))
  }

  /**
   * 检查是否为测试网
   */
  static isTestnet(chainId: number): boolean {
    return chainId in TESTNET_CHAINS
  }

  /**
   * 获取链配置
   */
  static getChainConfig(chainId: number) {
    return TESTNET_CHAINS[chainId as keyof typeof TESTNET_CHAINS]
  }

  /**
   * 估算跨链费用 (使用实时汇率)
   */
  static async estimateCrossChainFee(
    targetETHAmount: string, 
    sourceChainId: number
  ): Promise<{
    sourceToken: string
    requiredSourceAmount: string
    crossChainFee: string
    networkFee: string
    totalRequired: string
    finalETHAmount: string
    exchangeRate: number
  }> {
    const chainConfig = this.getChainConfig(sourceChainId)
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${sourceChainId}`)
    }

    // 获取源代币符号
    const sourceToken = chainConfig.symbol

    // 如果是 Sepolia，直接支付，无跨链费用
    if (sourceChainId === 11155111) {
      return {
        sourceToken: 'ETH',
        requiredSourceAmount: targetETHAmount,
        crossChainFee: '0',
        networkFee: '0.001',
        totalRequired: (parseFloat(targetETHAmount) + 0.001).toFixed(6),
        finalETHAmount: targetETHAmount,
        exchangeRate: 1
      }
    }

    // 跨链费用配置
    const feeConfig = {
      97: 0.02,     // BSC - 2%
      80001: 0.025, // Polygon - 2.5%
      7001: 0.015   // ZetaChain - 1.5%
    }

    const crossChainFeeRate = feeConfig[sourceChainId as keyof typeof feeConfig] || 0.025

    // 使用汇率服务计算所需金额
    const calculation = await ExchangeRateService.calculateRequiredAmount(
      targetETHAmount,
      sourceToken,
      crossChainFeeRate
    )

    // 获取汇率
    const exchangeRate = await ExchangeRateService.getExchangeRate(sourceToken, 'ETH')

    return {
      sourceToken,
      requiredSourceAmount: calculation.requiredSourceAmount,
      crossChainFee: calculation.crossChainFee,
      networkFee: calculation.networkFee,
      totalRequired: calculation.totalRequired,
      finalETHAmount: calculation.finalETHAmount,
      exchangeRate
    }
  }

  /**
   * 模拟跨链支付 (测试网版本)
   */
  static async simulateCrossChainPayment(params: {
    sourceChainId: number
    targetChainId: number
    amount: string
    recipientAddress: string
    paymentType: 'tip' | 'license' | 'nft'
    workId?: number
  }): Promise<{
    success: boolean
    transactionHash?: string
    paymentId?: string
    error?: string
    estimatedTime?: string
  }> {
    
    const { sourceChainId, targetChainId, amount, recipientAddress, paymentType, workId } = params

    try {
      // 验证参数
      if (!this.isTestnet(sourceChainId)) {
        throw new Error(`不支持的源链: ${sourceChainId}`)
      }

      if (targetChainId !== 11155111) {
        throw new Error('目前只支持转换到 Sepolia 网络')
      }

      if (!window.ethereum) {
        throw new Error('请安装 MetaMask 钱包')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const userAddress = await signer.getAddress()

      // 检查余额
      const balance = await provider.getBalance(userAddress)
      const requiredAmount = ethers.parseEther(amount)
      
      if (balance < requiredAmount) {
        throw new Error(`余额不足。当前余额: ${ethers.formatEther(balance)} ${this.getChainConfig(sourceChainId)?.symbol}`)
      }

      // 如果是 Sepolia，直接支付
      if (sourceChainId === 11155111) {
        return await this.processDirectPayment(signer, recipientAddress, amount, paymentType, workId)
      }

      // 跨链支付模拟
      return await this.processCrossChainPayment(signer, params)

    } catch (error: any) {
      console.error('跨链支付失败:', error)
      return {
        success: false,
        error: error.message || '跨链支付失败'
      }
    }
  }

  /**
   * 直接支付 (Sepolia)
   */
  private static async processDirectPayment(
    signer: ethers.Signer,
    recipientAddress: string,
    amount: string,
    paymentType: 'tip' | 'license' | 'nft',
    workId?: number
  ) {
    try {
      // 根据支付类型选择不同的处理方式
      if (paymentType === 'tip') {
        // 直接转账打赏
        const tx = await signer.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount),
          gasLimit: 21000
        })

        await tx.wait()

        return {
          success: true,
          transactionHash: tx.hash,
          paymentId: `direct_${Date.now()}`,
          estimatedTime: '已完成'
        }
      } else if (paymentType === 'license') {
        // 调用授权合约
        const { requestAuthorization } = await import('@/lib/web3/services/contract.service')
        const txHash = await requestAuthorization(BigInt(workId || 0), amount)

        return {
          success: true,
          transactionHash: txHash,
          paymentId: `license_${Date.now()}`,
          estimatedTime: '已完成'
        }
      } else {
        // NFT 购买 (暂时模拟)
        const tx = await signer.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount),
          gasLimit: 100000
        })

        await tx.wait()

        return {
          success: true,
          transactionHash: tx.hash,
          paymentId: `nft_${Date.now()}`,
          estimatedTime: '已完成'
        }
      }
    } catch (error: any) {
      throw new Error(`直接支付失败: ${error.message}`)
    }
  }

  /**
   * 跨链支付处理
   */
  private static async processCrossChainPayment(
    signer: ethers.Signer,
    params: {
      sourceChainId: number
      targetChainId: number
      amount: string
      recipientAddress: string
      paymentType: 'tip' | 'license' | 'nft'
      workId?: number
    }
  ) {
    const { sourceChainId, amount, recipientAddress, paymentType } = params

    try {
      // 模拟跨链合约调用
      // 实际实现中，这里应该调用 ZetaChain 或其他跨链协议的合约

      // 1. 创建跨链交易
      const crossChainData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address', 'uint256', 'string', 'uint256'],
        [recipientAddress, params.workId || 0, paymentType, params.targetChainId]
      )

      // 2. 发送到跨链合约 (模拟地址)
      const mockCrossChainContract = '0x1234567890123456789012345678901234567890'
      
      const tx = await signer.sendTransaction({
        to: mockCrossChainContract,
        value: ethers.parseEther(amount),
        data: crossChainData,
        gasLimit: 200000
      })

      // 3. 等待交易确认
      const receipt = await tx.wait()

      if (!receipt) {
        throw new Error('交易确认失败')
      }

      // 4. 生成跨链支付 ID
      const paymentId = `crosschain_${sourceChainId}_${Date.now()}`

      // 5. 估算到账时间
      const estimatedTime = this.getEstimatedTime(sourceChainId)

      return {
        success: true,
        transactionHash: tx.hash,
        paymentId,
        estimatedTime
      }

    } catch (error: any) {
      throw new Error(`跨链支付失败: ${error.message}`)
    }
  }

  /**
   * 获取预估到账时间
   */
  static getEstimatedTime(sourceChainId: number): string {
    const timeMap = {
      97: '2-5 分钟',      // BSC
      80001: '3-8 分钟',   // Polygon
      7001: '1-3 分钟'     // ZetaChain
    }
    return timeMap[sourceChainId as keyof typeof timeMap] || '5-10 分钟'
  }

  /**
   * 查询跨链支付状态
   */
  static async getPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'processing' | 'success' | 'failed'
    sourceChain?: string
    targetChain?: string
    amount?: string
    recipient?: string
    transactionHash?: string
    estimatedTime?: string
  }> {
    // 模拟状态查询
    // 实际实现中应该查询跨链协议的状态

    if (paymentId.startsWith('direct_')) {
      return {
        status: 'success',
        sourceChain: 'Sepolia',
        targetChain: 'Sepolia',
        transactionHash: '0x' + paymentId.slice(-40).padStart(64, '0')
      }
    }

    if (paymentId.startsWith('crosschain_')) {
      // 模拟跨链状态变化
      const timestamp = parseInt(paymentId.split('_')[2])
      const elapsed = Date.now() - timestamp
      
      if (elapsed < 30000) { // 30秒内
        return { status: 'pending', estimatedTime: '处理中...' }
      } else if (elapsed < 120000) { // 2分钟内
        return { status: 'processing', estimatedTime: '跨链转换中...' }
      } else {
        return { 
          status: 'success', 
          sourceChain: 'Cross-chain',
          targetChain: 'Sepolia',
          transactionHash: '0x' + paymentId.slice(-40).padStart(64, '0')
        }
      }
    }

    return { status: 'failed' }
  }

  /**
   * 获取测试币水龙头链接
   */
  static getFaucetUrl(chainId: number): string | null {
    const config = this.getChainConfig(chainId)
    return config?.faucet || null
  }

  /**
   * 添加测试网到 MetaMask
   */
  static async addTestnetToWallet(chainId: number): Promise<boolean> {
    const config = this.getChainConfig(chainId)
    if (!config || !window.ethereum) return false

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: config.name,
          nativeCurrency: {
            name: config.symbol,
            symbol: config.symbol,
            decimals: 18
          },
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.blockExplorer]
        }]
      })
      return true
    } catch (error) {
      console.error('添加网络失败:', error)
      return false
    }
  }
}