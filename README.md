# slack-approval

custom action to send approval request to Slack

![](https://user-images.githubusercontent.com/35091584/195488201-acc24277-5e0c-431f-a4b3-21b4430d5d80.png)


- Post a message in Slack with a "Aoorove" and "Reject" buttons. 
- Clicking on "Approve" will execute next steps.
- Clicking on "Reject" will cause workflow to fail.

# How To Use

- First, create a Slack App and install in your workspace.
- Second, add `chat:write` and `im:write` to OAuth Scope on OAuth & Permissions page.
- Finally, **Enable Socket Mode**.

```yaml
jobs:
  approval:
    runs-on: ubuntu-latest
    steps:
      - name: send approval
        uses: varu3/slack-approval@main
        env:
          SLACK_APP_TOKEN: ${{ secrets.SLACK_APP_TOKEN }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
          SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
        timeout-minutes: 10
```

- Set environment variables

  - `SLACK_APP_TOKEN`

    - App-level tokens on `Basic Information page`. (starting with `xapp-` )

  - `SLACK_BOT_TOKEN`

    - Bot-level tokens on `OAuth & Permissions page`. (starting with `xoxb-` )

  - `SLACK_SIGNING_SECRET`

    - Signing Secret on `Basic Information page`.

  - `SLACK_CHANNEL_ID`

    - Channel ID for which you want to send approval.

- Set `timeout-minutes`
  - Set the time to wait for approval. If the timeout is reached, GitHub Actions will forcefully terminate the workflow.

## Custom Blocks

You can add custom blocks to the Slack notification by using the `custom-blocks` input:

```yaml
jobs:
  approval:
    runs-on: ubuntu-latest
    steps:
      - name: send approval
        uses: varu3/slack-approval@main
        with:
          custom-blocks: |
            [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Environment:* Production"
                }
              }
            ]
        env:
          SLACK_APP_TOKEN: ${{ secrets.SLACK_APP_TOKEN }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
          SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
        timeout-minutes: 10
```

The custom blocks will be displayed after the workflow information and before the Approve/Reject buttons. You can use any valid [Slack Block Kit](https://api.slack.com/block-kit) blocks.

## Override Base Blocks

If you want to completely replace the default workflow information with your own custom blocks (while keeping the Approve/Reject buttons), use the `override-base-blocks` input:

```yaml
jobs:
  approval:
    runs-on: ubuntu-latest
    steps:
      - name: send approval
        uses: varu3/slack-approval@main
        with:
          override-base-blocks: true
          custom-blocks: |
            [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Custom Approval Request*"
                }
              },
              {
                "type": "section",
                "fields": [
                  {
                    "type": "mrkdwn",
                    "text": "*Environment:*\nProduction"
                  },
                  {
                    "type": "mrkdwn",
                    "text": "*Requested by:*\n${{ github.actor }}"
                  }
                ]
              }
            ]
        env:
          SLACK_APP_TOKEN: ${{ secrets.SLACK_APP_TOKEN }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
          SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
        timeout-minutes: 10
```

When `override-base-blocks` is set to `true`, only your custom blocks and the Approve/Reject buttons will be displayed. The default workflow information (GitHub Actor, Repository, Actions URL, etc.) will be omitted.

## Timeout Handling

When the `timeout-minutes` limit is reached, the action automatically:
- Detects the timeout signal from GitHub Actions
- Disables the Approve/Reject buttons in the Slack message
- Updates the message with a timeout notification
- Exits with failure status

The Slack message will be updated to show:
> ⏱️ **Timeout:** The approval time has expired and the deployment was cancelled

**Example:**
```yaml
jobs:
  approval:
    runs-on: ubuntu-latest
    steps:
      - name: send approval
        uses: varu3/slack-approval@main
        env:
          SLACK_APP_TOKEN: ${{ secrets.SLACK_APP_TOKEN }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
          SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
        timeout-minutes: 10  # Timeout after 10 minutes
```

**Note:** No additional Slack OAuth scopes are required for timeout handling. The action stores message blocks locally and does not need to fetch the message from Slack API.

## Configurable Log Level

Control the verbosity of Slack Bolt framework logs using environment variables:

**Priority (highest to lowest):**
1. `RUNNER_DEBUG=1` - GitHub Actions debug mode (uses DEBUG level)
2. `SLACK_LOG_LEVEL` - Explicit log level (DEBUG, INFO, WARN, ERROR)
3. Default: `WARN`

**Example with explicit log level:**
```yaml
- name: send approval
  uses: varu3/slack-approval@main
  env:
    SLACK_LOG_LEVEL: DEBUG
    SLACK_APP_TOKEN: ${{ secrets.SLACK_APP_TOKEN }}
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
    SLACK_SIGNING_SECRET: ${{ secrets.SLACK_SIGNING_SECRET }}
    SLACK_CHANNEL_ID: ${{ secrets.SLACK_CHANNEL_ID }}
```

**Example with GitHub Actions debug mode:**

Enable debug mode by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository settings, or by re-running the workflow with debug logging enabled. The action will automatically use DEBUG log level.

## Output Messages

The action provides clear output messages for each outcome:

### ✅ Approved
```
✅ APPROVED by username (U12345678) at 2025-11-05T12:34:56.789Z
```

### ❌ Rejected
```
❌ REJECTED by username (U12345678) at 2025-11-05T12:34:56.789Z
```

### ⏱️ Timeout
```
⏱️ TIMEOUT - No response received at 2025-11-05T12:34:56.789Z
Slack message updated with timeout notification
```

All messages include:
- Username and User ID from Slack
- ISO 8601 timestamp of the action
