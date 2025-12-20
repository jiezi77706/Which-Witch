# 使用 Remix 重新部署智能合约

由于需要重新部署智能合约，最简单的方法是使用 Remix IDE。以下是完整的步骤：

## 1. 准备合约代码

### CreationManager.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }
    
    mapping(uint256 => Work) public works;
    mapping(address => uint256[]) public creatorWorks;
    mapping(uint256 => uint256[]) public derivatives;
    
    uint256 public nextWorkId = 1;
    address public authorizationManager;
    address public paymentManager;
    
    event WorkRegistered(
        uint256 indexed workId,
        address indexed creator,
        uint256 licenseFee,
        bool derivativeAllowed,
        string metadataURI,
        uint256 timestamp
    );
    
    function setAuthorizationManager(address _authorizationManager) external {
        authorizationManager = _authorizationManager;
    }
    
    function setPaymentManager(address _paymentManager) external {
        paymentManager = _paymentManager;
    }
    
    function registerOriginalWork(
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId) {
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            creator: msg.sender,
            parentId: 0,
            licenseFee: licenseFee,
            timestamp: block.timestamp,
            derivativeAllowed: derivativeAllowed,
            exists: true
        });
        
        creatorWorks[msg.sender].push(workId);
        
        emit WorkRegistered(workId, msg.sender, licenseFee, derivativeAllowed, metadataURI, block.timestamp);
    }
    
    function registerDerivativeWork(
        uint256 parentId,
        uint256 licenseFee,
        bool derivativeAllowed,
        string memory metadataURI
    ) external returns (uint256 workId) {
        require(works[parentId].exists, "Parent work does not exist");
        require(works[parentId].derivativeAllowed, "Derivatives not allowed for parent work");
        
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            creator: msg.sender,
            parentId: parentId,
            licenseFee: licenseFee,
            timestamp: block.timestamp,
            derivativeAllowed: derivativeAllowed,
            exists: true
        });
        
        creatorWorks[msg.sender].push(workId);
        derivatives[parentId].push(workId);
        
        emit WorkRegistered(workId, msg.sender, licenseFee, derivativeAllowed, metadataURI, block.timestamp);
    }
    
    function getWork(uint256 workId) external view returns (Work memory) {
        return works[workId];
    }
    
    function getWorksByCreator(address creator) external view returns (uint256[] memory) {
        return creatorWorks[creator];
    }
    
    function getDerivatives(uint256 parentId) external view returns (uint256[] memory) {
        return derivatives[parentId];
    }
    
    function getAncestorChain(uint256 workId) external view returns (address[] memory) {
        uint256 currentId = workId;
        address[] memory tempChain = new address[](100); // 临时数组
        uint256 count = 0;
        
        while (currentId != 0 && works[currentId].exists && count < 100) {
            tempChain[count] = works[currentId].creator;
            currentId = works[currentId].parentId;
            count++;
        }
        
        // 创建正确大小的数组
        address[] memory chain = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            chain[i] = tempChain[i];
        }
        
        return chain;
    }
}
```

### PaymentManager.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }
    
    function getWork(uint256 workId) external view returns (Work memory);
    function getAncestorChain(uint256 workId) external view returns (address[] memory);
}

contract PaymentManager {
    ICreationManager public creationManager;
    address public authorizationManager;
    address public platformWallet;
    
    mapping(address => uint256) public balances;
    mapping(uint256 => uint256) public totalRevenue;
    
    uint256 public constant PLATFORM_FEE_RATE = 500; // 5%
    uint256 public constant BASIS_POINTS = 10000;
    
    event PaymentProcessed(uint256 indexed workId, address indexed payer, uint256 amount);
    event TipReceived(address indexed creator, address indexed tipper, uint256 amount);
    event RevenueDistributed(uint256 indexed workId, address indexed creator, uint256 amount);
    event Withdrawal(address indexed creator, uint256 amount);
    
    constructor() {
        platformWallet = msg.sender;
    }
    
    function setCreationManager(address _creationManager) external {
        creationManager = ICreationManager(_creationManager);
    }
    
    function setAuthorizationManager(address _authorizationManager) external {
        authorizationManager = _authorizationManager;
    }
    
    function processPayment(uint256 workId) external payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        require(address(creationManager) != address(0), "CreationManager not set");
        
        ICreationManager.Work memory work = creationManager.getWork(workId);
        require(work.exists, "Work does not exist");
        
        // 分配收益
        _distributeRevenue(workId, work.creator, msg.value);
        
        emit PaymentProcessed(workId, msg.sender, msg.value);
    }
    
    function tipCreator(address creator) external payable {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(creator != address(0), "Invalid creator address");
        
        uint256 platformFee = (msg.value * PLATFORM_FEE_RATE) / BASIS_POINTS;
        uint256 creatorAmount = msg.value - platformFee;
        
        balances[creator] += creatorAmount;
        balances[platformWallet] += platformFee;
        
        emit TipReceived(creator, msg.sender, msg.value);
    }
    
    function _distributeRevenue(uint256 workId, address directCreator, uint256 amount) internal {
        uint256 platformFee = (amount * PLATFORM_FEE_RATE) / BASIS_POINTS;
        uint256 remainingAmount = amount - platformFee;
        
        // 获取祖先链
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        if (ancestors.length == 0) {
            // 没有祖先，全部给直接创作者
            balances[directCreator] += remainingAmount;
        } else {
            // 有祖先，按比例分配
            uint256 creatorShare = remainingAmount / 2; // 50% 给直接创作者
            uint256 ancestorShare = remainingAmount - creatorShare; // 50% 给祖先们
            
            balances[directCreator] += creatorShare;
            
            // 祖先们平分剩余部分
            uint256 perAncestor = ancestorShare / ancestors.length;
            for (uint256 i = 0; i < ancestors.length; i++) {
                balances[ancestors[i]] += perAncestor;
            }
        }
        
        balances[platformWallet] += platformFee;
        totalRevenue[workId] += amount;
        
        emit RevenueDistributed(workId, directCreator, amount);
    }
    
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, amount);
    }
    
    function getBalance(address creator) external view returns (uint256) {
        return balances[creator];
    }
    
    function getCreatorRevenue(address creator) external view returns (uint256) {
        return balances[creator];
    }
    
    function getTotalRevenue(uint256 workId) external view returns (uint256) {
        return totalRevenue[workId];
    }
    
    function calculateDistribution(uint256 workId, uint256 amount) external view returns (
        uint256 platformFee,
        uint256 creatorAmount,
        uint256 ancestorAmount
    ) {
        platformFee = (amount * PLATFORM_FEE_RATE) / BASIS_POINTS;
        uint256 remainingAmount = amount - platformFee;
        
        address[] memory ancestors = creationManager.getAncestorChain(workId);
        
        if (ancestors.length == 0) {
            creatorAmount = remainingAmount;
            ancestorAmount = 0;
        } else {
            creatorAmount = remainingAmount / 2;
            ancestorAmount = remainingAmount - creatorAmount;
        }
    }
    
    function withdrawPlatformFees() external {
        require(msg.sender == platformWallet, "Only platform wallet can withdraw fees");
        uint256 amount = balances[platformWallet];
        require(amount > 0, "No platform fees to withdraw");
        
        balances[platformWallet] = 0;
        payable(platformWallet).transfer(amount);
        
        emit Withdrawal(platformWallet, amount);
    }
}
```

