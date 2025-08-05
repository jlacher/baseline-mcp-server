import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { McpServer } from "npm:@modelcontextprotocol/sdk@^1.11.1/server/mcp.js";
import { z } from "npm:zod@^3.24.4";
import {
  getNegatedBrowserBaselineStatusAsMCPContent,
  getWebFeatureBaselineStatusAsMCPContent,
} from "./tools/index.ts";
import { BROWSERS, type Browsers } from "./types.ts";
import DenoJSON from "./deno.json" with { type: "json" };

// MCPサーバーの初期化
const server = new McpServer({
  name: "Baseline MCP Server",
  version: DenoJSON.version,
  capabilities: {
    tools: {},
  },
});

// 特定の機能のBaselineステータスを取得
server.tool(
  "get_web_feature_baseline_status",
  "クエリを指定し、Web Platform Dashboardからfeatureの結果を取得します",
  {
    query: z.string().array().describe("調べたい機能の名前"),
  },
  async ({ query }: { query: string | string[] }) => {
    return await getWebFeatureBaselineStatusAsMCPContent(query);
  },
);

// 特定のブラウザを除外した機能を検索
server.tool(
  "get_negated_browser_baseline_status",
  "特定のブラウザを除外して、Web Platform Dashboardからfeatureの結果を取得します",
  {
    query: z.enum(BROWSERS).describe(
      "除外したいブラウザの名前（chrome, edge, firefox, safari）",
    ),
  },
  async ({ query }: { query: Browsers }) => {
    return await getNegatedBrowserBaselineStatusAsMCPContent(query);
  },
);

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Root endpoint - show server info
  if (url.pathname === "/") {
    const info = {
      name: "Baseline MCP Server",
      version: DenoJSON.version,
      description: "Web Platform APIのサポート状況を提供するModel Context Protocolサーバー",
      endpoints: {
        "/mcp": "MCP protocol endpoint",
        "/health": "Health check endpoint"
      },
      tools: [
        "get_web_feature_baseline_status",
        "get_negated_browser_baseline_status"
      ]
    };
    
    return new Response(JSON.stringify(info, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }

  // Health check endpoint
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }

  // MCP endpoint
  if (url.pathname === "/mcp" && request.method === "POST") {
    try {
      const body = await request.json();
      const response = await server.handleRequest(body);
      
      return new Response(JSON.stringify(response), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      console.error("MCP request error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Internal server error",
          message: error.message 
        }), 
        { 
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }

  // 404 for other paths
  return new Response("Not Found", { 
    status: 404,
    headers: corsHeaders
  });
}

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Baseline MCP Server starting on port ${port}`);
console.log(`Visit http://localhost:${port} for server info`);

serve(handler, { port });
