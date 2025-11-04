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
