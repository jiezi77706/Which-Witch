'use client'

// 汇率服务 - 处理不同代币之间的汇率转换
export class ExchangeRateService {
  
  // 模拟的汇率数据 (实际应该从API获取)
  private static readonly MOCK_RATES = {
    // 相对于 ETH 的汇率
    'ETH': 1.0,
    'BNB': 0.15,    // 1 BNB ≈ 0.15 ETH
    'MATIC': 0.0004, // 1 MATIC ≈ 0.0004 ETH
    'ZETA': 0.0003   // 1 ZETA ≈ 0.0003 ETH (ZETA价格较低)
  }

  /**
   * 获取代币相对于ETH的汇率
   */
  static async getExchangeRate(fromToken: string, toToken: string = 'ETH'): Promise<number> {
    try {
      // 在实际应用中，这里应该调用真实的价格API
      // 比如 CoinGecko, CoinMarketCap, 或者 DEX 的价格预言机
      
      const fromRate = this.MOCK_RATES[fromToken as keyof typeof this.MOCK_RATES] || 1
      const toRate = this.MOCK_RATES[toToken as keyof typeof this.MOCK_RATES] || 1
      
      return fromRate / toRate
    } catch (error) {
      console.error('Failed to get exchange rate:', error)
      // 返回默认汇率，避免支付失败
      return this.MOCK_RATES[fromToken as keyof typeof this.MOCK_RATES] || 1
    }
  }

  /**
   * 将源代币金额转换为目标代币金额
   */
  static async convertAmount(
    amount: string, 
    fromToken: string, 
    toToken: string = 'ETH'
  ): Promise<string> {
    const rate = await this.getExchangeRate(fromToken, toToken)
    const amountNum = parseFloat(amount)
    const convertedAmount = amountNum * rate
    
    return convertedAmount.toFixed(6)
  }

  /**
   * 计算跨链支付所需的源代币数量
   * 考虑汇率和跨链费用，确保创作者收到足够的金额
   */
  static async calculateRequiredAmount(
    targetAmount: string,  // 创作者需要收到的ETH数量
    sourceToken: string,   // 用户支付的代币类型
    crossChainFeeRate: number = 0.025 // 跨链费用率
  ): Promise<{
    requiredSourceAmount: string    // 用户需要支付的源代币数量
    crossChainFee: string          // 跨链费用 (源代币)
    networkFee: string             // 网络费用 (源代币)
    totalRequired: string          // 总计需要支付 (源代币)
    finalETHAmount: string         // 创作者最终收到的ETH
  }> {
    try {
      const targetAmountNum = parseFloat(targetAmount)
      
      // 获取汇率 (源代币 -> ETH)
      const exchangeRate = await this.getExchangeRate(sourceToken, 'ETH')
      
      // 计算基础所需的源代币数量 (不考虑费用)
      const baseSourceAmount = targetAmountNum / exchangeRate
      
      // 计算跨链费用 (源代币)
      const crossChainFee = baseSourceAmount * crossChainFeeRate
      
      // 网络费用 (固定，转换为源代币)
      const networkFeeETH = 0.002 // 固定的网络费用 (ETH)
      const networkFee = networkFeeETH / exchangeRate
      
      // 为了确保创作者收到足够的金额，我们需要额外支付费用
      // 总所需 = 目标金额 + 跨链费用 + 网络费用
      const requiredSourceAmount = baseSourceAmount + crossChainFee + networkFee
      const totalRequired = requiredSourceAmount
      
      // 验证：计算创作者实际收到的ETH
      const grossETH = (requiredSourceAmount - networkFee) * exchangeRate
      const finalETHAmount = grossETH - (grossETH * crossChainFeeRate)
      
      return {
        requiredSourceAmount: requiredSourceAmount.toFixed(6),
        crossChainFee: crossChainFee.toFixed(6),
        networkFee: networkFee.toFixed(6),
        totalRequired: totalRequired.toFixed(6),
        finalETHAmount: finalETHAmount.toFixed(6)
      }
    } catch (error) {
      console.error('Failed to calculate required amount:', error)
      throw new Error('Failed to calculate payment amount')
    }
  }

  /**
   * 获取实时价格 (模拟)
   */
  static async getRealTimePrice(token: string): Promise<{
    price: number
    currency: string
    lastUpdated: Date
  }> {
    // 模拟价格数据
    const prices = {
      'ETH': 2500,
      'BNB': 380,
      'MATIC': 1.2,
      'ZETA': 0.8
    }

    return {
      price: prices[token as keyof typeof prices] || 0,
      currency: 'USD',
      lastUpdated: new Date()
    }
  }

  /**
   * 验证支付金额是否足够
   */
  static async validatePaymentAmount(
    userAmount: string,
    requiredAmount: string,
    token: string
  ): Promise<{
    isValid: boolean
    shortage?: string
    message: string
  }> {
    const userAmountNum = parseFloat(userAmount)
    const requiredAmountNum = parseFloat(requiredAmount)
    
    if (userAmountNum >= requiredAmountNum) {
      return {
        isValid: true,
        message: 'Payment amount is sufficient'
      }
    } else {
      const shortage = (requiredAmountNum - userAmountNum).toFixed(6)
      return {
        isValid: false,
        shortage,
        message: `Insufficient amount. Need ${shortage} more ${token}`
      }
    }
  }
}