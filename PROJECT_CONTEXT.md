# 项目背景

<!-- AUTO | 2026-08-01T07:57Z -->

## 目标

为 Agent Bounties #649 准备一个可由独立参与者完成的 1 USDC 子任务。子任务实现一个只读、确定性的 Base USDC 钱包动作安全确认卡，并由固定沙箱测试裁决。

## 当前口径

- 父任务：`NSPG13/agent-bounties#649`
- 父任务合约：`0x41f7f2722f0af7289c2f2eea6afed6f4873f722a`
- 父任务 ID：`0xeba5dad578290281d78a230169b3c6bf53abc3d06292f927b8d66aaf53f55304`
- GitHub 发布账号：`aiforuseac4-blockchain`
- 计划公开仓库：`https://github.com/aiforuseac4-blockchain/agent-wallet-review-bounty`
- 父任务 solver 钱包：`0x8e61edc567503a7d3b3554c51230f512c4ea7b1e`
- 子任务总资金：精确 1 USDC
- 预期拆分：子任务 solver 0.99 USDC，验证奖励 0.01 USDC
- 子任务必须由与父任务领取者不同的已注册参与者完成
- 当前候选子任务 solver：`dtopenclaw`；尚未确认本任务同意
- 付款成立的唯一证据是 Base 主网上确认的 `BountySettled` 事件

## 固定验证环境

- 容器：`docker.io/library/node@sha256:b74031e546d7f4faf561d797ac1b76beccac856a042815ca77db4fd047581605`
- 命令：`node /benchmark/test.mjs /workspace`
- 基准 directory-v1 摘要：`sha256:255846520798194cb605fae861aa128dbf5d0a387301546b6e362fb05b055d53`
- 基准提交：`f3642f45b0e42ad1f109af89198f2840eb8bcc0c`
