# Baseline MCP Server

This project provides a Model Context Protocol (MCP) server that allows you to query the baseline status of web platform features, using data from [webstatus.dev](https://webstatus.dev/). It can be used as a local command-line tool or integrated with compatible clients like VS Code.

## Features

- **Detailed Feature Analysis**: Get comprehensive baseline information for any web platform feature.
- **Customizable Output**: Choose to include details like browser implementation, usage statistics, test results, and specification links.
- **Baseline Summary**: Quickly get an overview of the Baseline system and its status categories.
- **Easy Integration**: Works with any MCP-compatible client.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jlacher/baseline-mcp-server.git
    cd baseline-mcp-server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the project:**
    ```bash
    npm run build:all
    ```

## Usage

### As a Command-Line Tool

You can run the server directly from the command line:

```bash
npm run dev
```

This will start the server, and it will listen for requests on standard I/O.

### With VS Code (Local)

To use the local server with VS Code, you need to configure it in your `.vscode/mcp.json` file.

1.  Create a `.vscode/mcp.json` file in your workspace root if it doesn't exist.
2.  Add the following configuration:

    ```json
    {
      "servers": {
        "local-baseline-status": {
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

3.  Open an MCP-supported client extension like Copilot Chat in Agent mode, which starts the MCP server.
    - For GitHub Copilot Chat:
        1. Open the Chat view (`⌃⌘I`).
        2. Select **Agent** from the chat mode dropdown list.
        3. Select a model like "Claude 3.5 Sonnet".
        4. Enter your Baseline-related prompt.

### Remote Deployment (Cloudflare Workers)

You can also deploy the server to Cloudflare Workers for a remote setup.

1.  **Deploy the worker:**
    ```bash
    npm run deploy
    ```
    This will deploy the worker with the name `baseline-mcp-server`.

2.  **Configure VS Code for the remote server:**
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
    Replace `YOUR_WORKER_SUBDOMAIN` with your actual Cloudflare Workers subdomain.

## Available Tools

This server exposes the following tools:

### 1. `get_web_feature_baseline_status`

Get comprehensive baseline information for one or more web platform features.

**Parameters:**

-   `query` (required): An array of strings with the names of the features to search for.
-   `include_browser_details` (optional, default: `true`): Whether to include browser implementation details.
-   `include_usage_stats` (optional, default: `true`): Whether to include usage statistics.
-   `include_test_results` (optional, default: `true`): Whether to include test results from Web Platform Tests.
-   `include_specs` (optional, default: `true`): Whether to include links to the feature's specifications.
-   `limit` (optional, default: `10`): The maximum number of results to return (between 1 and 20).

### 2. `get_baseline_summary`

Get an overview of the Baseline system and its status categories. This tool takes no parameters.

## Development

To add new tools or modify existing ones:

1.  Add or modify the tool's logic in `src/tools/baseline-tools.ts`.
2.  Register the tool and its Zod schema in `src/index.ts`.

## License

This project is licensed under the MIT License.
