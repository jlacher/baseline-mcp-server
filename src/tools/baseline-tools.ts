// src/tools/baseline-tools.ts
import { HttpClient } from '../utils/http-client.js';

// Type definitions for the API response
interface BrowserImplementation {
  date: string;
  status: 'available' | 'unavailable';
  version?: string;
}

interface BaselineStatus {
  status: 'widely' | 'newly' | 'limited';
  low_date?: string;
  high_date?: string;
}

interface UsageStats {
  daily?: number;
}

interface TestResult {
  score: number;
}

interface SpecLink {
  link: string;
}

interface Feature {
  name: string;
  feature_id?: string;
  baseline?: BaselineStatus;
  browser_implementations?: Record<string, BrowserImplementation>;
  usage?: Record<string, UsageStats>;
  wpt?: {
    stable?: Record<string, TestResult>;
    experimental?: Record<string, TestResult>;
  };
  spec?: {
    links: SpecLink[];
  };
}

interface ApiResponse {
  data?: Feature[];
  features?: Feature[];
}

// Tool arguments interface
interface BaselineStatusArgs {
  query: string[];
  include_browser_details?: boolean;
  include_usage_stats?: boolean;
  include_test_results?: boolean;
  include_specs?: boolean;
  limit?: number;
}

interface BaselineSummaryArgs {
  // Empty object for summary (no arguments needed)
}

// Tool response interface that matches MCP SDK expectations
interface ToolResponse {
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: 'text';
    text: string;
    _meta?: { [x: string]: unknown } | undefined;
  }>;
  _meta?: { [x: string]: unknown } | undefined;
}

export class BaselineTools {
  private httpClient: HttpClient;
  private apiBase: string;

  constructor(env?: { API_BASE_URL?: string }) {
    this.httpClient = new HttpClient();
    // Remove process.env reference - use passed environment instead
    this.apiBase = env?.API_BASE_URL || 'https://api.webstatus.dev';
  }
  
