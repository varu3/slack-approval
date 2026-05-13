import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import { App, BlockAction, LogLevel } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import { KnownBlock, Block } from '@slack/types'

const token = process.env.SLACK_BOT_TOKEN || ""
const signingSecret =  process.env.SLACK_SIGNING_SECRET || ""
const slackAppToken = process.env.SLACK_APP_TOKEN || ""
const channel_id    = process.env.SLACK_CHANNEL_ID || ""
const customBlocks  = core.getInput('custom-blocks') || "[]"
const githubToken   = process.env.GITHUB_TOKEN || ""

const app = new App({
  token: token,
  signingSecret: signingSecret,
  appToken: slackAppToken,
  socketMode: true,
  port: 3000,
  logLevel: LogLevel.DEBUG,
});

async function run(): Promise<void> {
  try {
    const web = new WebClient(token);

    const github_server_url = process.env.GITHUB_SERVER_URL || "";
    const github_repos = process.env.GITHUB_REPOSITORY || "";
    const run_id = process.env.GITHUB_RUN_ID || "";
    const actionsUrl = `${github_server_url}/${github_repos}/actions/runs/${run_id}`;
    const workflow   = process.env.GITHUB_WORKFLOW || "";
    const runnerOS   = process.env.RUNNER_OS || "";
    const actor      = process.env.GITHUB_ACTOR || "";
    const repository = process.env.GITHUB_REPOSITORY || "";
    const ref        = process.env.GITHUB_REF || "";
    const eventPath  = process.env.GITHUB_EVENT_PATH || "";

    const prMatch = ref.match(/^refs\/pull\/(\d+)\/(merge|head)$/);
    let prNumber = prMatch ? Number(prMatch[1]) : undefined;
    const [owner, repo] = repository.split("/");
    let prHtmlUrl = prNumber ? `${github_server_url}/${github_repos}/pull/${prNumber}` : `${github_server_url}/${github_repos}`;

    // Fallback to event payload for more reliable PR metadata.
    try {
      if (eventPath) {
        const eventPayload = JSON.parse(fs.readFileSync(eventPath, 'utf8')) as {
          pull_request?: {
            number?: number
            html_url?: string
          }
        };
        if (!prNumber && eventPayload.pull_request?.number) {
          prNumber = eventPayload.pull_request.number;
        }
        if (eventPayload.pull_request?.html_url) {
          prHtmlUrl = eventPayload.pull_request.html_url;
        }
      }
    } catch (error) {
      console.warn('Failed to parse GITHUB_EVENT_PATH payload:', error);
    }

    // Parse custom blocks
    let parsedCustomBlocks: (KnownBlock | Block)[] = [];
    try {
      parsedCustomBlocks = JSON.parse(customBlocks);
    } catch (error) {
      console.warn('Failed to parse custom-blocks, using empty array:', error);
    }

    (async () => {
      const baseBlocks: (KnownBlock | Block)[] = [
            {
              "type": "section",
              "text": {
                  "type": "mrkdwn",
                  "text": `GitHub Actions Approval Request`,
                }
            },
            {
              "type": "section",
              "fields": [
                {
                  "type": "mrkdwn",
                  "text": `*GitHub Actor:*\n${actor}`
                },
                {
                  "type": "mrkdwn",
                  "text": `*Repos:*\n${github_server_url}/${github_repos}`
                },
                {
                  "type": "mrkdwn",
                  "text": `*Actions URL:*\n${actionsUrl}`
                },
                {
                  "type": "mrkdwn",
                  "text": `*GITHUB_RUN_ID:*\n${run_id}`
                },
                {
                  "type": "mrkdwn",
                  "text": `*Workflow:*\n${workflow}`
                },
                {
                  "type": "mrkdwn",
                  "text": `*RunnerOS:*\n${runnerOS}`
                }
              ]
            },
            {
              "type": "divider"
            },
        ];

      const actionBlock: KnownBlock | Block = {
          "type": "actions",
          "elements": [
              {
                  "type": "button",
                  "text": {
                      "type": "plain_text",
                      "emoji": true,
                      "text": "Comment"
                  },
                  "value": "comment",
                  "action_id": "slack-approval-comment"
              },
              {
                  "type": "button",
                  "text": {
                          "type": "plain_text",
                          "emoji": true,
                          "text": "Edit PR"
                  },
                  "url": `${prHtmlUrl}/edit`,
                  "value": "edit-pr",
                  "action_id": "slack-approval-edit-pr"
              },
              {
                  "type": "button",
                  "text": {
                      "type": "plain_text",
                      "emoji": true,
                      "text": "Approve"
                  },
                  "style": "primary",
                  "value": "approve",
                  "action_id": "slack-approval-approve"
              },
              {
                  "type": "button",
                  "text": {
                          "type": "plain_text",
                          "emoji": true,
                          "text": "Reject"
                  },
                  "style": "danger",
                  "value": "reject",
                  "action_id": "slack-approval-reject"
              },
              {
                  "type": "button",
                  "text": {
                          "type": "plain_text",
                          "emoji": true,
                          "text": "Close PR"
                  },
                  "style": "danger",
                  "value": "close-pr",
                  "action_id": "slack-approval-close-pr"
              }
          ]
      };

      const messageBlocks: (KnownBlock | Block)[] = [
        ...baseBlocks,
        ...parsedCustomBlocks,
        actionBlock
      ];

      await web.chat.postMessage({
        channel: channel_id,
        text: "GitHub Actions Approval request",
        blocks: messageBlocks
      });
    })();

    app.action('slack-approval-approve', async ({ack, client, body, logger}) => {
      await ack();
      try {
        const response_blocks = (<BlockAction>body).message?.blocks
        response_blocks.pop()
        response_blocks.push({
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': `Approved by <@${body.user.id}> `,
          },
        })

        await client.chat.update({
          channel: body.channel?.id || "",
          ts: (<BlockAction>body).message?.ts || "",
          blocks: response_blocks
        })
      } catch (error) {
        logger.error(error)
      }

      process.exit(0)
    });

    app.action('slack-approval-reject', async ({ack, client, body, logger}) => {
      await ack();
      try {
        const response_blocks = (<BlockAction>body).message?.blocks
        response_blocks.pop()
        response_blocks.push({
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': `Rejected by <@${body.user.id}>`,
          },
        })

        await client.chat.update({
          channel: body.channel?.id || "",
          ts: (<BlockAction>body).message?.ts || "",
          blocks: response_blocks
        })
      } catch (error) {
        logger.error(error)
      }

      process.exit(1)
    });

    app.action('slack-approval-comment', async ({ack, body, client, logger}) => {
      await ack();
      try {
        if (!owner || !repo || !prNumber) {
          throw new Error("This workflow is not running in pull_request context, cannot determine PR to comment on.");
        }

        const metadata = JSON.stringify({
          owner,
          repo,
          prNumber,
          channelId: body.channel?.id
        });

        await client.views.open({
          trigger_id: (<BlockAction>body).trigger_id,
          view: {
            type: "modal",
            callback_id: "slack-approval-comment-submit",
            private_metadata: metadata,
            title: {
              type: "plain_text",
              text: "Comment on PR"
            },
            submit: {
              type: "plain_text",
              text: "Post"
            },
            close: {
              type: "plain_text",
              text: "Cancel"
            },
            blocks: [
              {
                type: "input",
                block_id: "github-comment-block",
                label: {
                  type: "plain_text",
                  text: "Comment"
                },
                element: {
                  type: "plain_text_input",
                  action_id: "github-comment-input",
                  multiline: true
                }
              }
            ]
          }
        });
      } catch (error) {
        logger.error(error);
      }
    });

    app.view('slack-approval-comment-submit', async ({ack, body, view, client, logger}) => {
      await ack();
      try {
        if (!githubToken) {
          throw new Error("GITHUB_TOKEN is required to create pull request comments from Slack.");
        }

        const metadata = JSON.parse(view.private_metadata || "{}") as {
          owner?: string
          repo?: string
          prNumber?: number
          channelId?: string
        };

        const modalOwner = metadata.owner || owner;
        const modalRepo = metadata.repo || repo;
        const modalPrNumber = metadata.prNumber || prNumber;
        const modalChannelId = metadata.channelId || channel_id;

        if (!modalOwner || !modalRepo || !modalPrNumber) {
          throw new Error("Could not determine the target pull request for the comment.");
        }
        if (!modalChannelId) {
          throw new Error("Could not determine Slack channel for confirmation message.");
        }

        const commentText = view.state.values["github-comment-block"]["github-comment-input"].value?.trim();
        if (!commentText) {
          throw new Error("Comment text is empty.");
        }

        const octokit = github.getOctokit(githubToken);
        await octokit.rest.issues.createComment({
          owner: modalOwner,
          repo: modalRepo,
          issue_number: modalPrNumber,
          body: commentText
        });

        await client.chat.postEphemeral({
          channel: modalChannelId,
          user: body.user.id,
          text: `Posted your comment to PR #${modalPrNumber}.`
        });
      } catch (error) {
        logger.error(error);
      }
    });

    app.action('slack-approval-close-pr', async ({ack, client, body, logger}) => {
      await ack();
      try {
        if (!githubToken) {
          throw new Error("GITHUB_TOKEN is required to close pull requests from Slack.");
        }

        if (!repository || !prNumber) {
          throw new Error("This workflow is not running in pull_request context, cannot determine PR to close.");
        }

        if (!owner || !repo) {
          throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`);
        }

        const octokit = github.getOctokit(githubToken);
        await octokit.rest.pulls.update({
          owner,
          repo,
          pull_number: prNumber,
          state: "closed"
        });

        const response_blocks = (<BlockAction>body).message?.blocks
        response_blocks.pop()
        response_blocks.push({
          'type': 'section',
          'text': {
            'type': 'mrkdwn',
            'text': `Pull request #${prNumber} closed by <@${body.user.id}>`,
          },
        })

        await client.chat.update({
          channel: body.channel?.id || "",
          ts: (<BlockAction>body).message?.ts || "",
          blocks: response_blocks
        })
      } catch (error) {
        logger.error(error)
        core.setFailed(error instanceof Error ? error.message : 'Failed to close pull request');
      }

      process.exit(1)
    });

    (async () => {
      await app.start(3000);
      console.log('Waiting Approval reaction.....');
    })();
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()