# 论文四轮审查与修订工作流

`paper-review-revision` 用两个智能体依次完成学术审查、数学复核、英文逐句编辑和修订稿终审，适合 IEEE Transactions 等工程或应用数学期刊稿件。前三轮由审稿智能体出报告，修订智能体按报告改稿，再把新稿和逐项回复交回原审稿智能体进入下一轮。也可以只审查指定轮次、章节、公式或定理。

仓库同时是一个 DeepSeek Harness 插件包：`package.json` 里的 `dsh.bundle` 声明把 `skills/paper-review-revision` 注册为一个只提供技能的插件，因此在 DSH 里可以像其他插件一样安装、启用和卸载。

## 安装

### DeepSeek Harness

从 GitHub 安装包含四轮双智能体工作流的 `main` 版本。

```bash
dsh plugin add github:songrui111/paper-review-revision
```

通过 npm 安装时，功能以 npm 上已发布的版本为准。

```bash
dsh plugin add dsh-paper-review-revision
```

在桌面端打开 **插件 → 添加插件**，填入上面任一规格。装好后新开一个会话。完整工作流需要支持后续消息的本地 `subagent` 和 `send_message`。 [DeepSeek Harness 子智能体文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/README.md#managed-delegation)

### Codex

技能本体在 `skills/paper-review-revision`，把这一层目录放进 Codex 的个人技能目录即可。完整工作流需要宿主支持子智能体，版本管理脚本在本机用 Node.js 运行。

**macOS / Linux**

```bash
git clone --depth 1 https://github.com/songrui111/paper-review-revision.git /tmp/paper-review-revision
mkdir -p ~/.codex/skills
cp -R /tmp/paper-review-revision/skills/paper-review-revision ~/.codex/skills/
```

**Windows PowerShell**

```powershell
git clone --depth 1 https://github.com/songrui111/paper-review-revision.git "$env:TEMP\paper-review-revision"
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null
Copy-Item -Recurse -Force "$env:TEMP\paper-review-revision\skills\paper-review-revision" "$env:USERPROFILE\.codex\skills\"
```

如果目标目录里已有本技能，保留原有安装；从本仓库复制过去的目录可以用 `git pull` 取更新后再复制一次。

## 使用

附上论文，或给出工作区内的 LaTeX 工程路径，再输入下面任一请求。

> 用 $paper-review-revision 对这篇论文运行完整四轮双智能体审修工作流。

> 用 $paper-review-revision 只做数学复核，检查定理 1 和公式 (8)–(15)，给出独立推导。

> 用 $paper-review-revision 对比原稿与修订稿，只做终审，检查新增问题和未解决问题。

建议提供 LaTeX 主文件、章节文件、宏定义、参考文献和相关附录，也可直接提供 DOCX。只有 PDF 时仍依序完成可做的四轮检查，给出带位置的修改意见。写入修订需要可编辑源稿。

## 工作流

1. **学术审查**检查研究问题、创新性、论证结构、实验设计和结论的证据。修订智能体落实可改项。
2. **数学复核**独立检查关键公式、定理、证明和假设。修订智能体写入有依据且经作者确认的实质改动。
3. **英文逐句编辑**给出英文原句、改句和理由。修订智能体在保护技术含义的前提下落实修改。
4. **修订稿终审**由原审稿智能体核对前三轮修改、全文一致性和仍未解决的问题，给出终审结论。

前三轮遇到无须修改或缺少材料时，保留当前稿和相关记录，继续进入下一轮。交付以第四轮核对过的稿件为准。

每轮保留 `review.md` 和适用的 `changes.md`，`workflow.json` 记录稿件版本、审稿结论和停止状态。完整流程默认汇总为中文 PDF 审查报告，有英文逐句修改时附 DOCX 修改对照。关键公式、假设、数据及科学结论的实质改动，经作者逐项确认后写入修订稿。

## 仓库结构

```text
.
├── package.json                 # DSH 插件清单：dsh.bundle.patch 指向下面的 patch
├── cordis.patch.yml             # 安装时插入一个技能提供者，指向 skills/
├── index.js                     # 按 DSH profile 解析技能根目录的辅助函数
├── locale/{en,zh}.json          # 插件列表里的标题与描述
├── assets/icon.png              # 插件图标
└── skills/paper-review-revision # 技能入口、交接说明与版本管理脚本
```

插件安装时将 `skills/` 注册为只读技能根。运行时，稿件副本、报告和修订记录写到本次任务的工作目录。

技能入口见 [SKILL.md](skills/paper-review-revision/SKILL.md)，状态命令和交接文件见[双智能体交接与运行](skills/paper-review-revision/references/workflow.md)。
