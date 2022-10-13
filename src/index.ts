import * as core from '@actions/core'
import { App, BlockAction, LogLevel } from '@slack/bolt'
import { WebClient } from '@slack/web-api'

const token = process.env.SLACK_BOT_TOKEN || ""
const signingSecret =  process.env.SLACK_SIGNING_SECRET || ""
const slackAppToken = process.env.SLACK_APP_TOKEN || ""
const channel_id    = process.env.SLACK_CHANNEL_ID || ""

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

    (async () => {
      await web.chat.postMessage({ 
        channel: channel_id, 
        text: "GitHub Actions Approval request",
        blocks: [
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
                "type": "actions",
                "elements": [
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
                    }
                ]
            }
        ]
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

    (async () => {
      await app.start(3000);
      console.log('Waiting Approval reaction.....');
    })();
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()