---
description: Simple and intuitive issue management for AI pair programming
argument-hint: "[issue-id | 'issue description' | search 'keyword' | export]"
allowed-tools: mcp__{{MCP_NAME}}__get_items, mcp__{{MCP_NAME}}__get_item, mcp__{{MCP_NAME}}__create_item, mcp__{{MCP_NAME}}__update_item, mcp__{{MCP_NAME}}__search_items, mcp__{{MCP_NAME}}__list_items
---

# /kuma:issue

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Simple and intuitive issue management for AI pair programming sessions.
**This command ONLY manages issues - it never executes work or starts tasks.**

## Usage

```bash
/kuma:issue                    # List open issues
/kuma:issue "bug description"  # Create new issue
/kuma:issue 103                # Show issue details
/kuma:issue 103 close          # Update issue status
/kuma:issue search "keyword"   # Search issues
```

## Features

### 1. List Open Issues (no arguments)
Shows all open issues in a concise format:
- Issue number, title, priority
- Tags for quick context
- Creation date

### 2. Create New Issue (with description)
When provided with a CLEAR issue description:
- Text must be either quoted OR contain obvious issue keywords (bug, error, problem, feature, etc.)
- Ambiguous text triggers confirmation dialog
- Sets priority based on keywords (bug=high, improvement=medium, etc.)
- Returns the new issue number
- **Analyzes task complexity and suggests appropriate next commands**

### 3. View Issue Details (with number)
Shows complete issue information:
- Full description and content
- **Related documents**: Linked specs, plans, implementation notes
- **Related items**: Connected issues, tasks, decisions
- Current status and priority
- History of updates

**Important**: Issues serve as the central hub for all related documentation:
- Spec documents (requirements, design, tasks)
- Implementation plans and notes
- Test results and validation
- Decision records

### 4. Update Issue Status (with number + action)
Supports simple status updates:
- `close` - Mark as Closed
- `reopen` - Mark as Open
- `progress` - Mark as In Progress

### 5. Search Issues (search + keyword)
Search across all issues:
- Searches in title, description, and content
- Shows matching issues with context
- Includes closed issues in results

## Implementation

This command consolidates the issue-related functionality from the deprecated /kuma:remember and /kuma:remind commands into a single, focused interface.

### Argument Parsing Rules

**CRITICAL**: Parse arguments in this EXACT order to avoid misinterpretation:

1. **No arguments** → List open issues
2. **Numeric only (e.g., "42")** → Show issue details  
3. **Numeric + action (e.g., "42 close")** → Update issue status
4. **"search" + keyword** → Search issues
5. **"export"** → Export issues (special case)
6. **Text starting with quotes or clear issue keywords** → Create new issue
7. **Ambiguous text** → **ALWAYS ASK before proceeding**

**STRICT RULES**:
- This command ONLY manages issues, NEVER executes work
- If text could be interpreted as a work request, STOP and clarify
- Never use Task or agent tools from this command
- Issue creation requires explicit confirmation for ambiguous requests

**When text is ambiguous**, respond with:
```
Your input: "[user text]"

What would you like to do?
1. Create a new issue with this description
2. Search for existing issues about this
3. Cancel (use /kuma:go if you want to start working)

Please choose 1, 2, or 3.
```

## Examples

```bash
# Morning routine
/kuma:issue                           # What needs to be done?

# Found a bug (with quotes = clear intent)
/kuma:issue "Login fails with empty password"

# Found a bug (with keywords = clear intent)  
/kuma:issue bug: login fails with empty password

# Check specific issue
/kuma:issue 103

# Mark as done
/kuma:issue 103 close

# Find related issues
/kuma:issue search "login"

# Ambiguous input (will trigger confirmation)
/kuma:issue fix the authentication system  # → Asks what you want to do
```

## Work Suggestion After Issue Creation

After creating a new issue, **automatically analyze task complexity and suggest appropriate next commands** to guide the user:

### Complexity Analysis Algorithm

Analyze the issue based on these factors:

**Technical Complexity (1-5 scale):**
- Keywords: "refactor", "migrate", "redesign", "architecture" → Higher complexity
- Keywords: "fix", "update", "adjust", "change" → Lower complexity
- Multiple components mentioned → Higher complexity
- Single file/component → Lower complexity

**Scope Indicators (1-5 scale):**
- Keywords: "integration", "API", "database", "authentication" → Larger scope
- Keywords: "button", "text", "config", "style" → Smaller scope
- Number of acceptance criteria → More = larger scope
- External dependencies mentioned → Larger scope

**Risk Level (1-5 scale):**
- Keywords: "security", "payment", "data", "migration" → Higher risk
- Keywords: "UI", "copy", "formatting", "comment" → Lower risk
- Production impact mentioned → Higher risk
- Reversibility → Irreversible = higher risk

### Suggestion Logic

Based on total complexity score (3-15 range):

**Score 3-5: Micro Change (< 1 day)**
```
次の作業:
- 直接実装: `/kuma:go [issue-id]` または `/kuma:vibe [issue-id]`
- または軽量仕様: `/kuma:spec:micro [issue-id]` (仕様後は /kuma:vibe で実装)

推奨: 小規模な変更のため、直接実装で問題ありません。
プロジェクトのvibes（ステアリング設定）を適用する場合は /kuma:vibe を使用してください。
```

