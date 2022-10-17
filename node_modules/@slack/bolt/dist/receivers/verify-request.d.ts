/// <reference types="node" />
import { Logger } from '@slack/logger';
import type { IncomingMessage, ServerResponse } from 'http';
import { BufferedIncomingMessage } from './BufferedIncomingMessage';
import { RequestVerificationOptions } from './HTTPModuleFunctions';
export interface SlackRequestVerificationOptions {
    signingSecret: string;
    body: string;
    headers: {
        'x-slack-signature': string;
        'x-slack-request-timestamp': number;
    };
    nowMilliseconds?: number;
    logger?: Logger;
}
/**
 * Verifies the signature of an incoming request from Slack.
 * If the requst is invalid, this method throws an exception with the erorr details.
 */
export declare function verifySlackRequest(options: SlackRequestVerificationOptions): void;
/**
 * Verifies the signature of an incoming request from Slack.
 * If the requst is invalid, this method returns false.
 */
export declare function isValidSlackRequest(options: SlackRequestVerificationOptions): boolean;
export interface VerifyOptions extends RequestVerificationOptions {
    enabled?: boolean;
    signingSecret: string;
    nowMs?: () => number;
    logger?: Logger;
}
export declare function verify(options: VerifyOptions, req: IncomingMessage, res?: ServerResponse): Promise<BufferedIncomingMessage>;
//# sourceMappingURL=verify-request.d.ts.map