---
description: End work session and create daily summary
allowed-tools: mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__create_item, mcp__shirokuma-knowledge-base__update_item, mcp__shirokuma-knowledge-base__get_current_state, mcp__shirokuma-knowledge-base__update_current_state, mcp__shirokuma-knowledge-base__get_item_detail, Bash(date:*)
---

# ai-finish - End work session

## Usage
```
/ai-finish
```

## Purpose
End the work session, record today's work content, and update current_state for the next session.

## Task

Note: Respond to the user in their language.

<ultrathink>
This is the improved version of ai-finish command. I need to:
1. Find the active session from current state
2. Get session completion notes from user if needed
3. Update daily summary with today's work
4. Update current state removing active session and setting next priorities
5. Display comprehensive completion summary
</ultrathink>

### 1. Get current state
Try to get structured state first:
Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  type: "state",
  id: "current"
})

If state item exists:
- Use the content and related fields
- Active session can be found in related_documents

If state item doesn't exist (404 error):
- Fall back to: mcp__shirokuma_knowledge_base__get_current_state()
- Parse to find active session information

Parse to find:
- Active session information from "## アクティブセッション" or "## Active Session"
- Current statistics
- Any existing priorities

If no active session found:
- Inform user there's no active session to close
- Exit gracefully

### 2. Get active session details
If active session ID found in current_state:
Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  "type": "sessions",
  "id": active_session_id
})

<ultrathink>
Getting completion notes from the user helps document what was accomplished
and any important findings during the session.
</ultrathink>

Ask user for session completion notes:
"Would you like to add any completion notes for this session? (optional)"

If user provides notes, update session:
mcp__shirokuma_knowledge_base__update_item({
  "type": "sessions",
  "id": active_session_id,
  "content": user_provided_notes
})

### 3. Get today's work data
Get today's date: !`date +"%Y-%m-%d"`

Retrieve today's sessions:
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "sessions", 
  "start_date": today, 
  "end_date": today 
})

Retrieve today's issues (to track progress):
Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "start_date": today, 
  "includeClosedStatuses": true 
})

### 4. Update daily summary
Get existing daily:
Execute: mcp__shirokuma_knowledge_base__get_item_detail({
  "type": "dailies",
  "id": today
})

Update daily content with:
- All sessions from today (mark completed session)
- Completed tasks (Closed issues)
- Tasks in progress
- Technical learnings (if any)
- Plans for tomorrow

Structure:
```markdown
## 今日の作業セッション
- Session title (sessions-ID)
- **[Completed] Session title (sessions-ID)** ← Mark just-completed session

## 完了したタスク
- issues-ID: title (for Closed issues)

## 進行中のタスク
- issues-ID: title (for In Progress issues)

## 技術的な学び
- [Technical learnings from today]

## 明日の予定
- [Next priorities from current_state]

## メモ
- 作業時間: [first_session_time - current_time]

## セッション詳細
### Session title (sessions-ID)
- [Session description and accomplishments]
- [Completion notes if provided]
```

Execute: mcp__shirokuma_knowledge_base__update_item({
  "type": "dailies",
  "id": today,
  "content": updated_content,
  "related_tasks": [all issue IDs worked on today],
  "related_documents": [all session IDs from today]
})

### 5. Get all open issues for current state

<ultrathink>
I need to analyze the remaining open issues to set appropriate priorities
for the next work session. Focus on high-priority items.
</ultrathink>

Execute: mcp__shirokuma_knowledge_base__get_items({ 
  "type": "issues", 
  "includeClosedStatuses": false 
})

Count by priority and identify top 3 high-priority issues.

### 6. Update current state
Remove active session section and update statistics:

New structure:
```markdown
プロジェクト: Shirokuma MCP Knowledge Base
最終更新: [current_datetime]

## 現在の状況
- オープンイシュー: X件
  - High: Y件
  - Medium: Z件  
  - Low: W件
- 本日完了: N件
- 進行中: M件

## 本日のデイリー
- デイリーID: dailies-[today]
- 完了タスク: N件
- 作業セッション: S件

## 次の優先事項
- [Top 3 high priority issues]

## 最近の更新
- [today]: [summary of completed work]
- [previous updates...]

## 次回セッションへの引き継ぎ事項
- [Key findings or blockers from today]
- [Recommendations for next session]
- [Any unfinished work that needs continuation]

## 関連ドキュメント
- [Important docs for reference]
```

If using state item:
Execute: mcp__shirokuma_knowledge_base__update_item({
  type: "state",
  id: "current",
  content: updated_current_state,
  related_documents: [daily-id, ...important_docs], // Remove active session
  related_tasks: [next_priority_issues]
})

If using current_state:
Execute: mcp__shirokuma_knowledge_base__update_current_state({
  content: updated_current_state
})

### 7. Display completion summary
Show user:
- Session completion confirmation
- Today's accomplishments
- Updated priorities
- Next recommended actions

Format:
```
✅ 作業セッション完了

## 本日の成果
- 完了セッション: [session-title]
- 完了タスク: X件
- 作業時間: [duration]

## 現在の状態を更新しました
- オープンイシュー: Y件 (High: A, Medium: B, Low: C)
- 次の優先事項を設定

## 次回の推奨アクション
- [Based on priorities and handover notes]

お疲れ様でした！
```

## Key Improvements
1. **Active Session Tracking**: current_state tracks the active session
2. **Session Lifecycle**: Clear start/end with proper cleanup
3. **Daily Integration**: Daily summary links to all sessions and issues
4. **Handover Notes**: current_state includes context for next session
5. **Related Documents**: Important docs are referenced in current_state
6. **Progress Visibility**: Clear tracking of completed vs open work