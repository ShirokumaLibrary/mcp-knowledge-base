# [機能名] Configuration

## Environment Variables
<!-- 環境変数：新たに必要な環境変数 -->
```bash
# FEATURE_NAME_ENABLED=true
# FEATURE_NAME_OPTION=value
```

## Configuration Files
<!-- 設定ファイル：必要な設定ファイルの変更 -->

### package.json (if Node.js)
```json
{
  "scripts": {
    
  },
  "dependencies": {
    
  }
}
```

### Database Configuration
```yaml
# Database schema changes
```

## Feature Flags
<!-- フィーチャーフラグ：機能の有効/無効制御 -->
```yaml
features:
  feature_name:
    enabled: false
    rollout_percentage: 0
```

## Agent Updates
<!-- エージェント更新：影響を受けるエージェント -->

### Affected Agents
- [ ] shirokuma-programmer
- [ ] shirokuma-tester
- [ ] shirokuma-reviewer
- [ ] Other: 

### Required Changes
```markdown
# Example: New tools to add to agent
tools: existing_tools, new_tool_1, new_tool_2
```

## Command Updates
<!-- コマンド更新：影響を受けるコマンド -->

### Affected Commands
- [ ] ai-go
- [ ] ai-start
- [ ] Other: 

## MCP Configuration
<!-- MCP設定：新しいツールやタイプ -->

### New Tools
```yaml
# Tool definitions
```

### New Types
```yaml
# Type definitions
```

### New Tags
```yaml
# Tag definitions
```

## Rollback Plan
<!-- ロールバック計画：問題発生時の戻し方 -->
1. 
2. 
3. 