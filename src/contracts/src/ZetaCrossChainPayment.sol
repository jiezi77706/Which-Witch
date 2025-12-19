// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ZetaChain官方接口
interface IZRC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function deposit(address to, uint256 amount) external returns (bool);
    function withdraw(bytes memory to, uint256 amount) external returns (bool);
    function withdrawGasFee() external view returns (address, uint256);
    function PROTOCOL_FEE() external view returns (uint256);
}

interface IZetaConnector {
    function send(ZetaInterfaces.SendInput calldata input) external;
}

library ZetaInterfaces {
    struct SendInput {
        uint256 destinationChainId;
        bytes destinationAddress;
        uint256 destinationGasLimit;
        bytes message;
        uint256 zetaValueAndGas;
        bytes zetaParams;
    }
}

/**
 * @title ZetaCrossChainPayment
 * @notice ZetaChain跨链支付合约 - 基于官方ZRC20标准
 * @dev 处理打赏、授权费、NFT购买等跨链支付，部署在ZetaChain
 */
contract ZetaCrossChainPayment is Ownable, ReentrancyGuard {
    
    // ============================================
    // 数据结构
    // ============================================
    
    // 支付类型
    enum PaymentType {
        TIP,           // 打赏
        LICENSE_FEE,   // 授权费
        NFT_PURCHASE   // NFT购买
    }
    
    // 跨链支付记录
    struct CrossChainPayment {
        uint256 paymentId;
        address sender;
        address recipient;
        uint256 amount;
        PaymentType paymentType;
        uint256 workId;
        uint256 sourceChainId;
        uint256 targetChainId;
        string sourceCurrency;
        bool completed;
        uint256 timestamp;
    }
    
    // 支持的链信息
    struct ChainInfo {
        bool supported;
        address targetContract; // 目标链上的接收合约
        uint256 minAmount;      // 最小支付金额
        uint256 maxAmount;      // 最大支付金额
    }
    
    // ============================================
    // 状态变量
    // ============================================
    
    // 支付记录
    mapping(uint256 => CrossChainPayment) public payments;
    mapping(address => uint256[]) public userPayments;
    uint256 public nextPaymentId = 1;
    
    // 支持的链配置
    mapping(uint256 => ChainInfo) public supportedChains;
    
    // 支持的币种
    mapping(string => bool) public supportedCurrencies;
    
    // ZetaChain官方合约地址
    IZetaConnector public zetaConnector;
    
    // ZRC20代币地址映射 (chainId => ZRC20 address)
    mapping(uint256 => address) public zrc20Tokens;
    
    // 支持的ZRC20代币
    mapping(address => bool) public supportedZRC20;
    
    // 授权的中继器
    mapping(address => bool) public authorizedRelayers;
    
    // 平台费率（基点，10000 = 100%）
    uint256 public platformFeeRate = 250; // 2.5%
    
    // 平台收益（按币种分别记录）
    mapping(string => uint256) public platformBalances;
    
    // ============================================
    // 事件
    // ============================================
    
    event CrossChainPaymentInitiated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        PaymentType paymentType,
        uint256 workId,
        uint256 sourceChainId,
        uint256 targetChainId,
        string sourceCurrency
    );
    
    event CrossChainPaymentCompleted(
        uint256 indexed paymentId,
        bool success,
        string reason
    );
    
    event ChainConfigured(
        uint256 indexed chainId,
        bool supported,
        address targetContract,
        uint256 minAmount,
        uint256 maxAmount
    );
    
    event CurrencyConfigured(
        string currency,
        bool supported
    );
    
    // ============================================
    // 修饰符
    // ============================================
    
    modifier onlyAuthorizedRelayer() {
        require(authorizedRelayers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    // ============================================
    // 构造函数
    // ============================================
    
    constructor(address _zetaConnector) Ownable(msg.sender) {
        require(_zetaConnector != address(0), "Invalid ZetaConnector");
        zetaConnector = IZetaConnector(_zetaConnector);
        
        // 初始化支持的链
        _configureChain(1, true, address(0), 0.001 ether, 100 ether);     // Ethereum
        _configureChain(56, true, address(0), 0.001 ether, 100 ether);    // BSC
        _configureChain(137, true, address(0), 0.001 ether, 100 ether);   // Polygon
        _configureChain(8453, true, address(0), 0.001 ether, 100 ether);  // Base
        _configureChain(11155111, true, address(0), 0.001 ether, 100 ether); // Sepolia
        
        // 初始化ZRC20代币地址 (ZetaChain Athens测试网)
        zrc20Tokens[1] = 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921;      // ETH.ETH
        zrc20Tokens[56] = 0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb;     // BNB.BSC
        zrc20Tokens[137] = 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921;    // MATIC.MATIC
        zrc20Tokens[8453] = 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921;   // ETH.BASE
        zrc20Tokens[11155111] = 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921; // ETH.SEP
        
        // 标记支持的ZRC20代币
        supportedZRC20[0x91d18e54DAf4F677cB28167158d6dd21F6aB3921] = true; // ETH
        supportedZRC20[0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb] = true; // BNB
        
        // 初始化支持的币种
        supportedCurrencies["ETH"] = true;
        supportedCurrencies["BTC"] = true;
        supportedCurrencies["USDC"] = true;
        supportedCurrencies["USDT"] = true;
        supportedCurrencies["BNB"] = true;
        supportedCurrencies["MATIC"] = true;
        supportedCurrencies["ZETA"] = true;
    }
    
    // ============================================
    // 跨链支付功能
    // ============================================
    
    /**
     * @notice 发起跨链打赏 (使用ZRC20代币)
     * @param recipient 接收者地址
     * @param workId 作品ID
     * @param targetChainId 目标链ID
     * @param zrc20Token ZRC20代币地址
     * @param amount 代币数量
     */
    function initiateCrossChainTip(
        address recipient,
        uint256 workId,
        uint256 targetChainId,
        address zrc20Token,
        uint256 amount
    ) external nonReentrant returns (uint256 paymentId) {
        return _initiateCrossChainPaymentZRC20(
            recipient,
            workId,
            targetChainId,
            zrc20Token,
            amount,
            PaymentType.TIP
        );
    }
    
    /**
     * @notice 发起跨链打赏 (使用原生ZETA)
     * @param recipient 接收者地址
     * @param workId 作品ID
     * @param targetChainId 目标链ID
     */
    function initiateCrossChainTipZeta(
        address recipient,
        uint256 workId,
        uint256 targetChainId
    ) external payable nonReentrant returns (uint256 paymentId) {
        return _initiateCrossChainPaymentZeta(
            recipient,
            workId,
            targetChainId,
            msg.value,
            PaymentType.TIP
        );
    }
    
    /**
     * @notice 发起跨链授权费支付 (使用ZRC20代币)
     */
    function initiateCrossChainLicenseFee(
        address recipient,
        uint256 workId,
        uint256 targetChainId,
        address zrc20Token,
        uint256 amount
    ) external nonReentrant returns (uint256 paymentId) {
        return _initiateCrossChainPaymentZRC20(
            recipient,
            workId,
            targetChainId,
            zrc20Token,
            amount,
            PaymentType.LICENSE_FEE
        );
    }
    
    /**
     * @notice 发起跨链授权费支付 (使用原生ZETA)
     */
    function initiateCrossChainLicenseFeeZeta(
        address recipient,
        uint256 workId,
        uint256 targetChainId
    ) external payable nonReentrant returns (uint256 paymentId) {
        return _initiateCrossChainPaymentZeta(
            recipient,
            workId,
            targetChainId,
            msg.value,
            PaymentType.LICENSE_FEE
        );
    }
    
    /**
     * @notice 发起跨链NFT购买 (使用ZRC20代币)
     */
    function initiateCrossChainNFTPurchase(
        address recipient,
        uint256 workId,
        uint256 targetChainId,
        address zrc20Token,
        uint256 amount
    ) external nonReentrant returns (uint256 paymentId) {
        return _initiateCrossChainPaymentZRC20(
            recipient,
            workId,
            targetChainId,
            zrc20Token,
            amount,
            PaymentType.NFT_PURCHASE
        );
    }
    
    /**
     * @notice 发起跨链NFT购买 (使用原生ZETA)
     */
    function initiateCrossChainNFTPurchaseZeta(
        address recipient,
        uint256 workId,
        uint256 targetChainId
    ) external payable nonReentrant returns (uint256 paymentId) {
        return _initiateCrossChainPaymentZeta(
            recipient,
            workId,
            targetChainId,
            msg.value,
            PaymentType.NFT_PURCHASE
        );
    }
    
    // ============================================
    // 内部函数
    // ============================================
    
    /**
     * @notice 内部函数：使用ZRC20代币发起跨链支付
     */
    function _initiateCrossChainPaymentZRC20(
        address recipient,
        uint256 workId,
        uint256 targetChainId,
        address zrc20Token,
        uint256 amount,
        PaymentType paymentType
    ) internal returns (uint256 paymentId) {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(supportedChains[targetChainId].supported, "Chain not supported");
        require(supportedZRC20[zrc20Token], "ZRC20 token not supported");
        
        ChainInfo storage chainInfo = supportedChains[targetChainId];
        require(amount >= chainInfo.minAmount, "Amount below minimum");
        require(amount <= chainInfo.maxAmount, "Amount above maximum");
        
        // 转移ZRC20代币到合约
        IZRC20(zrc20Token).transferFrom(msg.sender, address(this), amount);
        
        // 创建支付记录
        paymentId = nextPaymentId++;
        
        payments[paymentId] = CrossChainPayment({
            paymentId: paymentId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            paymentType: paymentType,
            workId: workId,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            sourceCurrency: _getTokenSymbol(zrc20Token),
            completed: false,
            timestamp: block.timestamp
        });
        
        userPayments[msg.sender].push(paymentId);
        
        emit CrossChainPaymentInitiated(
            paymentId,
            msg.sender,
            recipient,
            amount,
            paymentType,
            workId,
            block.chainid,
            targetChainId,
            _getTokenSymbol(zrc20Token)
        );
        
        // 处理跨链支付
        _processCrossChainPaymentZRC20(paymentId, zrc20Token);
    }
    
    /**
     * @notice 内部函数：使用原生ZETA发起跨链支付
     */
    function _initiateCrossChainPaymentZeta(
        address recipient,
        uint256 workId,
        uint256 targetChainId,
        uint256 amount,
        PaymentType paymentType
    ) internal returns (uint256 paymentId) {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(supportedChains[targetChainId].supported, "Chain not supported");
        
        ChainInfo storage chainInfo = supportedChains[targetChainId];
        require(amount >= chainInfo.minAmount, "Amount below minimum");
        require(amount <= chainInfo.maxAmount, "Amount above maximum");
        
        // 创建支付记录
        paymentId = nextPaymentId++;
        
        payments[paymentId] = CrossChainPayment({
            paymentId: paymentId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            paymentType: paymentType,
            workId: workId,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            sourceCurrency: "ZETA",
            completed: false,
            timestamp: block.timestamp
        });
        
        userPayments[msg.sender].push(paymentId);
        
        emit CrossChainPaymentInitiated(
            paymentId,
            msg.sender,
            recipient,
            amount,
            paymentType,
            workId,
            block.chainid,
            targetChainId,
            "ZETA"
        );
        
        // 处理跨链支付
        _processCrossChainPaymentZeta(paymentId);
    }
    
    /**
     * @notice 处理ZRC20代币跨链支付
     */
    function _processCrossChainPaymentZRC20(uint256 paymentId, address zrc20Token) internal {
        CrossChainPayment storage payment = payments[paymentId];
        
        // 计算平台费用
        uint256 platformFee = (payment.amount * platformFeeRate) / 10000;
        uint256 netAmount = payment.amount - platformFee;
        
        // 记录平台费用
        platformBalances[payment.sourceCurrency] += platformFee;
        
        if (payment.targetChainId == block.chainid) {
            // 同链支付，直接转账ZRC20代币
            IZRC20(zrc20Token).transfer(payment.recipient, netAmount);
            payment.completed = true;
            emit CrossChainPaymentCompleted(paymentId, true, "Direct ZRC20 transfer");
        } else {
            // 跨链支付，使用ZRC20 withdraw功能
            bytes memory recipientBytes = abi.encodePacked(payment.recipient);
            bool success = IZRC20(zrc20Token).withdraw(recipientBytes, netAmount);
            
            payment.completed = success;
            emit CrossChainPaymentCompleted(
                paymentId, 
                success, 
                success ? "ZRC20 cross-chain withdraw" : "ZRC20 withdraw failed"
            );
        }
    }
    
    /**
     * @notice 处理原生ZETA跨链支付
     */
    function _processCrossChainPaymentZeta(uint256 paymentId) internal {
        CrossChainPayment storage payment = payments[paymentId];
        
        // 计算平台费用
        uint256 platformFee = (payment.amount * platformFeeRate) / 10000;
        uint256 netAmount = payment.amount - platformFee;
        
        // 记录平台费用
        platformBalances[payment.sourceCurrency] += platformFee;
        
        if (payment.targetChainId == block.chainid) {
            // 同链支付，直接转账
            (bool success,) = payable(payment.recipient).call{value: netAmount}("");
            payment.completed = success;
            emit CrossChainPaymentCompleted(paymentId, success, "Direct ZETA transfer");
        } else {
            // 跨链支付，使用ZetaConnector
            _executeZetaConnectorPayment(paymentId, netAmount);
        }
    }
    
    /**
     * @notice 执行ZetaConnector跨链支付
     */
    function _executeZetaConnectorPayment(uint256 paymentId, uint256 amount) internal {
        CrossChainPayment storage payment = payments[paymentId];
        ChainInfo storage chainInfo = supportedChains[payment.targetChainId];
        
        // 构建跨链消息
        bytes memory message = abi.encode(
            payment.paymentId,
            payment.sender,
            payment.recipient,
            amount,
            payment.paymentType,
            payment.workId,
            payment.sourceCurrency
        );
        
        // 使用ZetaConnector发送跨链消息
        try zetaConnector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: payment.targetChainId,
                destinationAddress: chainInfo.targetContract != address(0) 
                    ? abi.encodePacked(chainInfo.targetContract)
                    : abi.encodePacked(payment.recipient),
                destinationGasLimit: 500000, // 目标链gas限制
                message: message,
                zetaValueAndGas: amount,
                zetaParams: ""
            })
        ) {
            payment.completed = true;
            emit CrossChainPaymentCompleted(paymentId, true, "ZetaConnector message sent");
        } catch (bytes memory reason) {
            emit CrossChainPaymentCompleted(
                paymentId, 
                false, 
                string(abi.encodePacked("ZetaConnector failed: ", reason))
            );
        }
    }
    
    /**
     * @notice 获取代币符号
     */
    function _getTokenSymbol(address zrc20Token) internal pure returns (string memory) {
        // 根据ZRC20代币地址返回符号
        if (zrc20Token == 0x91d18e54DAf4F677cB28167158d6dd21F6aB3921) return "ETH";
        if (zrc20Token == 0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb) return "BNB";
        return "UNKNOWN";
    }
    
    // ============================================
    // 查询功能
    // ============================================
    
    /**
     * @notice 获取支付信息
     */
    function getPayment(uint256 paymentId) external view returns (CrossChainPayment memory) {
        return payments[paymentId];
    }
    
    /**
     * @notice 获取用户支付记录
     */
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPayments[user];
    }
    
    /**
     * @notice 获取链配置信息
     */
    function getChainInfo(uint256 chainId) external view returns (ChainInfo memory) {
        return supportedChains[chainId];
    }
    
    /**
     * @notice 检查币种是否支持
     */
    function isCurrencySupported(string memory currency) external view returns (bool) {
        return supportedCurrencies[currency];
    }
    
    /**
     * @notice 获取平台在某币种的收益
     */
    function getPlatformBalance(string memory currency) external view returns (uint256) {
        return platformBalances[currency];
    }
    
    // ============================================
    // 管理员功能
    // ============================================
    
    /**
     * @notice 配置支持的链
     */
    function configureChain(
        uint256 chainId,
        bool supported,
        address targetContract,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyOwner {
        _configureChain(chainId, supported, targetContract, minAmount, maxAmount);
    }
    
    function _configureChain(
        uint256 chainId,
        bool supported,
        address targetContract,
        uint256 minAmount,
        uint256 maxAmount
    ) internal {
        require(minAmount <= maxAmount, "Invalid amount range");
        
        supportedChains[chainId] = ChainInfo({
            supported: supported,
            targetContract: targetContract,
            minAmount: minAmount,
            maxAmount: maxAmount
        });
        
        emit ChainConfigured(chainId, supported, targetContract, minAmount, maxAmount);
    }
    
    /**
     * @notice 添加ZRC20代币支持
     */
    function addZRC20Support(
        uint256 chainId,
        address zrc20Token,
        string memory symbol
    ) external onlyOwner {
        require(zrc20Token != address(0), "Invalid ZRC20 address");
        
        zrc20Tokens[chainId] = zrc20Token;
        supportedZRC20[zrc20Token] = true;
        supportedCurrencies[symbol] = true;
        
        emit CurrencyConfigured(symbol, true);
    }
    
    /**
     * @notice 配置支持的币种
     */
    function configureCurrency(string memory currency, bool supported) external onlyOwner {
        supportedCurrencies[currency] = supported;
        emit CurrencyConfigured(currency, supported);
    }
    
    /**
     * @notice 设置平台费率
     */
    function setPlatformFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 1000, "Fee rate too high"); // 最高10%
        platformFeeRate = _feeRate;
    }
    
    /**
     * @notice 授权中继器
     */
    function authorizeRelayer(address relayer, bool authorized) external onlyOwner {
        authorizedRelayers[relayer] = authorized;
    }
    
    /**
     * @notice 设置ZetaChain连接器
     */
    function setZetaConnector(address _zetaConnector) external onlyOwner {
        require(_zetaConnector != address(0), "Invalid connector");
        zetaConnector = IZetaConnector(_zetaConnector);
    }
    
    /**
     * @notice 提取平台费用
     */
    function withdrawPlatformFees(string memory currency) external onlyOwner {
        uint256 balance = platformBalances[currency];
        require(balance > 0, "No fees to withdraw");
        
        platformBalances[currency] = 0;
        
        (bool success,) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice 紧急提取
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        
        (bool success,) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
}