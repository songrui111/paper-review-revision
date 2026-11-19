# 论文四轮审查与修订

`paper-review-revision` 是一个用于审查已有工程和应用数学论文的 Codex 技能，适合 IEEE Transactions 等工程期刊稿件。可以执行完整流程，也可以只审查指定章节、公式或定理。

## 安装

将仓库克隆到 Codex 的个人技能目录。

**macOS / Linux**

```bash
git clone https://github.com/songrui111/paper-review-revision.git ~/.codex/skills/paper-review-revision
```

**Windows PowerShell**

```powershell
git clone https://github.com/songrui111/paper-review-revision.git "$env:USERPROFILE/.codex/skills/paper-review-revision"
```

如果目标目录里已有本技能，保留原有安装。若该目录是从本仓库克隆的，可以在目录里运行 `git pull` 更新。

## 使用

在 Codex 中附上论文，或给出工作区内的 LaTeX 工程路径，再输入下面任一请求。

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

## 验证记录

已用一篇合成的多文件 LaTeX 论文完成四轮试跑。审查定位了收敛定理的反例和正文与表格的数值冲突。逐字比对确认修订稿只有三处英文修改，PDF 和 DOCX 均已渲染检查。测试环境缺少 `amsthm.sty`，因此在仅替换相关导言区设置的临时副本中完成了两遍编译。

技能入口见 [SKILL.md](SKILL.md)。
