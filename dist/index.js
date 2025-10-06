"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const bolt_1 = require("@slack/bolt");
const web_api_1 = require("@slack/web-api");
const token = process.env.SLACK_BOT_TOKEN || "";
const signingSecret = process.env.SLACK_SIGNING_SECRET || "";
const slackAppToken = process.env.SLACK_APP_TOKEN || "";
const channel_id = process.env.SLACK_CHANNEL_ID || "";
const app = new bolt_1.App({
    token: token,
    signingSecret: signingSecret,
    appToken: slackAppToken,
    socketMode: true,
    port: 3000,
    logLevel: bolt_1.LogLevel.DEBUG,
});
async function run() {
    try {
        const web = new web_api_1.WebClient(token);
        const github_server_url = process.env.GITHUB_SERVER_URL || "";
        const github_repos = process.env.GITHUB_REPOSITORY || "";
        const run_id = process.env.GITHUB_RUN_ID || "";
        const actionsUrl = `${github_server_url}/${github_repos}/actions/runs/${run_id}`;
        const workflow = process.env.GITHUB_WORKFLOW || "";
        const runnerOS = process.env.RUNNER_OS || "";
        const actor = process.env.GITHUB_ACTOR || "";
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
        app.action('slack-approval-approve', async ({ ack, client, body, logger }) => {
            await ack();
            try {
                const response_blocks = body.message?.blocks;
                response_blocks.pop();
                response_blocks.push({
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': `Approved by <@${body.user.id}> `,
                    },
                });
                await client.chat.update({
                    channel: body.channel?.id || "",
                    ts: body.message?.ts || "",
                    blocks: response_blocks
                });
            }
            catch (error) {
                logger.error(error);
            }
            process.exit(0);
        });
        app.action('slack-approval-reject', async ({ ack, client, body, logger }) => {
            await ack();
            try {
                const response_blocks = body.message?.blocks;
                response_blocks.pop();
                response_blocks.push({
                    'type': 'section',
                    'text': {
                        'type': 'mrkdwn',
                        'text': `Rejected by <@${body.user.id}>`,
                    },
                });
                await client.chat.update({
                    channel: body.channel?.id || "",
                    ts: body.message?.ts || "",
                    blocks: response_blocks
                });
            }
            catch (error) {
                logger.error(error);
            }
            process.exit(1);
        });
        (async () => {
            await app.start(3000);
            console.log('Waiting Approval reaction.....');
        })();
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
    }
}
run();
