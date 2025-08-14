# Baseline MCP Server

A Model Context Protocol (MCP) server that allows you to query the baseline status of web platform features using data from [webstatus.dev](https://webstatus.dev/).

## VS Code setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the local MCP server:
   ```bash
   npm run build
   ```

3. Create a `.vscode/mcp.json` file in your workspace and add the following configuration (example for GitHub Copilot):
   ```json
   {
     "servers": {
       "baseline-mcp-server": {
         "command": "node",
         "args": [
           "${workspaceFolder}/dist/index.js"
         ],
         "env": {
           "API_BASE_URL": "https://api.webstatus.dev"
         }
       }
     }
   }
   ```

4. Open an MCP-supported client extension like Copilot Chat in Agent mode
5. Select **Agent** from the chat mode dropdown list
6. Select a model like "Claude 3.5 Sonnet"
7. Enter your Baseline-related prompt

## Cloudflare Workers Deployment

You can deploy the server to Cloudflare Workers for a remote setup. The configuration will work globally without region-specific changes.

1. **Install Wrangler** (Cloudflare Workers CLI):
   ```bash
   npm install -g wrangler
   ```

2. **Register for Cloudflare** (if needed):
   - Create a free Cloudflare account at [cloudflare.com](https://cloudflare.com)
   - No domain is required for Workers deployment

3. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

4. **Build and deploy the worker:**
   ```bash
   npm run deploy
   ```
   This will build the worker and deploy it globally using the configuration in `wrangler.toml`.

5. **Configure VS Code for the remote server:**
   Update your `.vscode/mcp.json` to include the remote server configuration:
   ```json
   {
     "servers": {
       "baseline-mcp-server": {
         "url": "https://baseline-mcp-server.YOUR_WORKER_SUBDOMAIN.workers.dev",
         "type": "http"
       }
     }
   }
   ```
   Replace `YOUR_WORKER_SUBDOMAIN` with your Cloudflare account's workers subdomain.

Note: The worker configuration uses Cloudflare's global network by default, so no region-specific setup is needed. Requests will automatically be routed to the nearest edge location.

## Example

**Prompt**

```
What's the Baseline status of view transitions?
```

**Response**

```
I'll check the baseline status for the View Transitions API using the baseline tools.
```

<details>
<summary>Ran  `get_web_feature_baseline_status`</summary>

**Input**
```json
{
  "query": [
    "view transitions"
  ]
}
```

**Output**

# 🌐 Baseline Status: **view transitions**

Found **2** features:

## 1. Cross-document view transitions

**Status:** ⚠️ **LIMITED**

**Browser Support:**
- **Chrome:** ✅ 6/11/2024 (v126)
- **Chrome Android:** ✅ 6/11/2024 (v126)
- **Edge:** ✅ 6/13/2024 (v126)
- **Safari:** ✅ 12/11/2024 (v18.2)
- **Safari iOS:** ✅ 12/11/2024 (v18.2)

**Usage Statistics:**
- **Chrome:** 10.7649% of daily page views

**Web Platform Tests:**
- **Chrome:** 🟡 82.3% pass rate
- **Chrome Android:** 🟠 66.1% pass rate
- **Edge:** 🟢 90.3% pass rate
- **Firefox:** 🔴 1.6% pass rate
- **Safari:** 🔴 45.2% pass rate

**Specifications:**
1. [View Specification](https://drafts.csswg.org/css-view-transitions-2/#cross-doc-opt-in)

**Recommendation:** 🔴 Consider polyfills or alternatives

---

## 2. View transitions

**Status:** ⚠️ **LIMITED**

**Browser Support:**
- **Chrome:** ✅ 3/7/2023 (v111)
- **Chrome Android:** ✅ 3/7/2023 (v111)
- **Edge:** ✅ 3/13/2023 (v111)
- **Safari:** ✅ 9/16/2024 (v18)
- **Safari iOS:** ✅ 9/16/2024 (v18)

**Usage Statistics:**
- **Chrome:** 0.2001% of daily page views

**Web Platform Tests:**
- **Chrome:** 🟡 87.2% pass rate
- **Chrome Android:** 🔴 23.8% pass rate
- **Edge:** 🟢 93.1% pass rate
- **Firefox:** 🔴 3.3% pass rate
- **Safari:** 🟡 79.8% pass rate

**Specifications:**
1. [View Specification](https://drafts.csswg.org/css-view-transitions-1/)

**Recommendation:** 🔴 Consider polyfills or alternatives

</details>

```
Based on the baseline status check, here's what we know about View Transitions:

1. Same-document View Transitions:
• Has LIMITED support status
• Supported in Chrome/Edge (since v111, March 2023)
• Recently added to Safari (v18, September 2024)
• Has relatively low usage (0.2% of Chrome page views)
• Test coverage varies significantly across browsers (87-93% in Chrome/Edge, but only 24% in Chrome Android)

2. Cross-document View Transitions:
• Also has LIMITED support status
• Newer feature with broader browser support:
    ○ Chrome/Edge: v126 (June 2024)
    ○ Safari: v18.2 (December 2024)
• Higher usage than same-document transitions
```



## Available Tools

### 1. `get_web_feature_baseline_status`

Get comprehensive baseline information for one or more web platform features.

Parameters:
- `query` (required): An array of strings with the names of the features to search for
- `include_browser_details` (optional, default: true): Whether to include browser implementation details
- `include_usage_stats` (optional, default: true): Whether to include usage statistics
- `include_test_results` (optional, default: true): Whether to include test results from Web Platform Tests
- `include_specs` (optional, default: true): Whether to include links to the feature's specifications
- `limit` (optional, default: 10): The maximum number of results to return (between 1 and 20)

### 2. `get_baseline_summary`

Get an overview of the Baseline system and its status categories. This tool takes no parameters.

## Resources

- [Web Platform Status Dashboard](https://webstatus.dev/) - Source of baseline data and browser compatibility information
- [Baseline MCP Server (Deno)](https://github.com/yamanoku/baseline-mcp-server) - Alternative implementation in Deno
  - [Chrome Labs Baseline MCP Demo](https://github.com/GoogleChromeLabs/baseline-demos/tree/main/tooling/mcp) - Example of using this MCP server in a project

## Development

To add new tools or modify existing ones:

1.  Add or modify the tool's logic in `src/tools/baseline-tools.ts`.
2.  Register the tool and its Zod schema in `src/index.ts`.

## License

This project is licensed under the MIT License.
