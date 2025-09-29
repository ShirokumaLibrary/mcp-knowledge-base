---
id: 45
type: system_state
version: "0.9.0"
tags: ["v0.9.0","release","handoff"]
isActive: true
createdAt: 2025-08-29T07:48:25.000Z
updatedAt: 2025-08-29T07:48:25.000Z
---

## Recent Context

### Last Session (session-175)
- **Duration**: Approx. 40 minutes
- **Completed**: v0.9.0 release with auto-export feature and README documentation
- **Published**: @shirokuma-library/mcp-knowledge-base@0.9.0 to npm

## Next Priorities

1. **Push v0.9.0 branch to origin**
   - Local branch is 3 commits ahead
   - Run: `git push origin v0.9.0`

2. **Open Issues to Address**
   - #173: Spec系コマンドで計画中に作業を始めてしまう問題
   - #149: spec系コマンドで計画後に自動的に作業を開始してしまう問題
   - #78: PrismaからTypeORMへの移行（v0.9.0）
   - #157: セマンティックインデックスの再導入検討

## System State
- **Version**: v0.9.0 (published)
- **Database**: TypeORM with SQLite
- **Auto-Export**: Functional with SHIROKUMA_EXPORT_DIR
- **Documentation**: README.md updated for Claude Code users