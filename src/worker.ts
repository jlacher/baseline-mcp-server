import { BaselineTools } from './tools/baseline-tools.js';

interface Environment {
  API_BASE_URL?: string;
}

interface MCPRequest {
  jsonrpc: string;
  method: string;
  id?: string | number | null;
  params?: {
    name?: string;
    arguments?: any;
  };
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (request.method === 'GET') {
      const healthInfo = {
        name: 'Baseline MCP Server',
        version: '1.0.0',
        status: 'ok',
        deployment: 'cloudflare-workers',
        ts: Date.now(),
        available_tools: [
          'get_web_feature_baseline_status',
          'get_baseline_summary'
        ],
        data_source: 'webstatus.dev API'
      };

      return new Response(JSON.stringify(healthInfo), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Handle MCP requests
    if (request.method === 'POST') {
      try {
        const body: MCPRequest = await request.json() as MCPRequest;

        if (body.jsonrpc !== '2.0') {
          return createErrorResponse(body.id ?? null, -32600, 'Invalid JSON-RPC version', corsHeaders);
        }

        const tools = new BaselineTools(env);
        let result: any;

        switch (body.method) {
          case 'initialize':
            result = {
              protocolVersion: '2025-06-18',
              capabilities: { tools: {} },
              serverInfo: {
                name: 'Baseline MCP Server',
                version: '1.0.0',
                description: 'Web Platform Baseline status via Cloudflare Workers'
              }
            };
            break;
          case 'notifications/initialized':
            result = {};
            break;
          case 'ping':
            result = {
              status: 'pong',
              ts: Date.now()
            };
            break;

          case 'tools/list':
            result = {
              tools: [
                {
                  name: 'get_web_feature_baseline_status',
                  description: 'Get comprehensive baseline information for web platform features',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: { type: 'array', items: { type: 'string' } },
                      include_browser_details: { type: 'boolean', default: true },
                      include_usage_stats: { type: 'boolean', default: true },
                      include_test_results: { type: 'boolean', default: true },
                      include_specs: { type: 'boolean', default: true },
                      limit: { type: 'number', minimum: 1, maximum: 20, default: 10 }
                    },
                    required: ['query']
                  }
                },
                {
                  name: 'get_baseline_summary',
                  description: 'Get overview of the Baseline system and status categories',
                  inputSchema: {
                    type: 'object',
                    properties: {}
                  }
                }
              ]
            };
            break;

          case 'tools/call':
            const { name, arguments: args } = body.params || {};

            if (!name) {
              return createErrorResponse(body.id ?? null, -32602, 'Tool name is required', corsHeaders);
            }

            if (name === 'get_web_feature_baseline_status') {
              if (!args?.query || !Array.isArray(args.query)) {
                return createErrorResponse(body.id ?? null, -32602, 'Query parameter is required and must be an array', corsHeaders);
              }
              result = await tools.getBaselineStatus(args);
            } else if (name === 'get_baseline_summary') {
              result = tools.getBaselineSummary(args || {});
            } else {
              return createErrorResponse(body.id ?? null, -32601, `Unknown tool: ${name}`, corsHeaders);
            }
            break;

          default:
            return createErrorResponse(body.id ?? null, -32601, `Method not found: ${body.method}`, corsHeaders);
        }

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: body.id ?? null,
          result
        };

        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        console.error('Request processing error:', error);

        const errorResponse: MCPResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
};

function createErrorResponse(id: string | number | null, code: number, message: string, corsHeaders: Record<string, string>): Response {
  const errorResponse: MCPResponse = {
    jsonrpc: '2.0',
    id,
    error: { code, message }
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}