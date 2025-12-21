// 测试余额显示组件
// 可以用来验证ProfileView中的余额显示逻辑

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet } from 'lucide-react';

export function TestBalanceDisplay() {
  const [balance, setBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);

  // 模拟不同的余额值来测试显示
  const testBalances = [
    "0",           // 零余额
    "0.000001",    // 很小的余额
    "0.0001",      // 小余额
    "0.01",        // 中等余额
    "1.5",         // 正常余额
    "123.456789",  // 大余额
  ];

  const loadBalance = async (testBalance?: string) => {
    setLoadingBalance(true);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (testBalance !== undefined) {
      setBalance(testBalance);
    } else {
      // 模拟实际的合约调用
      try {
        // 这里应该是实际的getCreatorRevenue调用
        // const revenue = await getCreatorRevenue(address);
        // setBalance(formatEther(revenue));
        
        // 暂时使用随机值
        const randomBalance = (Math.random() * 10).toFixed(6);
        setBalance(randomBalance);
      } catch (error) {
        console.error("Error loading balance:", error);
        setBalance("0");
      }
    }
    
    setLoadingBalance(false);
  };

  const formatBalance = (balance: string) => {
    const bal = parseFloat(balance);
    if (bal === 0) return '0 ETH';
    if (bal < 0.0001) return `${bal.toExponential(4)} ETH`;
    if (bal < 0.01) return `${bal.toFixed(6)} ETH`;
    return `${bal.toFixed(4)} ETH`;
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">余额显示测试</h2>
      
      {/* 当前余额显示 */}
      <div className="flex items-center gap-4 bg-primary/5 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-primary/10 rounded-full text-primary">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Balance</p>
              <button
                onClick={() => loadBalance()}
                disabled={loadingBalance}
                className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xl font-mono font-bold">
              {loadingBalance ? "Loading..." : formatBalance(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* 测试按钮 */}
      <div className="space-y-2">
        <p className="text-sm font-medium">测试不同余额值:</p>
        <div className="grid grid-cols-2 gap-2">
          {testBalances.map((testBalance) => (
            <Button
              key={testBalance}
              variant="outline"
              size="sm"
              onClick={() => loadBalance(testBalance)}
              disabled={loadingBalance}
            >
              {testBalance} ETH
            </Button>
          ))}
        </div>
      </div>

      {/* 调试信息 */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
        <p><strong>当前余额值:</strong> {balance}</p>
        <p><strong>格式化显示:</strong> {formatBalance(balance)}</p>
        <p><strong>是否为零:</strong> {parseFloat(balance) === 0 ? '是' : '否'}</p>
      </div>
    </div>
  );
}