  async getBaselineStatus(args: BaselineStatusArgs): Promise<ToolResponse> {
    const {
      query,
      include_browser_details = true,
      include_usage_stats = true,
      include_test_results = true,
      include_specs = true,
      limit = 10
    } = args;

    // Build API URL
    const url = new URL(`${this.apiBase}/v1/features`);
    url.searchParams.set('q', query.join(' '));
    url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 20)));

    // Fetch data
    const data: ApiResponse = await this.httpClient.fetchJson(url.toString());
    const features: Feature[] = data.data || data.features || [];

    // Format response
    const markdown = this.formatResponse(
      query,
      features,
      include_browser_details,
      include_usage_stats,
      include_test_results,
      include_specs
    );

    return {
      content: [{ type: 'text', text: markdown }]
    };
  }

  getBaselineSummary(args: BaselineSummaryArgs): ToolResponse {
    const text = 
      '# 🌐 Web Platform Baseline\n\n' +
      'Baseline gives you clear information about which web platform features are ready to use in your projects today.\n\n' +
      '## Status Categories\n\n' +
      '✅ **Widely Available**: The feature works across browsers and has been stable for 30+ months. Safe for production.\n\n' +
      '🆕 **Newly Available**: The feature works across modern browsers but may not work in older versions. Use with progressive enhancement.\n\n' +
      '⚠️ **Limited Support**: The feature is not supported in all major browsers. Consider polyfills or alternatives.\n\n' +
      '❓ **No Data**: Insufficient data to determine baseline status.\n\n' +
      'Learn more: https://web.dev/baseline/';

    return {
      content: [{ type: 'text', text }]
    };
  }

  private formatResponse(
    query: string[],
    features: Feature[],
    includeBrowserDetails: boolean,
    includeUsageStats: boolean,
    includeTestResults: boolean,
    includeSpecs: boolean
  ): string {
    let md = `# 🌐 Baseline Status: **${query.join(' ')}**\n\n`;

    if (!features.length) {
      return md + '_No matching features found._';
    }

    md += `Found **${features.length}** feature${features.length === 1 ? '' : 's'}:\n\n`;

    features.forEach((feature, i) => {
      md += `## ${i + 1}. ${feature.name}\n\n`;

      // Baseline status
      if (feature.baseline) {
        const statusEmoji = this.getStatusEmoji(feature.baseline.status);
        md += `**Status:** ${statusEmoji} **${feature.baseline.status.toUpperCase()}**\n`;
        
        if (feature.baseline.low_date) {
          md += `**Available Since:** ${new Date(feature.baseline.low_date).toLocaleDateString()}\n`;
        }
        if (feature.baseline.high_date) {
          md += `**Widely Available:** ${new Date(feature.baseline.high_date).toLocaleDateString()}\n`;
        }
        md += '\n';
      }

      // Browser implementations
      if (includeBrowserDetails && feature.browser_implementations) {
        md += `**Browser Support:**\n`;
        Object.entries(feature.browser_implementations)
          .sort(([, a], [, b]) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .forEach(([browser, impl]) => {
            const browserName = this.formatBrowserName(browser);
            const statusIcon = impl.status === 'available' ? '✅' : '❌';
            const version = impl.version ? ` (v${impl.version})` : '';
            md += `- **${browserName}:** ${statusIcon} ${new Date(impl.date).toLocaleDateString()}${version}\n`;
          });
        md += '\n';
      }

      // Usage statistics
      if (includeUsageStats && feature.usage) {
        const hasUsage = Object.values(feature.usage).some((stat: UsageStats) => stat.daily);
        if (hasUsage) {
          md += `**Usage Statistics:**\n`;
          Object.entries(feature.usage).forEach(([browser, stats]: [string, UsageStats]) => {
            if (stats.daily) {
              const percentage = (stats.daily * 100).toFixed(4);
              md += `- **${this.formatBrowserName(browser)}:** ${percentage}% of daily page views\n`;
            }
          });
          md += '\n';
        }
      }

      // Test results
      if (includeTestResults && feature.wpt?.stable) {
        md += `**Web Platform Tests:**\n`;
        Object.entries(feature.wpt.stable).forEach(([browser, result]: [string, TestResult]) => {
          const score = (result.score * 100).toFixed(1);
          const emoji = this.getScoreEmoji(result.score);
          md += `- **${this.formatBrowserName(browser)}:** ${emoji} ${score}% pass rate\n`;
        });
        md += '\n';
      }

      // Specifications
      if (includeSpecs && feature.spec?.links) {
        md += `**Specifications:**\n`;
        feature.spec.links.forEach((spec: SpecLink, j: number) => {
          md += `${j + 1}. [View Specification](${spec.link})\n`;
        });
        md += '\n';
      }

      // Recommendation
      md += `**Recommendation:** ${this.getRecommendation(feature.baseline?.status)}\n\n`;
      md += '---\n\n';
    });

    return md;
  }

  private getStatusEmoji(status: 'widely' | 'newly' | 'limited'): string {
    switch (status) {
      case 'widely': return '✅';
      case 'newly': return '🆕';
      case 'limited': return '⚠️';
      default: return '❓';
    }
  }

  private getScoreEmoji(score: number): string {
    if (score >= 0.9) return '🟢';
    if (score >= 0.7) return '🟡';
    if (score >= 0.5) return '🟠';
    return '🔴';
  }

  private formatBrowserName(browser: string): string {
    const names: Record<string, string> = {
      'chrome': 'Chrome',
      'chrome_android': 'Chrome Android',
      'edge': 'Edge',
      'firefox': 'Firefox',
      'firefox_android': 'Firefox Android',
      'safari': 'Safari',
      'safari_ios': 'Safari iOS'
    };
    return names[browser] || browser;
  }

  private getRecommendation(status?: 'widely' | 'newly' | 'limited'): string {
    switch (status) {
      case 'widely':
        return '🟢 Safe for production use';
      case 'newly':
        return '🟡 Use with progressive enhancement';
      case 'limited':
        return '🔴 Consider polyfills or alternatives';
      default:
        return '❓ Research browser support carefully';
    }
  }
}