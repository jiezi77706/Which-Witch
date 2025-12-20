'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { ethers } from 'ethers'

export default function ZetaTestPage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const [zetaBalance, setZetaBalance] = useState<string>('0')
  const [sepoliaBalance, setSepoliaBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)

  // 网络配置
  const ZETA_CHAIN_ID = 7001
  const SEPOLIA_CHAIN_ID = 11155111
  const isOnZetaChain = chainId === ZETA_CHAIN_ID
  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID

  // 检查余额
  useEffect(() => {
    if (address && isConnected) {
      checkBalances()
    }
  }, [address, isConnected, chainId])

  const checkBalances = async () => {
    if (!address) return

    setIsLoading(true)
    try {
      // 使用 ethers.js 检查实际余额
      if (isOnZetaChain) {
        const provider = new (window as any).ethereum ? 
          new ethers.BrowserProvider((window as any).ethereum) : null
        
        if (provider) {
          const balance = await provider.getBalance(address)
          setZetaBalance(ethers.formatEther(balance))
        } else {
          setZetaBalance('请连接 MetaMask')
        }
      } else {
        setZetaBalance('请切换到 ZetaChain')
      }
      
      if (isOnSepolia) {
        const provider = new (window as any).ethereum ? 
          new ethers.BrowserProvider((window as any).ethereum) : null
        
        if (provider) {
          const balance = await provider.getBalance(address)
          setSepoliaBalance(ethers.formatEther(balance))
        } else {
          setSepoliaBalance('请连接 MetaMask')
        }
      } else {
        setSepoliaBalance('请切换到 Sepolia 查看')
      }
      
    } catch (error) {
      console.error('检查余额失败:', error)
      setZetaBalance('检查失败')
      setSepoliaBalance('检查失败')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const switchToZetaChain = async () => {
    try {
      await switchChain({ chainId: ZETA_CHAIN_ID })
      toast.success('已切换到 ZetaChain 网络')
    } catch (error) {
      toast.error('切换网络失败，请手动在 MetaMask 中切换')
    }
  }

  const openZetaLabs = () => {
    window.open('https://labs.zetachain.com/', '_blank')
  }

  const openZetaFaucet = () => {
    window.open('https://labs.zetachain.com/get-zeta', '_blank')
  }

  const openSepoliaFaucet = () => {
    window.open('https://sepoliafaucet.com/', '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">ZetaChain 跨链测试</h1>
        <p className="text-gray-600">
          使用你现有的 ZETA 和 Sepolia 测试币体验跨链功能
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：钱包和网络状态 */}
        <div className="space-y-6">
          {/* 钱包连接 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                钱包状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">地址:</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(address || '')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">当前网络:</span>
                    <Badge variant={isOnZetaChain ? "default" : isOnSepolia ? "secondary" : "outline"}>
                      {isOnZetaChain ? "ZetaChain" : isOnSepolia ? "Sepolia" : `Chain ${chainId}`}
                    </Badge>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => disconnect()}
                    className="w-full"
                  >
                    断开连接
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      variant="outline"
                      onClick={() => connect({ connector })}
                      className="w-full"
                    >
                      连接 {connector.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 余额显示 */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>余额状态</CardTitle>
                <CardDescription>
                  你的测试代币余额
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ZetaChain ZETA:</span>
                    <span className="font-mono text-sm">{zetaBalance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sepolia ETH:</span>
                    <span className="font-mono text-sm">{sepoliaBalance}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkBalances}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? '检查中...' : '刷新余额'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 网络切换 */}
          {isConnected && !isOnZetaChain && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                需要切换到 ZetaChain 网络才能进行跨链操作
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToZetaChain}
                  className="ml-2"
                >
                  切换网络
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 右侧：测试功能 */}
        <div className="space-y-6">
          {/* 官方测试应用 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                官方跨链测试
              </CardTitle>
              <CardDescription>
                使用 ZetaChain 官方应用体验跨链功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={openZetaLabs}
                  className="w-full justify-between"
                >
                  ZetaChain Labs 测试应用
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <p className="text-sm text-gray-600">
                  在官方应用中，你可以：
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 体验跨链转账</li>
                  <li>• 测试跨链 Swap</li>
                  <li>• 查看交易状态</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 获取测试代币 */}
          <Card>
            <CardHeader>
              <CardTitle>获取测试代币</CardTitle>
              <CardDescription>
                如果余额不足，可以从水龙头获取
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={openZetaFaucet}
                  className="w-full justify-between"
                >
                  ZETA 测试币水龙头
                  <ExternalLink className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={openSepoliaFaucet}
                  className="w-full justify-between"
                >
                  Sepolia ETH 水龙头
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 测试步骤 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                测试步骤
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">连接钱包</p>
                    <p className="text-gray-600">确保钱包已连接</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">切换到 ZetaChain</p>
                    <p className="text-gray-600">在 MetaMask 中切换网络</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">访问官方测试应用</p>
                    <p className="text-gray-600">体验跨链转账功能</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">观察跨链过程</p>
                    <p className="text-gray-600">通常需要 1-3 分钟</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>提示：</strong> 这是一个测试页面，帮助你体验 ZetaChain 跨链功能。
            成功测试后，你就可以理解如何在 WhichWitch 平台中集成跨链支付了。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}