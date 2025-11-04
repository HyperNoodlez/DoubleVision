/**
 * Linear Integration Utilities
 *
 * This module provides utilities for integrating with Linear for issue tracking.
 * It supports automated issue creation for moderation failures and system monitoring.
 *
 * Note: Actual Linear API calls require LINEAR_API_KEY and LINEAR_TEAM_ID in .env
 * The Linear MCP server is available for direct integration via the MCP protocol.
 */

// Types for Linear integration
export interface LinearIssueData {
  title: string;
  description: string;
  priority?: number; // 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low
  labels?: string[];
  assignee?: string;
}

export interface ModerationAlert {
  reviewId: string;
  photoId: string;
  reviewerId: string;
  moderationStatus: 'rejected';
  reason: 'offensive' | 'irrelevant' | 'ai-generated';
  confidence: number;
  reasoning: string;
  reviewText: string;
}

/**
 * Check if Linear integration is enabled
 */
export function isLinearEnabled(): boolean {
  return !!(process.env.LINEAR_API_KEY && process.env.LINEAR_TEAM_ID);
}

/**
 * Create issue title and description for moderation alert
 */
export function formatModerationAlert(alert: ModerationAlert): LinearIssueData {
  const priorityMap = {
    offensive: 1, // Urgent
    irrelevant: 3, // Normal
    'ai-generated': 3, // Normal
  };

  const title = `Moderation Alert: ${alert.reason} content detected (${alert.confidence}% confidence)`;

  const description = `
## Moderation Alert

**Reason:** ${alert.reason}
**Confidence:** ${alert.confidence}%
**Status:** ${alert.moderationStatus}

### AI Reasoning
${alert.reasoning}

### Review Details
- **Review ID:** \`${alert.reviewId}\`
- **Photo ID:** \`${alert.photoId}\`
- **Reviewer ID:** \`${alert.reviewerId}\`

### Review Text Preview
\`\`\`
${alert.reviewText.substring(0, 200)}${alert.reviewText.length > 200 ? '...' : ''}
\`\`\`

### Action Required
- [ ] Review the content manually
- [ ] Verify AI moderation decision
- [ ] Take appropriate action if needed
- [ ] Update review status if necessary

---
*This issue was automatically created by DoubleVision AI moderation system.*
`.trim();

  return {
    title,
    description,
    priority: priorityMap[alert.reason],
    labels: ['moderation', 'ai-alert', alert.reason],
  };
}

/**
 * Create issue for system error
 */
export function formatSystemError(error: {
  type: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}): LinearIssueData {
  const title = `System Error: ${error.type}`;

  const description = `
## System Error

**Type:** ${error.type}
**Message:** ${error.message}

${error.context ? `### Context
\`\`\`json
${JSON.stringify(error.context, null, 2)}
\`\`\`
` : ''}

${error.stack ? `### Stack Trace
\`\`\`
${error.stack}
\`\`\`
` : ''}

### Action Required
- [ ] Investigate the error
- [ ] Implement fix if needed
- [ ] Deploy fix to production
- [ ] Monitor for recurrence

---
*This issue was automatically created by DoubleVision error tracking.*
`.trim();

  return {
    title,
    description,
    priority: 2, // High priority for errors
    labels: ['bug', 'system-error'],
  };
}

/**
 * Create issue for photo upload failure
 */
export function formatUploadFailure(failure: {
  userId: string;
  error: string;
  fileSize?: number;
  fileType?: string;
}): LinearIssueData {
  const title = `Upload Failure: ${failure.error.substring(0, 50)}`;

  const description = `
## Photo Upload Failure

**User ID:** \`${failure.userId}\`
**Error:** ${failure.error}
${failure.fileSize ? `**File Size:** ${(failure.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
${failure.fileType ? `**File Type:** ${failure.fileType}` : ''}

### Action Required
- [ ] Check if this is a recurring issue
- [ ] Verify Vercel Blob Storage health
- [ ] Check for file size/type validation issues
- [ ] Contact user if needed

---
*This issue was automatically created by DoubleVision upload monitoring.*
`.trim();

  return {
    title,
    description,
    priority: 3, // Normal priority
    labels: ['bug', 'upload', 'user-issue'],
  };
}

/**
 * Log Linear integration action (for development)
 */
export function logLinearAction(
  action: 'create_issue' | 'update_issue' | 'create_comment',
  data: any
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Linear] ${action}:`, JSON.stringify(data, null, 2));
  }
}

/**
 * Create moderation alert issue (placeholder for actual implementation)
 *
 * In production, this would use the Linear MCP server or SDK to create issues.
 * For now, it logs the action for development purposes.
 */
export async function createModerationAlertIssue(
  alert: ModerationAlert
): Promise<{ success: boolean; message: string; issueId?: string }> {
  if (!isLinearEnabled()) {
    console.warn('[Linear] Integration not enabled. Set LINEAR_API_KEY and LINEAR_TEAM_ID.');
    return {
      success: false,
      message: 'Linear integration not configured',
    };
  }

  const issueData = formatModerationAlert(alert);
  logLinearAction('create_issue', issueData);

  // TODO: Implement actual Linear API call here
  // This would use the Linear MCP server or Linear SDK
  // Example:
  // const result = await linearClient.createIssue({
  //   teamId: process.env.LINEAR_TEAM_ID,
  //   ...issueData,
  // });

  return {
    success: true,
    message: 'Moderation alert issue logged (Linear integration pending)',
    issueId: 'MOCK-' + Date.now(), // Placeholder
  };
}

/**
 * Get moderation statistics for dashboard
 */
export async function getModerationStats(): Promise<{
  totalAlerts: number;
  byReason: Record<string, number>;
  recentAlerts: ModerationAlert[];
}> {
  // TODO: Implement actual database query
  // This would fetch moderation data from MongoDB
  return {
    totalAlerts: 0,
    byReason: {
      offensive: 0,
      irrelevant: 0,
      'ai-generated': 0,
    },
    recentAlerts: [],
  };
}
