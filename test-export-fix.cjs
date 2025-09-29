// Test script for auto-export fix
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set export directory
const exportDir = '/tmp/test-export-' + Date.now();
process.env.SHIROKUMA_EXPORT_DIR = exportDir;

// Create export directory
fs.mkdirSync(exportDir, { recursive: true });
console.log('Export directory:', exportDir);

// Start MCP server
const server = spawn('node', ['dist/src/mcp/server.js'], {
  env: { ...process.env, SHIROKUMA_EXPORT_DIR: exportDir },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
server.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Parse JSON-RPC response
  try {
    const lines = output.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.includes('"result"')) {
        const response = JSON.parse(line);
        console.log('Response received:', JSON.stringify(response.result, null, 2));
        
        // Check exported file after a delay to allow export to complete
        setTimeout(() => {
          const files = fs.readdirSync(path.join(exportDir, 'issue'), { recursive: true });
          if (files.length > 0) {
            const exportedFile = path.join(exportDir, 'issue', files[0]);
            const content = fs.readFileSync(exportedFile, 'utf-8');
            console.log('\n=== Exported File Content ===');
            console.log(content.substring(0, 500)); // First 500 chars
            
            // Check if AI fields are present in frontmatter
            if (content.includes('aiSummary:') && !content.includes('aiSummary: null')) {
              console.log('\n✅ SUCCESS: AI summary is present in frontmatter!');
            } else {
              console.log('\n❌ ISSUE: AI summary is missing or null in frontmatter');
            }
          } else {
            console.log('\nNo exported files found');
          }
          
          // Cleanup and exit
          server.kill();
          process.exit(0);
        }, 2000);
      }
    }
  } catch (e) {
    // Not JSON output
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Send create_item request
setTimeout(() => {
  const request = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'create_item',
      arguments: {
        type: 'issue',
        title: 'Test Export Fix',
        description: 'Testing if AI enrichment data appears in export',
        content: 'This item should have complete frontmatter with AI-generated summary and keywords after the fix.',
        status: 'Open',
        priority: 'HIGH',
        tags: ['test', 'export-fix', 'ai-enrichment']
      }
    },
    id: 1
  };
  
  console.log('Sending create_item request...');
  server.stdin.write(JSON.stringify(request) + '\n');
}, 1000);

// Timeout safety
setTimeout(() => {
  console.log('\nTimeout reached, terminating...');
  server.kill();
  process.exit(1);
}, 10000);