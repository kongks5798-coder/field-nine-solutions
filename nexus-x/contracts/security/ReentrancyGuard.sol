// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReentrancyGuard
 * @author NEXUS-X Security Team
 * @notice Production-grade reentrancy attack prevention for NEXUS-X settlement contracts
 * @dev Implements checks-effects-interactions pattern with multiple protection layers
 *
 * Security Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                    Reentrancy Protection Layers                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │                                                                             │
 * │  Layer 1: Mutex Lock (nonReentrant modifier)                               │
 * │  ├── Single-entry lock per contract                                        │
 * │  └── Prevents recursive calls to protected functions                       │
 * │                                                                             │
 * │  Layer 2: Cross-Contract Lock (nonReentrantCrossContract)                  │
 * │  ├── Shared lock across contract ecosystem                                 │
 * │  └── Prevents cross-contract reentrancy attacks                            │
 * │                                                                             │
 * │  Layer 3: Read-Only Reentrancy Guard                                       │
 * │  ├── Prevents view function manipulation                                   │
 * │  └── Protects against price oracle attacks                                 │
 * │                                                                             │
 * │  Layer 4: Time-Based Lock (cooldown)                                       │
 * │  ├── Minimum time between sensitive operations                             │
 * │  └── Prevents flash loan attacks                                           │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NexusReentrancyGuard
 * @notice Enhanced reentrancy guard with multiple protection mechanisms
 */
