/**
 * Test Suite: Agent MCP Tool Definitions
 * Purpose: Verify each agent has the correct MCP tools defined
 * Issue: issues-179 - サブエージェントのMCPアクセス問題
 * 
 * This test should FAIL initially (TDD RED phase)
 * Each agent needs specific MCP tools based on their permissions
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Helper function to extract tools from agent markdown file
 * @param agentPath - Path to agent markdown file
 * @returns Array of tool names
 */
function extractAgentTools(agentPath: string): string[] {
  const content = readFileSync(agentPath, 'utf8');
  const lines = content.split('\n');
  
  // Find the tools line in the frontmatter
  const toolsLine = lines.find(line => line.startsWith('tools:'));
  if (!toolsLine) {
    return [];
  }
  
  // Extract tools list from the line
  const toolsMatch = toolsLine.match(/tools:\s*(.+)/);
  if (!toolsMatch) {
    return [];
  }
  
  // Parse the tools list (comma-separated)
  const toolsString = toolsMatch[1];
  const tools = toolsString
    .split(',')
    .map(tool => tool.trim())
    .filter(tool => tool.length > 0);
  
  return tools;
}

/**
 * Helper function to count MCP-specific tools
 * @param tools - Array of tool names
 * @returns Array of MCP tool names
 */
function getMcpTools(tools: string[]): string[] {
  return tools.filter(tool => tool.startsWith('mcp__shirokuma-knowledge-base__'));
}

describe('Agent MCP Tool Definitions', () => {
  const agentsDir = join(process.cwd(), '.claude', 'agents');
  
  describe('shirokuma-tester agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-tester.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 8 MCP tools', () => {
      expect(mcpTools.length).toBe(8);
    });
    
    test('should have get_items tool for listing items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating test results', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for finding related items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_statuses tool for status management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for tag retrieval', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
  });
  
  describe('shirokuma-designer agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-designer.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 9 MCP tools', () => {
      expect(mcpTools.length).toBe(9);
    });
    
    test('should have get_items tool for listing items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating decisions and docs', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for finding related items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_statuses tool for status management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for tag retrieval', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
    
    test('should have get_types tool for type management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_types');
    });
  });
  
  describe('shirokuma-programmer agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-programmer.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 7 MCP tools', () => {
      expect(mcpTools.length).toBe(7);
    });
    
    test('should have get_items tool for listing items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating knowledge items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for finding related items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_tags tool for tag retrieval', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
  });
  
  describe('shirokuma-reviewer agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-reviewer.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 10 MCP tools', () => {
      expect(mcpTools.length).toBe(10);
    });
    
    test('should have get_items tool for listing items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating review feedback', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for finding related items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_statuses tool for status management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for tag retrieval', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
    
    test('should have get_types tool for type management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_types');
    });
    
    test('should have get_relationships tool for tracking dependencies', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_relationships');
    });
  });
  
  describe('shirokuma-researcher agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-researcher.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 9 MCP tools', () => {
      expect(mcpTools.length).toBe(9);
    });
    
    test('should have get_items tool for listing items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating research findings', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for comprehensive searching', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_statuses tool for status management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for tag retrieval', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
    
    test('should have get_types tool for type management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_types');
    });
  });
  
  describe('shirokuma-issue-manager agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-issue-manager.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 8 MCP tools', () => {
      expect(mcpTools.length).toBe(8);
    });
    
    test('should have get_items tool for listing issues', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading issue details', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating new issues', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating issue status', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for finding related issues', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_statuses tool for issue status management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for tag management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
  });
  
  describe('shirokuma-methodology-keeper agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-methodology-keeper.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 8 MCP tools', () => {
      expect(mcpTools.length).toBe(8);
    });
    
    test('should have get_items tool for listing methodology items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading methodology details', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating best practices', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating methodology', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have search_items tool for finding patterns', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for methodology search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_tags tool for methodology tags', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
    
    test('should have get_types tool for methodology types', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_types');
    });
  });
  
  describe('shirokuma-knowledge-curator agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-knowledge-curator.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 11 MCP tools', () => {
      expect(mcpTools.length).toBe(11);
    });
    
    test('should have get_items tool for listing knowledge items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for reading knowledge details', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating knowledge entries', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for updating knowledge', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have delete_item tool for removing obsolete knowledge', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__delete_item');
    });
    
    test('should have search_items tool for comprehensive knowledge search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for categorized search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_relationships tool for knowledge connections', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_relationships');
    });
    
    test('should have get_statuses tool for knowledge status tracking', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for knowledge categorization', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
    
    test('should have get_types tool for knowledge type management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_types');
    });
  });
  
  describe('shirokuma-system-harmonizer agent', () => {
    const agentPath = join(agentsDir, 'shirokuma-system-harmonizer.md');
    const tools = extractAgentTools(agentPath);
    const mcpTools = getMcpTools(tools);
    
    test('should have MCP tools defined', () => {
      expect(mcpTools.length).toBeGreaterThan(0);
    });
    
    test('should have exactly 12 MCP tools (most comprehensive access)', () => {
      expect(mcpTools.length).toBe(12);
    });
    
    test('should have get_items tool for system-wide item listing', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_items');
    });
    
    test('should have get_item_detail tool for detailed inspection', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_item_detail');
    });
    
    test('should have create_item tool for creating system documentation', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_item');
    });
    
    test('should have update_item tool for system-wide updates', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__update_item');
    });
    
    test('should have delete_item tool for cleanup operations', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__delete_item');
    });
    
    test('should have search_items tool for comprehensive system search', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items');
    });
    
    test('should have search_items_by_tag tool for tag-based analysis', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__search_items_by_tag');
    });
    
    test('should have get_relationships tool for dependency tracking', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_relationships');
    });
    
    test('should have create_relationship tool for linking items', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__create_relationship');
    });
    
    test('should have get_statuses tool for system status overview', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_statuses');
    });
    
    test('should have get_tags tool for system-wide tag management', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_tags');
    });
    
    test('should have get_types tool for type consistency checking', () => {
      expect(mcpTools).toContain('mcp__shirokuma-knowledge-base__get_types');
    });
  });
  
  describe('Tool definition format', () => {
    test('shirokuma-tester should use "tools" key not "allowed-tools"', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-tester.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-designer should use "tools" key not "allowed-tools"', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-designer.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-programmer should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-programmer.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-reviewer should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-reviewer.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-researcher should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-researcher.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-issue-manager should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-issue-manager.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-methodology-keeper should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-methodology-keeper.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-knowledge-curator should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-knowledge-curator.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
    
    test('shirokuma-system-harmonizer should use "tools" key consistently', () => {
      const content = readFileSync(join(agentsDir, 'shirokuma-system-harmonizer.md'), 'utf8');
      expect(content).toMatch(/^tools:/m);
      expect(content).not.toMatch(/^allowed-tools:/m);
    });
  });
});