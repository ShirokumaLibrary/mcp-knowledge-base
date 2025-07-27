/**
 * @ai-context E2E workflow tests
 * @ai-pattern Real-world usage scenarios
 * @ai-critical Validates complete workflows
 */

import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import {
  setupE2ETest,
  callTool,
  runScenario,
  E2ETestContext
} from './setup-e2e.js';

describe('E2E: Workflow Tests', () => {
  let context: E2ETestContext;
  
  beforeAll(async () => {
    context = await setupE2ETest();
  }, 30000);
  
  afterAll(async () => {
    await context.cleanup();
  });
  
  describe('Project Management Workflow', () => {
    it('should support complete project workflow', async () => {
      const project: any = {};
      
      await runScenario('Project Management', [
        {
          name: 'Create project plan',
          action: async () => {
            return await callTool(context.client, 'create_item', {
              type: 'plans',
              title: 'E2E Test Project',
              content: 'Complete project management workflow test',
              start_date: '2024-01-01',
              end_date: '2024-06-30',
              priority: 'high',
              status: 'Planning',
              tags: ['project', 'e2e-workflow']
            });
          },
          assertions: (result) => {
            project.plan = result;
            expect(result.id).toBeDefined();
          }
        },
        
        {
          name: 'Create related issues',
          action: async () => {
            const issues = [];
            
            // Create multiple issues for the project
            issues.push(await callTool(context.client, 'create_item', {
              type: 'issues',
              title: 'Setup development environment',
              content: 'Configure all necessary tools and dependencies',
              priority: 'high',
              status: 'Open',
              tags: ['project', 'setup'],
              related_tasks: [`plans-${project.plan.id}`]
            }));
            
            issues.push(await callTool(context.client, 'create_item', {
              type: 'issues',
              title: 'Implement core features',
              content: 'Build the main functionality',
              priority: 'high',
              status: 'Open',
              tags: ['project', 'development'],
              related_tasks: [`plans-${project.plan.id}`]
            }));
            
            issues.push(await callTool(context.client, 'create_item', {
              type: 'issues',
              title: 'Write documentation',
              content: 'Create user and developer documentation',
              priority: 'medium',
              status: 'Open',
              tags: ['project', 'documentation'],
              related_tasks: [`plans-${project.plan.id}`]
            }));
            
            return issues;
          },
          assertions: (issues) => {
            project.issues = issues;
            expect(issues).toHaveLength(3);
            issues.forEach(issue => {
              expect(issue.related_tasks).toContain(`plans-${project.plan.id}`);
            });
          }
        },
        
        {
          name: 'Create project documentation',
          action: async () => {
            return await callTool(context.client, 'create_item', {
              type: 'docs',
              title: 'Project Overview',
              content: `# E2E Test Project

## Overview
This project demonstrates the complete workflow capabilities.

## Related Tasks
- Main Plan: plans-${project.plan.id}
- Setup Issue: issues-${project.issues[0].id}
- Core Features: issues-${project.issues[1].id}
- Documentation: issues-${project.issues[2].id}`,
              tags: ['project', 'overview'],
              related_tasks: [
                `plans-${project.plan.id}`,
                ...project.issues.map((i: any) => `issues-${i.id}`)
              ]
            });
          },
          assertions: (doc) => {
            project.doc = doc;
            expect(doc.related_tasks).toHaveLength(4);
          }
        },
        
        {
          name: 'Update issue status',
          action: async () => {
            // Mark setup as complete
            return await callTool(context.client, 'update_item', {
              type: 'issues',
              id: project.issues[0].id,
              status: 'Closed'
            });
          },
          assertions: (updated) => {
            expect(updated.status).toBe('Closed');
          }
        },
        
        {
          name: 'Create work session',
          action: async () => {
            return await callTool(context.client, 'create_session', {
              title: 'Project development work',
              content: 'Worked on core features implementation',
              category: 'Development',
              tags: ['project', 'development'],
              related_tasks: [`issues-${project.issues[1].id}`]
            });
          },
          assertions: (session) => {
            project.session = session;
            expect(session.id).toBeDefined();
            expect(session.related_tasks).toContain(`issues-${project.issues[1].id}`);
          }
        },
        
        {
          name: 'Search project items by tag',
          action: async () => {
            return await callTool(context.client, 'search_items_by_tag', {
              tag: 'project'
            });
          },
          assertions: (results) => {
            // Should find all project-related items
            const projectItems = results.filter((item: any) =>
              item.title.includes('E2E Test Project') ||
              item.title.includes('Setup development') ||
              item.title.includes('Project Overview') ||
              item.title.includes('Project development work')
            );
            
            expect(projectItems.length).toBeGreaterThanOrEqual(5);
          }
        },
        
        {
          name: 'Create daily summary',
          action: async () => {
            const today = new Date().toISOString().split('T')[0];
            
            return await callTool(context.client, 'create_summary', {
              date: today,
              title: 'Project Progress Summary',
              content: `## Today's Progress

- Completed environment setup
- Started core feature implementation
- Created project documentation

## Next Steps
- Continue feature development
- Update documentation`,
              tags: ['project', 'summary'],
              related_tasks: [`plans-${project.plan.id}`]
            });
          },
          assertions: (summary) => {
            project.summary = summary;
            expect(summary.date).toBeDefined();
          }
        },
        
        {
          name: 'Clean up project data',
          action: async () => {
            const deleteOps = [];
            
            // Delete all created items
            deleteOps.push(callTool(context.client, 'delete_item', {
              type: 'plans',
              id: project.plan.id
            }));
            
            project.issues.forEach((issue: any) => {
              deleteOps.push(callTool(context.client, 'delete_item', {
                type: 'issues',
                id: issue.id
              }));
            });
            
            deleteOps.push(callTool(context.client, 'delete_item', {
              type: 'docs',
              id: project.doc.id
            }));
            
            // Note: Sessions and summaries might have different deletion rules
            
            return await Promise.all(deleteOps);
          },
          assertions: (results) => {
            results.forEach(result => {
              expect(result.success).toBe(true);
            });
          }
        }
      ]);
    }, 120000);
  });
  
  describe('Knowledge Management Workflow', () => {
    it('should support knowledge base workflow', async () => {
      const kb: any = {};
      
      await runScenario('Knowledge Management', [
        {
          name: 'Create knowledge categories',
          action: async () => {
            const categories = [];
            
            categories.push(await callTool(context.client, 'create_item', {
              type: 'knowledge',
              title: 'JavaScript Best Practices',
              content: `# JavaScript Best Practices

## Code Style
- Use const/let instead of var
- Prefer arrow functions for callbacks
- Use template literals

## Error Handling
- Always catch promises
- Use try-catch for async/await
- Provide meaningful error messages`,
              tags: ['javascript', 'best-practices', 'kb']
            }));
            
            categories.push(await callTool(context.client, 'create_item', {
              type: 'knowledge',
              title: 'Testing Guidelines',
              content: `# Testing Guidelines

## Unit Tests
- Test one thing at a time
- Use descriptive test names
- Mock external dependencies

## Integration Tests
- Test real workflows
- Use realistic data
- Clean up after tests`,
              tags: ['testing', 'guidelines', 'kb']
            }));
            
            return categories;
          },
          assertions: (categories) => {
            kb.categories = categories;
            expect(categories).toHaveLength(2);
          }
        },
        
        {
          name: 'Link related knowledge',
          action: async () => {
            // Create a document that references both knowledge items
            return await callTool(context.client, 'create_item', {
              type: 'docs',
              title: 'Development Standards',
              content: 'Our development standards based on best practices',
              tags: ['standards', 'kb'],
              related_documents: kb.categories.map((k: any) => `knowledge-${k.id}`)
            });
          },
          assertions: (doc) => {
            kb.standards = doc;
            expect(doc.related_documents).toHaveLength(2);
          }
        },
        
        {
          name: 'Search knowledge base',
          action: async () => {
            return await callTool(context.client, 'search_all', {
              query: 'practices'
            });
          },
          assertions: (results) => {
            // Should find JavaScript best practices
            const found = results.knowledge.some((k: any) =>
              k.title.includes('JavaScript Best Practices')
            );
            expect(found).toBe(true);
          }
        },
        
        {
          name: 'Get all KB tags',
          action: async () => {
            return await callTool(context.client, 'get_tags');
          },
          assertions: (tags) => {
            const tagNames = tags.map((t: any) => t.name);
            expect(tagNames).toContain('kb');
            expect(tagNames).toContain('javascript');
            expect(tagNames).toContain('testing');
          }
        },
        
        {
          name: 'Clean up KB data',
          action: async () => {
            const deleteOps = [];
            
            kb.categories.forEach((cat: any) => {
              deleteOps.push(callTool(context.client, 'delete_item', {
                type: 'knowledge',
                id: cat.id
              }));
            });
            
            deleteOps.push(callTool(context.client, 'delete_item', {
              type: 'docs',
              id: kb.standards.id
            }));
            
            return await Promise.all(deleteOps);
          },
          assertions: (results) => {
            results.forEach(result => {
              expect(result.success).toBe(true);
            });
          }
        }
      ]);
    });
  });
  
  describe('Tag Management Workflow', () => {
    it('should support tag organization workflow', async () => {
      const testItems: any[] = [];
      
      await runScenario('Tag Management', [
        {
          name: 'Create items with hierarchical tags',
          action: async () => {
            const items = [];
            
            // Frontend related
            items.push(await callTool(context.client, 'create_item', {
              type: 'issues',
              title: 'React component bug',
              content: 'Component not rendering correctly',
              tags: ['frontend', 'react', 'bug']
            }));
            
            items.push(await callTool(context.client, 'create_item', {
              type: 'knowledge',
              title: 'Vue.js patterns',
              content: 'Common Vue.js design patterns',
              tags: ['frontend', 'vue', 'patterns']
            }));
            
            // Backend related
            items.push(await callTool(context.client, 'create_item', {
              type: 'issues',
              title: 'API endpoint error',
              content: 'POST endpoint returning 500',
              tags: ['backend', 'api', 'bug']
            }));
            
            items.push(await callTool(context.client, 'create_item', {
              type: 'docs',
              title: 'Database schema',
              content: 'Current database structure',
              tags: ['backend', 'database', 'schema']
            }));
            
            return items;
          },
          assertions: (items) => {
            testItems.push(...items);
            expect(items).toHaveLength(4);
          }
        },
        
        {
          name: 'Search by parent tag',
          action: async () => {
            const frontend = await callTool(context.client, 'search_items_by_tag', {
              tag: 'frontend'
            });
            
            const backend = await callTool(context.client, 'search_items_by_tag', {
              tag: 'backend'
            });
            
            return { frontend, backend };
          },
          assertions: ({ frontend, backend }) => {
            expect(frontend.length).toBe(2);
            expect(backend.length).toBe(2);
          }
        },
        
        {
          name: 'Search by specific tag',
          action: async () => {
            return await callTool(context.client, 'search_items_by_tag', {
              tag: 'bug'
            });
          },
          assertions: (results) => {
            expect(results.length).toBe(2);
            results.forEach((item: any) => {
              expect(item.tags).toContain('bug');
            });
          }
        },
        
        {
          name: 'Get tag statistics',
          action: async () => {
            const allTags = await callTool(context.client, 'get_tags');
            
            // Filter to our test tags
            return allTags.filter((tag: any) =>
              ['frontend', 'backend', 'bug', 'react', 'vue', 'api', 'database'].includes(tag.name)
            );
          },
          assertions: (tags) => {
            expect(tags.length).toBeGreaterThanOrEqual(7);
            
            const tagMap = new Map(tags.map((t: any) => [t.name, t]));
            
            // Parent tags should have higher counts
            const frontendTag = tagMap.get('frontend');
            const bugTag = tagMap.get('bug');
            
            expect(frontendTag).toBeDefined();
            expect(bugTag).toBeDefined();
          }
        },
        
        {
          name: 'Clean up tagged items',
          action: async () => {
            const deleteOps = testItems.map(item =>
              callTool(context.client, 'delete_item', {
                type: item.type,
                id: item.id
              })
            );
            
            return await Promise.all(deleteOps);
          },
          assertions: (results) => {
            expect(results).toHaveLength(4);
            results.forEach(result => {
              expect(result.success).toBe(true);
            });
          }
        }
      ]);
    });
  });
});