// web-server.ts - HTTP wrapper for Deno Deploy
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// Import your MCP server logic
// You might need to adapt this import based on the actual structure
// import { BaselineMCPServer } from "./baseline-mcp-server.ts";

// Simple HTTP handler that wraps the MCP server
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  // Handle CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Health check endpoint
  if (url.pathname === "/" || url.pathname === "/health") {
    return new Response(
      JSON.stringify({ 
        status: "ok", 
        service: "Baseline MCP Server",
        endpoints: {
          health: "/health",
          mcp: "/mcp",
          info: "/info"
        }
      }), 
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }

  // Info endpoint
  if (url.pathname === "/info") {
    return new Response(
      JSON.stringify({
        name: "Baseline MCP Server",
        description: "Provides Web Platform API baseline compatibility status",
        version: "1.0.0",
        api_source: "https://api.webstatus.dev"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }

  // MCP endpoint - handle MCP protocol requests
  if (url.pathname === "/mcp" && (req.method === "POST" || req.method === "GET")) {
    try {
      const body = await req.json();
      
      // Basic MCP request handling
      if (body.method === "tools/list") {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            result: {
              tools: [
                {
                  name: "get_web_feature_baseline_status",
                  description: "Get Web Platform API baseline compatibility status",
                  inputSchema: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "Web feature or API name to search for"
                      }
                    },
                    required: ["query"]
                  }
                }
              ]
            },
            id: body.id
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }

      // Handle tool calls
      if (body.method === "tools/call" && body.params?.name === "get_web_feature_baseline_status") {
        const query = body.params.arguments?.query;
        
        if (!query) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32602,
                message: "Invalid params: query required"
              },
              id: body.id
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        // Call the Web Platform Dashboard API
        try {
          const apiUrl = `https://api.webstatus.dev/v1/features?q=${encodeURIComponent(query)}`;
          const apiResponse = await fetch(apiUrl);
          
          if (!apiResponse.ok) {
            throw new Error(`API request failed: ${apiResponse.status}`);
          }

          const apiData = await apiResponse.json();
          
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              result: {
                query: query,
                features: apiData.features || [],
                source: "Web Platform Dashboard API"
              },
              id: body.id
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: "Internal error",
                data: error.message
              },
              id: body.id
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }
      }

      // Unknown method
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: "Method not found"
          },
          id: body.id
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: {
            code: -32700,
            message: "Parse error"
          }
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
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
console.log("Starting Baseline MCP Server on Deno Deploy...");
await serve(handler, { port: 8000 });