abstract contract NexusReentrancyGuard {
    // ============================================================
    // Constants & State Variables
    // ============================================================

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private constant _READ_LOCKED = 3;

    // Main reentrancy lock
    uint256 private _status;

    // Cross-contract reentrancy lock (shared across NEXUS-X ecosystem)
    address private immutable _lockRegistry;

    // Time-based protection
    mapping(address => uint256) private _lastActionTime;
    uint256 public cooldownPeriod = 1; // 1 block minimum by default

    // Function-specific locks for granular control
    mapping(bytes4 => uint256) private _functionLocks;

    // Read-only reentrancy protection
    uint256 private _readLockStatus;

    // ============================================================
    // Events
    // ============================================================

    event ReentrancyAttemptDetected(
        address indexed attacker,
        bytes4 indexed functionSelector,
        uint256 timestamp
    );

    event CooldownViolation(
        address indexed caller,
        uint256 timeSinceLastAction,
        uint256 requiredCooldown
    );

    event CrossContractReentrancyBlocked(
        address indexed caller,
        address indexed targetContract,
        bytes4 indexed functionSelector
    );

    // ============================================================
    // Errors
    // ============================================================

    error ReentrancyGuardReentrantCall();
    error ReadOnlyReentrancy();
    error CrossContractReentrancy();
    error CooldownNotExpired(uint256 remainingTime);
    error FunctionLocked(bytes4 selector);

    // ============================================================
    // Constructor
    // ============================================================

    constructor(address lockRegistry_) {
        _status = _NOT_ENTERED;
        _readLockStatus = _NOT_ENTERED;
        _lockRegistry = lockRegistry_;
    }

    // ============================================================
    // Modifiers
    // ============================================================

    /**
     * @notice Standard reentrancy guard
     * @dev Prevents recursive calls to protected functions
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    /**
     * @notice Read-only reentrancy guard
     * @dev Prevents manipulation through view functions during state changes
     */
    modifier nonReentrantView() {
        if (_status == _ENTERED || _readLockStatus == _READ_LOCKED) {
            revert ReadOnlyReentrancy();
        }
        _;
    }

    /**
     * @notice Cross-contract reentrancy guard
     * @dev Uses shared lock registry to prevent cross-contract attacks
     */
    modifier nonReentrantCrossContract() {
        _checkCrossContractLock();
        _setCrossContractLock(true);
        _;
        _setCrossContractLock(false);
    }

    /**
     * @notice Time-based cooldown guard
     * @dev Ensures minimum time between sensitive operations
     */
    modifier withCooldown() {
        _checkCooldown(msg.sender);
        _;
        _lastActionTime[msg.sender] = block.number;
    }

    /**
     * @notice Function-specific lock
     * @dev Allows locking specific functions independently
     */
    modifier functionLock(bytes4 selector) {
        if (_functionLocks[selector] == _ENTERED) {
            emit ReentrancyAttemptDetected(msg.sender, selector, block.timestamp);
            revert FunctionLocked(selector);
        }
        _functionLocks[selector] = _ENTERED;
        _;
        _functionLocks[selector] = _NOT_ENTERED;
    }

    /**
     * @notice Combined maximum protection
     * @dev Applies all protection layers
     */
    modifier maxProtection() {
        _nonReentrantBefore();
        _checkCrossContractLock();
        _setCrossContractLock(true);
        _checkCooldown(msg.sender);

        // Set read lock to prevent view function manipulation
        _readLockStatus = _READ_LOCKED;

        _;

        _readLockStatus = _NOT_ENTERED;
        _setCrossContractLock(false);
        _lastActionTime[msg.sender] = block.number;
        _nonReentrantAfter();
    }

    // ============================================================
    // Internal Functions
    // ============================================================

    function _nonReentrantBefore() private {
        if (_status == _ENTERED) {
            emit ReentrancyAttemptDetected(msg.sender, msg.sig, block.timestamp);
            revert ReentrancyGuardReentrantCall();
        }
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }

    function _checkCrossContractLock() private view {
        if (_lockRegistry != address(0)) {
            (bool success, bytes memory data) = _lockRegistry.staticcall(
                abi.encodeWithSignature("isLocked()")
            );
            if (success && abi.decode(data, (bool))) {
                revert CrossContractReentrancy();
            }
        }
    }

    function _setCrossContractLock(bool locked) private {
        if (_lockRegistry != address(0)) {
            (bool success,) = _lockRegistry.call(
                abi.encodeWithSignature("setLock(bool)", locked)
            );
            require(success, "Lock registry call failed");
        }
    }

    function _checkCooldown(address caller) private view {
        uint256 lastAction = _lastActionTime[caller];
        if (lastAction > 0 && block.number < lastAction + cooldownPeriod) {
            uint256 remaining = (lastAction + cooldownPeriod) - block.number;
            emit CooldownViolation(caller, block.number - lastAction, cooldownPeriod);
            revert CooldownNotExpired(remaining);
        }
    }

    // ============================================================
    // Admin Functions
    // ============================================================

    function _setCooldownPeriod(uint256 newPeriod) internal {
        cooldownPeriod = newPeriod;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

/**
 * @title CrossContractLockRegistry
 * @notice Shared lock registry for cross-contract reentrancy protection
 */
contract CrossContractLockRegistry is Ownable {
    mapping(address => bool) private _authorizedContracts;
    bool private _globalLock;
    address private _currentLockHolder;

    event ContractAuthorized(address indexed contractAddress);
    event ContractDeauthorized(address indexed contractAddress);
    event LockAcquired(address indexed holder);
    event LockReleased(address indexed holder);

    error NotAuthorized();
    error LockAlreadyHeld(address currentHolder);
    error NotLockHolder();

    constructor() Ownable(msg.sender) {}

    modifier onlyAuthorized() {
        if (!_authorizedContracts[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    function authorizeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = true;
        emit ContractAuthorized(contractAddress);
    }

    function deauthorizeContract(address contractAddress) external onlyOwner {
        _authorizedContracts[contractAddress] = false;
        emit ContractDeauthorized(contractAddress);
    }

    function isLocked() external view returns (bool) {
        return _globalLock;
    }

    function setLock(bool locked) external onlyAuthorized {
        if (locked) {
            if (_globalLock) {
                revert LockAlreadyHeld(_currentLockHolder);
            }
            _globalLock = true;
            _currentLockHolder = msg.sender;
            emit LockAcquired(msg.sender);
        } else {
            if (_currentLockHolder != msg.sender) {
                revert NotLockHolder();
            }
            _globalLock = false;
            _currentLockHolder = address(0);
            emit LockReleased(msg.sender);
        }
    }

    function isAuthorized(address contractAddress) external view returns (bool) {
        return _authorizedContracts[contractAddress];
    }

    function currentLockHolder() external view returns (address) {
        return _currentLockHolder;
    }
}

/**
 * @title NXUSDSettlementSecure
 * @notice NXUSD Settlement contract with comprehensive reentrancy protection
 */
contract NXUSDSettlementSecure is NexusReentrancyGuard, Ownable {
    // ============================================================
    // State Variables
    // ============================================================

    IERC20 public immutable nxusd;

    mapping(bytes32 => Settlement) public settlements;
    mapping(address => uint256) public balances;
    mapping(address => bool) public authorizedSettlers;

    uint256 public totalSettled;
    bool public paused;

    struct Settlement {
        bytes32 id;
        address trader;
        uint256 amount;
        uint256 timestamp;
        bool executed;
        bytes32 zkProofHash;
    }

    // ============================================================
    // Events
    // ============================================================

    event SettlementCreated(bytes32 indexed id, address indexed trader, uint256 amount);
    event SettlementExecuted(bytes32 indexed id, address indexed trader, uint256 amount);
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdrawal(address indexed user, uint256 amount);

    // ============================================================
    // Errors
    // ============================================================

    error ContractPaused();
    error SettlementNotFound();
    error SettlementAlreadyExecuted();
    error InsufficientBalance();
    error UnauthorizedSettler();
    error InvalidAmount();
    error TransferFailed();

    // ============================================================
    // Constructor
    // ============================================================

    constructor(
        address nxusd_,
        address lockRegistry_
    ) NexusReentrancyGuard(lockRegistry_) Ownable(msg.sender) {
        nxusd = IERC20(nxusd_);
    }

    // ============================================================
    // Modifiers
    // ============================================================

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyAuthorizedSettler() {
        if (!authorizedSettlers[msg.sender]) revert UnauthorizedSettler();
        _;
    }

    // ============================================================
    // External Functions (Protected)
    // ============================================================

    /**
     * @notice Deposit NXUSD tokens
     * @dev Protected by nonReentrant to prevent deposit reentrancy
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();

        // Effects BEFORE interactions (CEI pattern)
        balances[msg.sender] += amount;

        // Interaction LAST
        bool success = nxusd.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice Withdraw NXUSD tokens
     * @dev Protected by maxProtection for highest security
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external maxProtection whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();

        // Effects BEFORE interactions (CEI pattern)
        balances[msg.sender] -= amount;

        // Interaction LAST
        bool success = nxusd.transfer(msg.sender, amount);
        if (!success) {
            // Revert state on failure
            balances[msg.sender] += amount;
            revert TransferFailed();
        }

        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @notice Create a settlement record
     * @dev Protected by nonReentrantCrossContract
     * @param id Unique settlement identifier
     * @param trader Trader address
     * @param amount Settlement amount
     * @param zkProofHash Hash of the ZK proof
     */
    function createSettlement(
        bytes32 id,
        address trader,
        uint256 amount,
        bytes32 zkProofHash
    ) external nonReentrantCrossContract whenNotPaused onlyAuthorizedSettler {
        if (settlements[id].id != bytes32(0)) revert SettlementAlreadyExecuted();

        settlements[id] = Settlement({
            id: id,
            trader: trader,
            amount: amount,
            timestamp: block.timestamp,
            executed: false,
            zkProofHash: zkProofHash
        });

        emit SettlementCreated(id, trader, amount);
    }

    /**
     * @notice Execute a settlement
     * @dev Protected by maxProtection - most critical function
     * @param id Settlement identifier
     */
    function executeSettlement(bytes32 id) external maxProtection whenNotPaused onlyAuthorizedSettler {
        Settlement storage settlement = settlements[id];

        if (settlement.id == bytes32(0)) revert SettlementNotFound();
        if (settlement.executed) revert SettlementAlreadyExecuted();
        if (balances[address(this)] < settlement.amount) revert InsufficientBalance();

        // Effects BEFORE interactions (CEI pattern)
        settlement.executed = true;
        totalSettled += settlement.amount;
        balances[settlement.trader] += settlement.amount;

        emit SettlementExecuted(id, settlement.trader, settlement.amount);
    }

    /**
     * @notice Emergency withdrawal (only when paused)
     * @dev Allows users to withdraw even during emergency
     */
    function emergencyWithdraw() external nonReentrant {
        require(paused, "Not in emergency mode");

        uint256 amount = balances[msg.sender];
        if (amount == 0) revert InsufficientBalance();

        // Effects first
        balances[msg.sender] = 0;

        // Interaction last
        bool success = nxusd.transfer(msg.sender, amount);
        if (!success) {
            balances[msg.sender] = amount;
            revert TransferFailed();
        }

        emit EmergencyWithdrawal(msg.sender, amount);
    }

    // ============================================================
    // View Functions (Protected)
    // ============================================================

    /**
     * @notice Get user balance
     * @dev Protected by nonReentrantView to prevent read-only reentrancy
     */
    function getBalance(address user) external view nonReentrantView returns (uint256) {
        return balances[user];
    }

    /**
     * @notice Get settlement details
     */
    function getSettlement(bytes32 id) external view nonReentrantView returns (Settlement memory) {
        return settlements[id];
    }

    // ============================================================
    // Admin Functions
    // ============================================================

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function authorizeSettler(address settler) external onlyOwner {
        authorizedSettlers[settler] = true;
    }

    function deauthorizeSettler(address settler) external onlyOwner {
        authorizedSettlers[settler] = false;
    }

    function setCooldown(uint256 blocks) external onlyOwner {
        _setCooldownPeriod(blocks);
    }
}

/**
 * @title IERC20
 * @notice Minimal ERC20 interface
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}
