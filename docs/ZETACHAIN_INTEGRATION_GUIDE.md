# ZetaChain 跨链支付接入指南

## 📋 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [前置准备](#前置准备)
4. [合约部署](#合约部署)
5. [前端集成](#前端集成)
6. [测试流程](#测试流程)
7. [常见问题](#常见问题)

---

## 概述

### 什么是 ZetaChain？

ZetaChain 是一个全链互操作性区块链，允许用户从任何链（包括比特币）向任何其他链发送消息和价值。它通过 **ZRC-20** 标准实现跨链资产转移。

### 为什么使用 ZetaChain？

- ✅ **真正的跨链支付**：用户可以从 Ethereum、BSC、Polygon 等任意链支付
- ✅ **统一的用户体验**：无需切换网络或桥接资产
- ✅ **降低摩擦**：用户使用自己链上的原生代币即可支付
- ✅ **扩展性强**：支持 Bitcoin、Ethereum、BSC、Polygon 等多条链

### WhichWitch 的跨链支付场景

1. **跨链打赏**：用户在 Polygon 上用 MATIC 给 Ethereum 上的创作者打赏
2. **跨链授权费**：用户在 BSC 上用 BNB 支付授权费到 Sepolia 测试网
3. **跨链 NFT 购买**：用户在任意链上购买 NFT，收益自动分配到创作者链

---

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面 (Next.js)                    │
│  - 选择支付链和代币                                          │
│  - 发起跨链支付                                              │
│  - 查看支付状态                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    源链 (Ethereum/BSC/Polygon)               │
│  - 用户发起支付交易                                          │
│  - 代币被锁定/销毁                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ZetaChain (中继层)                        │
│  ZetaCrossChainPayment 合约                                  │
│  - 接收跨链消息                                              │
│  - 处理支付逻辑                                              │
│  - 计算平台费用                                              │
│  - 发送到目标链                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    目标链 (Sepolia)                          │
│  PaymentManager / NFTMarketplace                             │
│  - 接收支付                                                  │
│  - 分配收益给创作者链                                        │
│  - 更新链上状态                                              │
└─────────────────────────────────────────────────────────────┘
```

### 支付流程

#### 方式一：使用 ZRC-20 代币（推荐）

```
1. 用户在源链授权 ZRC-20 代币
2. 调用 ZetaCrossChainPayment.initiateCrossChainTip()
3. ZRC-20 代币转移到 ZetaChain
4. ZetaChain 处理支付逻辑
5. 使用 ZRC-20.withdraw() 发送到目标链
6. 目标链接收原生代币
```

#### 方式二：使用原生 ZETA 代币

```
1. 用户在 ZetaChain 上持有 ZETA
2. 调用 ZetaCrossChainPayment.initiateCrossChainTipZeta()
3. 使用 ZetaConnector 发送跨链消息
4. 目标链接收 ZETA 或等值代币
```

---

## 前置准备

### 1. 安装开发工具

```bash
# 安装 Foundry (Solidity 开发工具)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 验证安装
forge --version
cast --version
```

### 2. 获取测试资金

访问以下水龙头获取测试代币：

- **ZetaChain Athens 测试网**: https://labs.zetachain.com/get-zeta
- **Sepolia 测试网**: https://sepoliafaucet.com/
- **Polygon Mumbai**: https://faucet.polygon.technology/

### 3. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
# ZetaChain 配置
NEXT_PUBLIC_ZETA_CHAIN_ID=7001
NEXT_PUBLIC_ZETA_RPC_URL=https://zetachain-athens-evm.blockpi.network/v1/rpc/public
NEXT_PUBLIC_ZETA_PAYMENT_CONTRACT=0x你的ZetaChain合约地址

# 支持的源链
NEXT_PUBLIC_ETHEREUM_CHAIN_ID=1
NEXT_PUBLIC_BSC_CHAIN_ID=56
NEXT_PUBLIC_POLYGON_CHAIN_ID=137
NEXT_PUBLIC_SEPOLIA_CHAIN_ID=11155111

# 目标链合约地址
NEXT_PUBLIC_PAYMENT_MANAGER_ADDRESS=0x你的PaymentManager地址
NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=0x你的NFTMarketplace地址

# Alchemy API Keys (用于多链支持)
NEXT_PUBLIC_ALCHEMY_ETHEREUM_KEY=your_ethereum_key
NEXT_PUBLIC_ALCHEMY_POLYGON_KEY=your_polygon_key
NEXT_PUBLIC_ALCHEMY_SEPOLIA_KEY=your_sepolia_key
```

### 4. 了解 ZRC-20 代币地址

ZetaChain Athens 测试网的 ZRC-20 代币地址：

| 链 | ZRC-20 地址 | 符号 |
|---|---|---|
| Ethereum | `0x91d18e54DAf4F677cB28167158d6dd21F6aB3921` | ETH.ETH |
| BSC | `0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb` | BNB.BSC |
| Polygon | `0x91d18e54DAf4F677cB28167158d6dd21F6aB3921` | MATIC.MATIC |
| Bitcoin | `0x13A0c5930C028511Dc02665E7285134B6d11A5f4` | BTC.BTC |

---

## 合约部署

### 步骤 1: 部署 ZetaChain 合约

```bash
cd src/contracts

# 编译合约
forge build

# 部署到 ZetaChain Athens 测试网
forge script script/DeployZetaPayment.s.sol:DeployZetaPayment \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

部署成功后，记录合约地址：

```
ZetaCrossChainPayment deployed at: 0x1234567890...
```

### 步骤 2: 配置合约

```bash
# 设置环境变量
export ZETA_PAYMENT_ADDRESS=0x你的合约地址

# 运行配置脚本
forge script script/ConfigureZetaPayment.s.sol:ConfigureZetaPayment \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public \
  --private-key $PRIVATE_KEY \
  --broadcast
```

配置内容包括：
- ✅ 支持的链（Ethereum, BSC, Polygon, Sepolia）
- ✅ 支持的币种（ETH, BNB, MATIC, BTC, USDC）
- ✅ 授权的中继器地址
- ✅ 目标链合约地址

### 步骤 3: 验证部署

```bash
# 检查合约 owner
cast call $ZETA_PAYMENT_ADDRESS "owner()" \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 检查支持的链
cast call $ZETA_PAYMENT_ADDRESS "supportedChains(uint256)" 11155111 \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public

# 检查平台费率
cast call $ZETA_PAYMENT_ADDRESS "platformFeeRate()" \
  --rpc-url https://zetachain-athens-evm.blockpi.network/v1/rpc/public
```

---

## 前端集成

### 步骤 1: 安装依赖

项目已包含必要的依赖：
- `wagmi` - Web3 React Hooks
- `viem` - TypeScript Ethereum 库
- `@tanstack/react-query` - 数据获取

### 步骤 2: 配置 Wagmi

创建 `lib/web3/config/zetachain.ts`：

```typescript
import { defineChain } from 'viem'

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
```

更新 `lib/web3/config.ts` 添加 ZetaChain：

```typescript
import { createConfig, http } from 'wagmi'
import { sepolia, mainnet, polygon, bsc } from 'wagmi/chains'
import { zetachainAthens } from './config/zetachain'

export const config = createConfig({
  chains: [sepolia, mainnet, polygon, bsc, zetachainAthens],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
    [zetachainAthens.id]: http(),
  },
})
```

### 步骤 3: 创建跨链支付服务

创建 `lib/web3/services/cross-chain-payment.service.ts`：
```typescript
import { Address, parseEther, formatEther } from 'viem'
import { writeContract, readContract, waitForTransactionReceipt } from 'wagmi/actions'
import { config } from '../config'

// ZetaChain 合约 ABI (简化版)
const ZETA_PAYMENT_ABI = [
  {
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "workId", "type": "uint256"},
      {"name": "targetChainId", "type": "uint256"},
      {"name": "zrc20Token", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "initiateCrossChainTip",
    "outputs": [{"name": "paymentId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "recipient", "type": "address"},
      {"name": "workId", "type": "uint256"},
      {"name": "targetChainId", "type": "uint256"}
    ],
    "name": "initiateCrossChainTipZeta",
    "outputs": [{"name": "paymentId", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"name": "paymentId", "type": "uint256"}],
    "name": "getPayment",
    "outputs": [{
      "components": [
        {"name": "paymentId", "type": "uint256"},
        {"name": "sender", "type": "address"},
        {"name": "recipient", "type": "address"},
        {"name": "amount", "type": "uint256"},
        {"name": "paymentType", "type": "uint8"},
        {"name": "workId", "type": "uint256"},
        {"name": "sourceChainId", "type": "uint256"},
        {"name": "targetChainId", "type": "uint256"},
        {"name": "sourceCurrency", "type": "string"},
        {"name": "completed", "type": "bool"},
        {"name": "timestamp", "type": "uint256"}
      ],
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// ZRC-20 代币 ABI
const ZRC20_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// 支持的链和代币配置
export const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', symbol: 'ETH', zrc20: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' },
  56: { name: 'BSC', symbol: 'BNB', zrc20: '0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb' },
  137: { name: 'Polygon', symbol: 'MATIC', zrc20: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' },
  11155111: { name: 'Sepolia', symbol: 'ETH', zrc20: '0x91d18e54DAf4F677cB28167158d6dd21F6aB3921' }
}

export const ZETA_CHAIN_ID = 7001
export const ZETA_PAYMENT_CONTRACT = process.env.NEXT_PUBLIC_ZETA_PAYMENT_CONTRACT as Address

export interface CrossChainPaymentParams {
  recipient: Address
  workId: bigint
  targetChainId: number
  amount: string // ETH amount as string
  paymentType: 'tip' | 'license' | 'nft'
}

export interface PaymentStatus {
  paymentId: bigint
  sender: Address
  recipient: Address
  amount: bigint
  paymentType: number
  workId: bigint
  sourceChainId: bigint
  targetChainId: bigint
  sourceCurrency: string
  completed: boolean
  timestamp: bigint
}

export class CrossChainPaymentService {
  
  /**
   * 发起跨链支付 (使用 ZRC-20 代币)
   */
  static async initiateCrossChainPayment(params: CrossChainPaymentParams): Promise<bigint> {
    const { recipient, workId, targetChainId, amount, paymentType } = params
    
    const chainConfig = SUPPORTED_CHAINS[targetChainId as keyof typeof SUPPORTED_CHAINS]
    if (!chainConfig) {
      throw new Error(`Unsupported target chain: ${targetChainId}`)
    }

    const amountWei = parseEther(amount)
    const zrc20Token = chainConfig.zrc20 as Address

    // 1. 检查并授权 ZRC-20 代币
    await this.approveZRC20(zrc20Token, amountWei)

    // 2. 调用相应的支付方法
    let functionName: string
    switch (paymentType) {
      case 'tip':
        functionName = 'initiateCrossChainTip'
        break
      case 'license':
        functionName = 'initiateCrossChainLicenseFee'
        break
      case 'nft':
        functionName = 'initiateCrossChainNFTPurchase'
        break
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`)
    }

    const hash = await writeContract(config, {
      address: ZETA_PAYMENT_CONTRACT,
      abi: ZETA_PAYMENT_ABI,
      functionName,
      args: [recipient, workId, BigInt(targetChainId), zrc20Token, amountWei],
      chainId: ZETA_CHAIN_ID,
    })

    // 3. 等待交易确认
    const receipt = await waitForTransactionReceipt(config, { hash })
    
    // 4. 从事件日志中提取 paymentId
    const paymentId = this.extractPaymentIdFromReceipt(receipt)
    
    return paymentId
  }

  /**
   * 发起跨链支付 (使用原生 ZETA)
   */
  static async initiateCrossChainPaymentZeta(params: CrossChainPaymentParams): Promise<bigint> {
    const { recipient, workId, targetChainId, amount, paymentType } = params
    
    const amountWei = parseEther(amount)

    // 调用相应的 ZETA 支付方法
    let functionName: string
    switch (paymentType) {
      case 'tip':
        functionName = 'initiateCrossChainTipZeta'
        break
      case 'license':
        functionName = 'initiateCrossChainLicenseFeeZeta'
        break
      case 'nft':
        functionName = 'initiateCrossChainNFTPurchaseZeta'
        break
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`)
    }

    const hash = await writeContract(config, {
      address: ZETA_PAYMENT_CONTRACT,
      abi: ZETA_PAYMENT_ABI,
      functionName,
      args: [recipient, workId, BigInt(targetChainId)],
      value: amountWei,
      chainId: ZETA_CHAIN_ID,
    })

    const receipt = await waitForTransactionReceipt(config, { hash })
    const paymentId = this.extractPaymentIdFromReceipt(receipt)
    
    return paymentId
  }

  /**
   * 授权 ZRC-20 代币
   */
  private static async approveZRC20(zrc20Token: Address, amount: bigint): Promise<void> {
    // 检查当前授权额度
    const currentAllowance = await readContract(config, {
      address: zrc20Token,
      abi: ZRC20_ABI,
      functionName: 'allowance',
      args: [config.state.current?.address as Address, ZETA_PAYMENT_CONTRACT],
      chainId: ZETA_CHAIN_ID,
    }) as bigint

    // 如果授权额度不足，进行授权
    if (currentAllowance < amount) {
      const hash = await writeContract(config, {
        address: zrc20Token,
        abi: ZRC20_ABI,
        functionName: 'approve',
        args: [ZETA_PAYMENT_CONTRACT, amount],
        chainId: ZETA_CHAIN_ID,
      })

      await waitForTransactionReceipt(config, { hash })
    }
  }

  /**
   * 查询支付状态
   */
  static async getPaymentStatus(paymentId: bigint): Promise<PaymentStatus> {
    const payment = await readContract(config, {
      address: ZETA_PAYMENT_CONTRACT,
      abi: ZETA_PAYMENT_ABI,
      functionName: 'getPayment',
      args: [paymentId],
      chainId: ZETA_CHAIN_ID,
    }) as any

    return {
      paymentId: payment.paymentId,
      sender: payment.sender,
      recipient: payment.recipient,
      amount: payment.amount,
      paymentType: payment.paymentType,
      workId: payment.workId,
      sourceChainId: payment.sourceChainId,
      targetChainId: payment.targetChainId,
      sourceCurrency: payment.sourceCurrency,
      completed: payment.completed,
      timestamp: payment.timestamp,
    }
  }

  /**
   * 获取 ZRC-20 代币余额
   */
  static async getZRC20Balance(userAddress: Address, chainId: number): Promise<string> {
    const chainConfig = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chainId}`)
    }

    const balance = await readContract(config, {
      address: chainConfig.zrc20 as Address,
      abi: ZRC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
      chainId: ZETA_CHAIN_ID,
    }) as bigint

    return formatEther(balance)
  }

  /**
   * 从交易回执中提取 paymentId
   */
  private static extractPaymentIdFromReceipt(receipt: any): bigint {
    // 查找 CrossChainPaymentInitiated 事件
    const event = receipt.logs.find((log: any) => 
      log.topics[0] === '0x...' // CrossChainPaymentInitiated 事件的 topic hash
    )
    
    if (!event) {
      throw new Error('Payment ID not found in transaction receipt')
    }

    // 解析 paymentId (通常是第一个 indexed 参数)
    return BigInt(event.topics[1])
  }

  /**
   * 估算跨链支付费用
   */
  static async estimateCrossChainFee(
    targetChainId: number,
    amount: string
  ): Promise<{ platformFee: string; gasFee: string; total: string }> {
    const amountWei = parseEther(amount)
    
    // 平台费用 2.5%
    const platformFeeWei = (amountWei * BigInt(250)) / BigInt(10000)
    
    // Gas 费用估算 (简化版，实际应该调用合约方法)
    const gasFeeWei = parseEther('0.001') // 约 $2-3 USD
    
    const totalWei = amountWei + platformFeeWei + gasFeeWei

    return {
      platformFee: formatEther(platformFeeWei),
      gasFee: formatEther(gasFeeWei),
      total: formatEther(totalWei)
    }
  }
}
```

### 步骤 4: 创建跨链支付组件

创建 `components/whichwitch/cross-chain-payment-modal.tsx`：

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { CrossChainPaymentService, SUPPORTED_CHAINS, ZETA_CHAIN_ID } from '@/lib/web3/services/cross-chain-payment.service'

interface CrossChainPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: string
  workId: number
  paymentType: 'tip' | 'license' | 'nft'
  title: string
}

export function CrossChainPaymentModal({
  isOpen,
  onClose,
  recipient,
  workId,
  paymentType,
  title
}: CrossChainPaymentModalProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [amount, setAmount] = useState('')
  const [targetChainId, setTargetChainId] = useState<number>(11155111) // 默认 Sepolia
  const [paymentMethod, setPaymentMethod] = useState<'zrc20' | 'zeta'>('zrc20')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentId, setPaymentId] = useState<bigint | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending')

  // 费用估算
  const [fees, setFees] = useState<{
    platformFee: string
    gasFee: string
    total: string
  } | null>(null)

  // 估算费用
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      CrossChainPaymentService.estimateCrossChainFee(targetChainId, amount)
        .then(setFees)
        .catch(console.error)
    } else {
      setFees(null)
    }
  }, [amount, targetChainId])

  // 检查支付状态
  useEffect(() => {
    if (paymentId) {
      const checkStatus = async () => {
        try {
          const status = await CrossChainPaymentService.getPaymentStatus(paymentId)
          setPaymentStatus(status.completed ? 'completed' : 'pending')
        } catch (error) {
          console.error('Failed to check payment status:', error)
          setPaymentStatus('failed')
        }
      }

      const interval = setInterval(checkStatus, 5000) // 每5秒检查一次
      return () => clearInterval(interval)
    }
  }, [paymentId])

  const handlePayment = async () => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      toast.error('请填写有效的支付金额')
      return
    }

    // 检查是否需要切换到 ZetaChain
    if (chainId !== ZETA_CHAIN_ID) {
      try {
        await switchChain({ chainId: ZETA_CHAIN_ID })
      } catch (error) {
        toast.error('请切换到 ZetaChain 网络')
        return
      }
    }

    setIsLoading(true)

    try {
      let resultPaymentId: bigint

      if (paymentMethod === 'zrc20') {
        resultPaymentId = await CrossChainPaymentService.initiateCrossChainPayment({
          recipient: recipient as `0x${string}`,
          workId: BigInt(workId),
          targetChainId,
          amount,
          paymentType
        })
      } else {
        resultPaymentId = await CrossChainPaymentService.initiateCrossChainPaymentZeta({
          recipient: recipient as `0x${string}`,
          workId: BigInt(workId),
          targetChainId,
          amount,
          paymentType
        })
      }

      setPaymentId(resultPaymentId)
      toast.success('跨链支付已发起，正在处理中...')
      
    } catch (error: any) {
      console.error('Payment failed:', error)
      toast.error(error.message || '支付失败，请重试')
      setPaymentStatus('failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'pending':
        return '处理中...'
      case 'completed':
        return '支付完成'
      case 'failed':
        return '支付失败'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 支付信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>接收者:</span>
              <span className="font-mono">{recipient.slice(0, 6)}...{recipient.slice(-4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>作品ID:</span>
              <span>{workId}</span>
            </div>
          </div>

          {/* 支付方式选择 */}
          <div>
            <label className="text-sm font-medium">支付方式</label>
            <Select value={paymentMethod} onValueChange={(value: 'zrc20' | 'zeta') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zrc20">使用 ZRC-20 代币 (推荐)</SelectItem>
                <SelectItem value="zeta">使用原生 ZETA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 目标链选择 */}
          <div>
            <label className="text-sm font-medium">目标链</label>
            <Select value={targetChainId.toString()} onValueChange={(value) => setTargetChainId(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_CHAINS).map(([chainId, config]) => (
                  <SelectItem key={chainId} value={chainId}>
                    {config.name} ({config.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 支付金额 */}
          <div>
            <label className="text-sm font-medium">支付金额</label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                step="0.001"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading || paymentId !== null}
              />
              <Badge variant="secondary">
                {paymentMethod === 'zrc20' 
                  ? SUPPORTED_CHAINS[targetChainId as keyof typeof SUPPORTED_CHAINS]?.symbol 
                  : 'ZETA'
                }
              </Badge>
            </div>
          </div>

          {/* 费用明细 */}
          {fees && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span>支付金额:</span>
                <span>{amount} {paymentMethod === 'zrc20' 
                  ? SUPPORTED_CHAINS[targetChainId as keyof typeof SUPPORTED_CHAINS]?.symbol 
                  : 'ZETA'}</span>
              </div>
              <div className="flex justify-between">
                <span>平台费用 (2.5%):</span>
                <span>{fees.platformFee}</span>
              </div>
              <div className="flex justify-between">
                <span>跨链 Gas 费:</span>
                <span>{fees.gasFee}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1 mt-1">
                <span>总计:</span>
                <span>{fees.total}</span>
              </div>
            </div>
          )}

          {/* 支付状态 */}
          {paymentId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                支付ID: {paymentId.toString()}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              取消
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={isLoading || !amount || parseFloat(amount) <= 0 || paymentStatus === 'completed'}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : paymentStatus === 'completed' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  支付完成
                </>
              ) : (
                <>
                  发起跨链支付
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 步骤 5: 集成到现有组件

更新 `components/whichwitch/work-card.tsx` 添加跨链支付按钮：

```tsx
// 在现有的 work-card.tsx 中添加
import { CrossChainPaymentModal } from './cross-chain-payment-modal'

// 在组件中添加状态
const [showCrossChainPayment, setShowCrossChainPayment] = useState(false)

// 在渲染中添加按钮和模态框
<Button 
  variant="outline" 
  size="sm"
  onClick={() => setShowCrossChainPayment(true)}
>
  跨链打赏
</Button>

<CrossChainPaymentModal
  isOpen={showCrossChainPayment}
  onClose={() => setShowCrossChainPayment(false)}
  recipient={work.creator}
  workId={work.id}
  paymentType="tip"
  title="跨链打赏"
/>
```

---

## 测试流程

### 1. 本地测试

```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问
open http://localhost:3000
```

### 2. 合约测试

```bash
cd src/contracts

# 运行单元测试
forge test

# 运行特定测试
forge test --match-test testCrossChainTip

# 查看测试覆盖率
forge coverage
```

### 3. 集成测试流程

1. **准备测试环境**
   - 在 MetaMask 中添加 ZetaChain Athens 测试网
   - 获取测试 ZETA 代币
   - 获取 Sepolia 测试 ETH

2. **测试跨链打赏**
   - 连接 ZetaChain 网络
   - 选择目标链 (Sepolia)
   - 输入打赏金额
   - 确认交易
   - 等待跨链处理完成

3. **验证结果**
   - 检查 ZetaChain 上的支付记录
   - 验证 Sepolia 上的收益分配
   - 确认创作者链收到收益

### 4. 测试用例

创建 `scripts/test-cross-chain-payment.js`：

```javascript
const { ethers } = require('ethers')

// 测试跨链支付功能
async function testCrossChainPayment() {
  console.log('🧪 开始测试跨链支付功能...')
  
  // 1. 连接 ZetaChain
  const provider = new ethers.JsonRpcProvider(
    'https://zetachain-athens-evm.blockpi.network/v1/rpc/public'
  )
  
  // 2. 测试合约调用
  const contractAddress = process.env.ZETA_PAYMENT_CONTRACT
  const contract = new ethers.Contract(contractAddress, ABI, provider)
  
  // 3. 查询合约状态
  const owner = await contract.owner()
  const platformFeeRate = await contract.platformFeeRate()
  const nextPaymentId = await contract.nextPaymentId()
  
  console.log('✅ 合约状态:')
  console.log(`   Owner: ${owner}`)
  console.log(`   Platform Fee Rate: ${platformFeeRate} basis points`)
  console.log(`   Next Payment ID: ${nextPaymentId}`)
  
  // 4. 测试支持的链
  const supportedChains = [1, 56, 137, 11155111]
  for (const chainId of supportedChains) {
    const isSupported = await contract.supportedChains(chainId)
    console.log(`   Chain ${chainId}: ${isSupported ? '✅' : '❌'}`)
  }
  
  console.log('🎉 测试完成!')
}

testCrossChainPayment().catch(console.error)
```

---

## 常见问题

### Q1: 为什么选择 ZetaChain 而不是其他跨链方案？

**A:** ZetaChain 的优势：
- ✅ **原生跨链支持**：无需桥接，直接跨链转账
- ✅ **支持比特币**：唯一支持 Bitcoin 的全链平台
- ✅ **统一流动性**：ZRC-20 标准统一所有链的资产
- ✅ **开发者友好**：简单的 API，丰富的文档

### Q2: ZRC-20 代币和普通 ERC-20 有什么区别？

**A:** ZRC-20 是 ZetaChain 的跨链代币标准：
- 🔄 **跨链原生**：可以在任意链之间转移
- 🏦 **统一流动性**：所有链上的同种资产共享流动性
- ⚡ **即时结算**：无需等待桥接确认
- 🛡️ **安全性高**：由 ZetaChain 验证者网络保护

### Q3: 跨链支付的费用结构是什么？

**A:** 费用包含三部分：
1. **平台费用**: 2.5% (可配置)
2. **ZetaChain Gas 费**: ~$2-5 USD
3. **目标链 Gas 费**: 由 ZetaChain 代付

### Q4: 跨链支付需要多长时间？

**A:** 通常情况下：
- **ZetaChain 确认**: 2-5 秒
- **跨链处理**: 1-3 分钟
- **目标链确认**: 取决于目标链的出块时间

### Q5: 如果跨链支付失败怎么办？

**A:** ZetaChain 提供多重保障：
- 🔄 **自动重试**: 失败时自动重试
- 💰 **资金安全**: 失败时资金自动退回
- 📊 **状态追踪**: 实时查询支付状态
- 🛠️ **手动干预**: 极端情况下可手动处理

### Q6: 如何添加新的支持链？

**A:** 需要以下步骤：
1. 在 ZetaChain 上配置新链支持
2. 部署目标链接收合约
3. 更新前端配置
4. 测试跨链功能

### Q7: 生产环境部署注意事项？

**A:** 重要检查清单：
- ✅ 使用 ZetaChain 主网合约地址
- ✅ 配置正确的目标链合约
- ✅ 设置合理的费率和限额
- ✅ 实施监控和告警
- ✅ 准备应急处理方案

---

## 总结

通过集成 ZetaChain，WhichWitch 平台实现了真正的跨链支付功能：

🎯 **用户体验提升**
- 用户无需切换网络或桥接资产
- 支持从任意链向任意链支付
- 统一的支付界面和流程

🔧 **技术架构优化**
- 基于 ZRC-20 标准的统一资产管理
- 智能合约自动处理跨链逻辑
- 实时状态追踪和错误处理

💰 **商业价值增强**
- 扩大用户覆盖面（支持多链用户）
- 降低支付摩擦（无需桥接）
- 增加平台收入（跨链支付费用）

接下来你可以：
1. 按照指南部署 ZetaChain 合约
2. 集成前端跨链支付功能
3. 进行充分的测试
4. 逐步上线到生产环境

有任何问题都可以随时询问！