**Score 6-9: Small Feature (1-3 days)**
```
次の作業:
- クイック仕様作成: `/kuma:spec:quick [issue-id]` → 仕様完成後に /kuma:vibe で実装
- または直接実装: `/kuma:go [issue-id]` または `/kuma:vibe [issue-id]`

推奨: 要件とタスク分解のため、クイック仕様の作成を推奨します。
仕様作成後は /kuma:vibe:tdd または /kuma:vibe:code で実装できます。
```

**Score 10-12: Medium Feature (3-5 days)**
```
次の作業:
- 完全仕様作成: `/kuma:spec [issue-id]` → 仕様完成後に /kuma:vibe:spec で段階的実装
- または仕様判断: `/kuma:spec:when [issue-id]`

推奨: 設計フェーズを含む完全な仕様作成を推奨します。
仕様作成後は /kuma:vibe:spec で要件→設計→タスクを段階的に実装できます。
```

**Score 13-15: Large Feature (> 5 days)**
```
次の作業:
- 完全仕様作成(必須): `/kuma:spec [issue-id]` → 仕様完成後に /kuma:vibe:spec で段階的実装
- 複雑度確認: `/kuma:spec:when [issue-id]`

推奨: 大規模な変更のため、要件・設計・タスクの3フェーズ仕様が必要です。
仕様作成後は /kuma:vibe:spec で段階的に実装し、品質ゲートを確認してください。
```

### Suggestion Output Format

After creating issue #XXX, display:

```markdown
✅ Issue #XXX created successfully

**作業規模分析:**
- 複雑度: [Low/Medium/High/Very High]
- 推定作業時間: [X hours/days]
- リスクレベル: [Low/Medium/High]

**推奨される次のステップ:**

1. **[Primary Command]** - [Reason]
2. **[Alternative Command]** - [When to use]

**コマンド説明:**

**仕様作成コマンド:**
- `/kuma:spec:micro` - 1日未満の小規模変更（What/Why/Howのみ)
- `/kuma:spec:quick` - 1-3日の機能（要件+タスク、設計スキップ）
- `/kuma:spec` - 3日以上の機能（要件+設計+タスクの完全仕様）
- `/kuma:spec:when` - 仕様の必要性を判断（複雑度チェック）

**実装コマンド:**
- `/kuma:vibe` - プロジェクトのvibes（ステアリング設定）に基づく適応的実装
- `/kuma:vibe:spec` - 仕様ベースの段階的実装（要件→設計→タスク）
- `/kuma:vibe:tdd` - テスト駆動開発（RED-GREEN-REFACTOR）
- `/kuma:vibe:code` - 仕様から直接コード生成
- `/kuma:go` - 仕様なしで直接実装開始（手動品質管理）

**Vibeコマンドの利点:**
- プロジェクト固有のルール（TDD、コーディング規約等）を自動適用
- 品質ゲート（テスト、リント、ビルド）の自動チェック
- エラー時の自動リトライとロールバック機能
```

### Implementation Guidelines

1. **Parse issue content** - Extract keywords and structure
2. **Calculate complexity score** - Use algorithm above
3. **Determine recommendation** - Match score to suggestion tier
4. **Format output** - Clear, actionable guidance
5. **Explain reasoning** - Help users understand the choice

### Example Outputs

**Example 1: Bug Fix (Score: 4)**
```
✅ Issue #184 created successfully

**作業規模分析:**
- 複雑度: Low
- 推定作業時間: 2-4 hours
- リスクレベル: Low

**推奨される次のステップ:**

1. `/kuma:go 184` - 小規模な修正のため直接実装
2. `/kuma:spec:micro 184` - 変更内容を記録したい場合

**理由:** ボタンの配置修正は単一ファイルの変更で、リスクも低いため、
仕様作成なしで直接実装できます。
```

**Example 2: New Feature (Score: 8)**
```
✅ Issue #185 created successfully

**作業規模分析:**
- 複雑度: Medium
- 推定作業時間: 2-3 days
- リスクレベル: Medium

**推奨される次のステップ:**

1. `/kuma:spec:quick 185` - 要件整理とタスク分解（推奨）
2. `/kuma:go 185` - すぐに実装を始める場合

**理由:** 複数コンポーネントに影響する機能追加のため、
要件とタスクを整理してから実装することを推奨します。
設計フェーズは不要と判断しました。
```

**Example 3: Complex Feature (Score: 12)**
```
✅ Issue #186 created successfully

**作業規模分析:**
- 複雑度: High
- 推定作業時間: 5-7 days
- リスクレベル: High

**推奨される次のステップ:**

1. `/kuma:spec 186` - 完全仕様の作成（強く推奨）
2. `/kuma:spec:when 186` - 複雑度の詳細分析

**理由:** 認証システムの実装は高リスクで複雑なため、
要件定義→設計→タスク分解の3フェーズを経た仕様作成が必要です。
```

### Special Cases

**Very Simple Changes (typos, comments, etc.)**
```
このような軽微な変更は、イシュー登録せずに直接修正できます。
必要であれば `/kuma:go "fix typo in README"` で実行できます。
```

**Emergency Hotfixes**
```
緊急度が高い場合:
1. `/kuma:go [issue-id]` - 即座に修正
2. 修正後に `/kuma:spec:micro [issue-id]` で記録
```

## Related Commands

- `/kuma:start` - Begin work session and see context
- `/kuma:go` - Execute work on selected issue
- `/kuma:spec:micro` - Ultra-lightweight spec (< 1 day)
- `/kuma:spec:quick` - Quick spec (1-3 days)
- `/kuma:spec` - Full spec (> 3 days)
- `/kuma:spec:when` - Complexity analysis and recommendation
- `/kuma:finish` - End session with handover