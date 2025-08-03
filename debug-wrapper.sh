#!/bin/bash
echo "Arguments received: $@" >> /tmp/mcp-debug.log
echo "Number of arguments: $#" >> /tmp/mcp-debug.log
echo "Environment variables:" >> /tmp/mcp-debug.log
env | grep -E "(MCP|NODE)" >> /tmp/mcp-debug.log
echo "---" >> /tmp/mcp-debug.log

# Try to run the actual command
exec shirokuma-mcp-knowledge-base "$@"