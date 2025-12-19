# WhichWitch ZetaChain合约部署Makefile

# 默认网络
NETWORK ?= zeta_testnet

# 环境变量
-include .env

# 颜色定义
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help install build test deploy configure verify clean

help: ## 显示帮助信息
	@echo "$(GREEN)WhichWitch ZetaChain合约部署工具$(NC)"
	@echo ""
	@echo "$(YELLOW)可用命令:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## 安装依赖
	@echo "$(YELLOW)安装Foundry依赖...$(NC)"
	forge install OpenZeppelin/openzeppelin-contracts@v5.0.0 --no-commit
	forge install zetachain/protocol-contracts@v10.0.0 --no-commit
	@echo "$(GREEN)依赖安装完成$(NC)"

build: ## 编译合约
	@echo "$(YELLOW)编译合约...$(NC)"
	forge build
	@echo "$(GREEN)编译完成$(NC)"

test: ## 运行测试
	@echo "$(YELLOW)运行测试...$(NC)"
	forge test -vvv
	@echo "$(GREEN)测试完成$(NC)"

test-coverage: ## 运行测试覆盖率
	@echo "$(YELLOW)运行测试覆盖率...$(NC)"
	forge coverage
	@echo "$(GREEN)测试覆盖率完成$(NC)"

deploy-zeta-testnet: ## 部署到ZetaChain测试网
	@echo "$(YELLOW)部署到ZetaChain测试网...$(NC)"
	forge script script/DeployZetaPayment.s.sol:DeployZetaPayment \
		--rpc-url $(ZETA_TESTNET_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ZETASCAN_API_KEY) \
		-vvvv

deploy-zeta-mainnet: ## 部署到ZetaChain主网
	@echo "$(RED)警告: 即将部署到ZetaChain主网$(NC)"
	@read -p "确认部署到主网? [y/N]: " confirm && [ "$$confirm" = "y" ]
	@echo "$(YELLOW)部署到ZetaChain主网...$(NC)"
	forge script script/DeployZetaPayment.s.sol:DeployZetaPayment \
		--rpc-url $(ZETA_MAINNET_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ZETASCAN_API_KEY) \
		-vvvv

configure: ## 配置已部署的合约
	@echo "$(YELLOW)配置ZetaPayment合约...$(NC)"
	@if [ -z "$(ZETA_PAYMENT_ADDRESS)" ]; then \
		echo "$(RED)错误: 请设置ZETA_PAYMENT_ADDRESS环境变量$(NC)"; \
		exit 1; \
	fi
	forge script script/ConfigureZetaPayment.s.sol:ConfigureZetaPayment \
		--rpc-url $(ZETA_TESTNET_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		-vvvv

verify: ## 验证合约
	@echo "$(YELLOW)验证合约...$(NC)"
	@if [ -z "$(ZETA_PAYMENT_ADDRESS)" ]; then \
		echo "$(RED)错误: 请设置ZETA_PAYMENT_ADDRESS环境变量$(NC)"; \
		exit 1; \
	fi
	forge verify-contract \
		--chain-id 7001 \
		--num-of-optimizations 200 \
		--watch \
		--constructor-args $(shell cast abi-encode "constructor(address)" $(ZETA_CONNECTOR_TESTNET)) \
		--etherscan-api-key $(ZETASCAN_API_KEY) \
		--compiler-version v0.8.20+commit.a1b79de6 \
		$(ZETA_PAYMENT_ADDRESS) \
		src/zeta/ZetaCrossChainPayment.sol:ZetaCrossChainPayment

simulate-deploy: ## 模拟部署（不广播）
	@echo "$(YELLOW)模拟部署...$(NC)"
	forge script script/DeployZetaPayment.s.sol:DeployZetaPayment \
		--rpc-url $(ZETA_TESTNET_RPC_URL) \
		-vvvv

gas-report: ## 生成Gas报告
	@echo "$(YELLOW)生成Gas报告...$(NC)"
	forge test --gas-report

clean: ## 清理编译文件
	@echo "$(YELLOW)清理编译文件...$(NC)"
	forge clean
	@echo "$(GREEN)清理完成$(NC)"

format: ## 格式化代码
	@echo "$(YELLOW)格式化代码...$(NC)"
	forge fmt
	@echo "$(GREEN)格式化完成$(NC)"

check-env: ## 检查环境变量
	@echo "$(YELLOW)检查环境变量...$(NC)"
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "$(RED)错误: PRIVATE_KEY未设置$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$(ZETA_TESTNET_RPC_URL)" ]; then \
		echo "$(RED)错误: ZETA_TESTNET_RPC_URL未设置$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)环境变量检查通过$(NC)"

# 快捷命令
deploy: deploy-zeta-testnet ## 默认部署到测试网

all: install build test deploy ## 完整流程：安装、编译、测试、部署