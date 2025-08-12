// src/tools/schemas.ts
import { z } from 'zod';

export const baselineStatusSchema = z.object({
  query: z.array(z.string()).describe('Search terms for web features'),
  include_browser_details: z.boolean().default(true).describe('Include browser implementation details'),
  include_usage_stats: z.boolean().default(true).describe('Include usage statistics'),
  include_test_results: z.boolean().default(true).describe('Include test results'),
  include_specs: z.boolean().default(true).describe('Include specification links'),
  limit: z.number().min(1).max(20).default(10).describe('Maximum number of results')
});

export const baselineSummarySchema = z.object({});

