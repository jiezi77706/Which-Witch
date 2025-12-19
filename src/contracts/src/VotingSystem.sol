// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWorkRegistry {
    function validateWorkCreator(uint256 workId, address user) external view returns (bool);
}

/**
 * @title VotingSystem
 * @notice 投票系统合约 - 部署在Sepolia
 * @dev 作品创作者发起投票，用户质押Sepolia ETH参与投票
 */
contract VotingSystem is Ownable, ReentrancyGuard {
    
    // ============================================
    // 数据结构
    // ============================================
    
    // 投票状态
    enum VotingStatus {
        ACTIVE,     // 进行中
        ENDED,      // 已结束
        CANCELLED   // 已取消
    }
    
    // 投票类型
    enum VotingType {
        CHARACTER_DESIGN,  // 角色设计
        STORY_SETTING,     // 故事设定
        PLOT_DIRECTION,    // 情节走向
        ART_STYLE,         // 艺术风格
        COLOR_SCHEME,      // 配色方案
        MUSIC_STYLE,       // 音乐风格
        OTHER              // 其他
    }
    
    // 投票信息
    struct Voting {
        uint256 votingId;
        uint256 workId;
        address creator;
        string title;
        string description;
        VotingType votingType;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        uint256 totalStaked;  // 总质押ETH数量
        VotingStatus status;
        uint256 minStakeAmount; // 最小质押金额
    }
    
    // 用户投票记录
    struct VoteRecord {
        uint256 optionId;
        uint256 stakedAmount;
        bool hasVoted;
        bool hasWithdrawn; // 是否已提取质押
    }
    
    // ============================================
    // 状态变量
    // ============================================
    
    // WorkRegistry合约
    IWorkRegistry public workRegistry;
    
    // 投票存储
    mapping(uint256 => Voting) public votings;
    mapping(uint256 => mapping(uint256 => uint256)) public optionVotes; // votingId => optionId => 票数
    mapping(uint256 => mapping(address => VoteRecord)) public userVotes; // votingId => user => 投票记录
    mapping(uint256 => address[]) public votingParticipants; // votingId => 参与者列表
    
    // 计数器
    uint256 public nextVotingId = 1;
    
    // 配置参数
    uint256 public minVotingDuration = 1 hours;   // 最小投票时长
    uint256 public maxVotingDuration = 30 days;   // 最大投票时长
    uint256 public defaultMinStake = 0.001 ether; // 默认最小质押金额
    
    // ============================================
    // 事件
    // ============================================
    
    event VotingCreated(
        uint256 indexed votingId,
        uint256 indexed workId,
        address indexed creator,
        string title,
        VotingType votingType,
        uint256 endTime,
        uint256 minStakeAmount
    );
    
    event VoteCast(
        uint256 indexed votingId,
        address indexed voter,
        uint256 optionId,
        uint256 stakedAmount
    );
    
    event VotingEnded(
        uint256 indexed votingId,
        uint256 winningOption,
        uint256 totalParticipants
    );
    
    event StakeWithdrawn(
        uint256 indexed votingId,
        address indexed voter,
        uint256 amount
    );
    
    // ============================================
    // 构造函数
    // ============================================
    
    constructor(address _workRegistry) Ownable(msg.sender) {
        require(_workRegistry != address(0), "Invalid work registry");
        workRegistry = IWorkRegistry(_workRegistry);
    }
    
    // ============================================
    // 投票创建功能
    // ============================================
    
    /**
     * @notice 创建投票（仅作品创作者）
     * @param workId 作品ID
     * @param title 投票标题
     * @param description 投票描述
     * @param votingType 投票类型
     * @param options 投票选项
     * @param duration 投票持续时间（秒）
     * @param minStakeAmount 最小质押金额
     */
    function createVoting(
        uint256 workId,
        string memory title,
        string memory description,
        VotingType votingType,
        string[] memory options,
        uint256 duration,
        uint256 minStakeAmount
    ) external returns (uint256 votingId) {
        // 验证作品创作者
        require(
            workRegistry.validateWorkCreator(workId, msg.sender),
            "Not work creator"
        );
        
        // 验证参数
        require(bytes(title).length > 0, "Title required");
        require(options.length >= 2, "At least 2 options required");
        require(options.length <= 10, "Too many options");
        require(duration >= minVotingDuration, "Duration too short");
        require(duration <= maxVotingDuration, "Duration too long");
        
        if (minStakeAmount == 0) {
            minStakeAmount = defaultMinStake;
        }
        
        // 创建投票
        votingId = nextVotingId++;
        
        votings[votingId] = Voting({
            votingId: votingId,
            workId: workId,
            creator: msg.sender,
            title: title,
            description: description,
            votingType: votingType,
            options: options,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            totalStaked: 0,
            status: VotingStatus.ACTIVE,
            minStakeAmount: minStakeAmount
        });
        
        emit VotingCreated(
            votingId,
            workId,
            msg.sender,
            title,
            votingType,
            block.timestamp + duration,
            minStakeAmount
        );
    }
    
    // ============================================
    // 投票参与功能
    // ============================================
    
    /**
     * @notice 投票（质押Sepolia ETH）
     * @param votingId 投票ID
     * @param optionId 选项ID
     */
    function vote(uint256 votingId, uint256 optionId) external payable nonReentrant {
        Voting storage voting = votings[votingId];
        
        // 验证投票状态
        require(voting.status == VotingStatus.ACTIVE, "Voting not active");
        require(block.timestamp <= voting.endTime, "Voting ended");
        require(optionId < voting.options.length, "Invalid option");
        require(msg.value >= voting.minStakeAmount, "Insufficient stake amount");
        require(!userVotes[votingId][msg.sender].hasVoted, "Already voted");
        
        // 记录投票
        userVotes[votingId][msg.sender] = VoteRecord({
            optionId: optionId,
            stakedAmount: msg.value,
            hasVoted: true,
            hasWithdrawn: false
        });
        
        // 更新统计
        optionVotes[votingId][optionId] += msg.value;
        voting.totalStaked += msg.value;
        votingParticipants[votingId].push(msg.sender);
        
        emit VoteCast(votingId, msg.sender, optionId, msg.value);
    }
    
    /**
     * @notice 结束投票
     * @param votingId 投票ID
     */
    function endVoting(uint256 votingId) external {
        Voting storage voting = votings[votingId];
        
        require(voting.status == VotingStatus.ACTIVE, "Voting not active");
        require(
            msg.sender == voting.creator || block.timestamp > voting.endTime,
            "Cannot end voting yet"
        );
        
        voting.status = VotingStatus.ENDED;
        
        // 找出获胜选项
        uint256 winningOption = 0;
        uint256 maxVotes = optionVotes[votingId][0];
        
        for (uint256 i = 1; i < voting.options.length; i++) {
            if (optionVotes[votingId][i] > maxVotes) {
                maxVotes = optionVotes[votingId][i];
                winningOption = i;
            }
        }
        
        emit VotingEnded(votingId, winningOption, votingParticipants[votingId].length);
    }
    
    /**
     * @notice 提取质押的ETH（投票结束后）
     * @param votingId 投票ID
     */
    function withdrawStake(uint256 votingId) external nonReentrant {
        Voting storage voting = votings[votingId];
        VoteRecord storage userVote = userVotes[votingId][msg.sender];
        
        require(
            voting.status == VotingStatus.ENDED || voting.status == VotingStatus.CANCELLED,
            "Voting still active"
        );
        require(userVote.hasVoted, "No vote record");
        require(!userVote.hasWithdrawn, "Already withdrawn");
        require(userVote.stakedAmount > 0, "No stake to withdraw");
        
        uint256 amount = userVote.stakedAmount;
        userVote.hasWithdrawn = true;
        
        (bool success,) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit StakeWithdrawn(votingId, msg.sender, amount);
    }
    
    // ============================================
    // 查询功能
    // ============================================
    
    /**
     * @notice 获取投票信息
     */
    function getVoting(uint256 votingId) external view returns (
        uint256,
        uint256,
        address,
        string memory,
        string memory,
        VotingType,
        string[] memory,
        uint256,
        uint256,
        uint256,
        VotingStatus,
        uint256
    ) {
        Voting storage voting = votings[votingId];
        return (
            voting.votingId,
            voting.workId,
            voting.creator,
            voting.title,
            voting.description,
            voting.votingType,
            voting.options,
            voting.startTime,
            voting.endTime,
            voting.totalStaked,
            voting.status,
            voting.minStakeAmount
        );
    }
    
    /**
     * @notice 获取投票选项的票数
     */
    function getOptionVotes(uint256 votingId, uint256 optionId) external view returns (uint256) {
        return optionVotes[votingId][optionId];
    }
    
    /**
     * @notice 获取用户投票记录
     */
    function getUserVoteRecord(uint256 votingId, address user) external view returns (VoteRecord memory) {
        return userVotes[votingId][user];
    }
}