### AuthorizationManager.sol
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICreationManager {
    struct Work {
        uint256 id;
        address creator;
        uint256 parentId;
        uint256 licenseFee;
        uint256 timestamp;
        bool derivativeAllowed;
        bool exists;
    }
    
    function getWork(uint256 workId) external view returns (Work memory);
}

interface IPaymentManager {
    function processPayment(uint256 workId) external payable;
}

contract AuthorizationManager {
    ICreationManager public creationManager;
    IPaymentManager public paymentManager;
    
    mapping(address => mapping(uint256 => uint256)) public authorizations;
    
    event AuthorizationGranted(address indexed user, uint256 indexed workId, uint256 timestamp);
    
    constructor() {}
    
    function setCreationManager(address _creationManager) external {
        creationManager = ICreationManager(_creationManager);
    }
    
    function setPaymentManager(address _paymentManager) external {
        paymentManager = IPaymentManager(_paymentManager);
    }
    
    function requestAuthorization(uint256 workId) external payable {
        require(address(creationManager) != address(0), "CreationManager not set");
        require(address(paymentManager) != address(0), "PaymentManager not set");
        
        ICreationManager.Work memory work = creationManager.getWork(workId);
        require(work.exists, "Work does not exist");
        require(msg.value >= work.licenseFee, "Insufficient payment for license fee");
        
        // 记录授权
        authorizations[msg.sender][workId] = block.timestamp;
        
        // 处理支付
        paymentManager.processPayment{value: msg.value}(workId);
        
        emit AuthorizationGranted(msg.sender, workId, block.timestamp);
    }
    
    function hasAuthorization(address user, uint256 workId) external view returns (bool) {
        return authorizations[user][workId] > 0;
    }
    
    function getAuthorizationTimestamp(address user, uint256 workId) external view returns (uint256) {
        return authorizations[user][workId];
    }
}
```

## 2. 使用 Remix 部署

### 步骤 1: 打开 Remix
访问 https://remix.ethereum.org/

### 步骤 2: 创建合约文件
1. 在 `contracts` 文件夹中创建三个文件：
   - `CreationManager.sol`
   - `PaymentManager.sol`
   - `AuthorizationManager.sol`
2. 将上面的代码分别复制到对应文件中

### 步骤 3: 编译合约
1. 点击 "Solidity Compiler" 标签
2. 选择编译器版本 `0.8.19`
3. 点击 "Compile" 按钮编译所有合约

### 步骤 4: 连接钱包
1. 点击 "Deploy & Run Transactions" 标签
2. 在 "Environment" 中选择 "Injected Provider - MetaMask"
3. 确保 MetaMask 连接到 Sepolia 测试网
4. 确保钱包有足够的 Sepolia ETH

### 步骤 5: 部署合约
按以下顺序部署：

1. **部署 CreationManager**
   - 选择 `CreationManager` 合约
   - 点击 "Deploy"
   - 记录合约地址

2. **部署 PaymentManager**
   - 选择 `PaymentManager` 合约
   - 点击 "Deploy"
   - 记录合约地址

3. **部署 AuthorizationManager**
   - 选择 `AuthorizationManager` 合约
   - 点击 "Deploy"
   - 记录合约地址

### 步骤 6: 配置合约关联
部署完成后，需要配置合约间的关联：

1. **配置 CreationManager**
   - 调用 `setPaymentManager(PaymentManager地址)`
   - 调用 `setAuthorizationManager(AuthorizationManager地址)`

2. **配置 PaymentManager**
   - 调用 `setCreationManager(CreationManager地址)`
   - 调用 `setAuthorizationManager(AuthorizationManager地址)`

3. **配置 AuthorizationManager**
   - 调用 `setCreationManager(CreationManager地址)`
   - 调用 `setPaymentManager(PaymentManager地址)`

## 3. 更新环境配置

部署完成后，更新 `.env.local` 文件：

```bash
# 更新这三个地址为新部署的合约地址
NEXT_PUBLIC_CONTRACT_ADDRESS_CREATION=新的CreationManager地址
NEXT_PUBLIC_CONTRACT_ADDRESS_PAYMENT=新的PaymentManager地址
NEXT_PUBLIC_CONTRACT_ADDRESS_AUTHORIZATION=新的AuthorizationManager地址
```

## 4. 验证部署

运行验证脚本：
```bash
node scripts/testing/diagnose-contract-issues.js
```

应该看到所有地址匹配为 `true`。

## 5. 测试功能

重启应用程序后，测试：
1. 二创支付授权费功能
2. 作品打赏功能

这样就完成了智能合约的重新部署和配置！