#!/usr/bin/env node
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BaselineTools } from './tools/baseline-tools.js';
import { z } from 'zod';

const server = new McpServer(
  {
    name: 'Baseline MCP Server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

const tools = new BaselineTools();

// Register tools using the correct MCP SDK signature
server.tool(
  'get_web_feature_baseline_status',
  'Get comprehensive baseline information for web platform features',
  {
    query: z.array(z.string()).describe('Search terms for web features'),
    include_browser_details: z.boolean().default(true).describe('Include browser implementation details'),
    include_usage_stats: z.boolean().default(true).describe('Include usage statistics'),
    include_test_results: z.boolean().default(true).describe('Include test results'),
    include_specs: z.boolean().default(true).describe('Include specification links'),
    limit: z.number().min(1).max(20).default(10).describe('Maximum number of results')
  },
  async (args) => {
    const {
      query,
      include_browser_details = true,
      include_usage_stats = true,
      include_test_results = true,
      include_specs = true,
      limit = 10
    } = args;

    const result = await tools.getBaselineStatus({
      query,
      include_browser_details,
      include_usage_stats,
      include_test_results,
      include_specs,
      limit
    });

    return result;
  }
);

server.tool(
  'get_baseline_summary',
  'Get overview of the Baseline system and status categories',
  {},
  async () => {
    const result = tools.getBaselineSummary({});
    return result;
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🏠 Baseline MCP Server running on stdio');
  console.error('📊 Available tools: get_web_feature_baseline_status, get_baseline_summary');
  console.error('🌐 Data source: https://api.webstatus.dev');
}

process.on('SIGINT', () => {
  console.error('📴 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('📴 Shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Server error:', error);
  process.exit(1);
});