# 论文四轮审查与修订

`paper-review-revision` 是一个审查工程与应用数学论文的技能，适合 IEEE Transactions 等工程期刊稿件。可以执行完整流程，也可以只审查指定章节、公式或定理。

仓库同时是一个 DeepSeek Harness 插件包：`package.json` 里的 `dsh.bundle` 声明把 `skills/paper-review-revision` 注册为一个只提供技能的插件，因此在 DSH 里可以像其他插件一样安装、启用和卸载。

## 安装

### DeepSeek Harness

命令行：

```bash
dsh plugin add github:songrui111/paper-review-revision
```

桌面端：**插件 → 添加插件**，填入同一条规格 `github:songrui111/paper-review-revision`。装好后新开一个会话，技能就会出现在技能目录里。

### Codex

技能本体在 `skills/paper-review-revision`，把这一层目录放进 Codex 的个人技能目录即可。

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

> 用 $paper-review-revision 对这篇论文执行完整四轮审查与修订。

> 用 $paper-review-revision 只做数学复核，检查定理 1 和公式 (8)–(15)，给出独立推导。

> 用 $paper-review-revision 对比原稿与修订稿，只做终审，检查新增问题和未解决问题。

建议提供 LaTeX 主文件、章节文件、宏定义、参考文献和相关附录。也可提供 DOCX 或 PDF。只有 PDF 时，审查意见会定位到稿件，复杂公式以能从页面核实的内容为准。

## 四轮流程

| 轮次 | 审查重点 |
| --- | --- |
| 1. 学术审查 | 检查研究问题、创新性、论证结构、实验设计和结论的证据。 |
| 2. 数学复核 | 独立推导关键公式，逐项核对定理、证明和假设。用反例或数值测试辅助验证。 |
| 3. 英文编辑 | 逐句给出原句、改句和理由，并附可替换段落。涉及科学含义的歧义进入问题记录。 |
| 4. 修订稿终审 | 对比版本，复查符号、术语、算法、图表、引用和科学主张。 |

完整流程默认交付中文 PDF 审查报告、DOCX 英文逐句对照和独立修订稿，LaTeX 多文件稿交付可编辑的修订工程。关键公式、假设、数据及科学结论的改动，经作者逐项确认后才写入修订稿。输出格式可按请求和本机工具调整。

## 仓库结构

```text
.
├── package.json                 # DSH 插件清单：dsh.bundle.patch 指向下面的 patch
├── cordis.patch.yml             # 安装时插入一个技能提供者，指向 skills/
├── index.js                     # 按 DSH profile 解析技能根目录的辅助函数
├── locale/{en,zh}.json          # 插件列表里的标题与描述
├── assets/icon.png              # 插件图标
└── skills/paper-review-revision # 技能本体：SKILL.md、references/、agents/
```

技能不执行任何安装脚本，也不读写插件目录以外的文件；`cordis.patch.yml` 只插入一条 `@deepseek-ai/dsh-skill-filesystem`，把 `skills/` 作为只读技能根加载。

## 验证记录

已用一篇合成的多文件 LaTeX 论文完成四轮试跑。审查定位了收敛定理的反例和正文与表格的数值冲突。逐字比对确认修订稿只有三处英文修改，PDF 和 DOCX 均已渲染检查。测试环境缺少 `amsthm.sty`，因此在仅替换相关导言区设置的临时副本中完成了两遍编译。

技能入口见 [skills/paper-review-revision/SKILL.md](skills/paper-review-revision/SKILL.md)。
