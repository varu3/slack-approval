/// <reference types="node" />
import type { Logger } from '@slack/logger';
import type { IncomingMessage, ServerResponse } from 'http';
import { CodedError } from '../errors';
import { BufferedIncomingMessage } from './BufferedIncomingMessage';
export declare class HTTPModuleFunctions {
    static extractRetryNumFromHTTPRequest(req: IncomingMessage): number | undefined;
    static extractRetryReasonFromHTTPRequest(req: IncomingMessage): string | undefined;
    static parseHTTPRequestBody(req: BufferedIncomingMessage): any;
    static parseAndVerifyHTTPRequest(options: RequestVerificationOptions, req: IncomingMessage, _res?: ServerResponse): Promise<BufferedIncomingMessage>;
    static isBufferedIncomingMessage(req: IncomingMessage): req is BufferedIncomingMessage;
    static getHeader(req: IncomingMessage, header: string): string;
    static bufferIncomingMessage(req: IncomingMessage): Promise<BufferedIncomingMessage>;
    static buildNoBodyResponse(res: ServerResponse, status: number): void;
    static buildUrlVerificationResponse(res: ServerResponse, body: any): void;
    static buildSSLCheckResponse(res: ServerResponse): void;
    static buildContentResponse(res: ServerResponse, body: string | any | undefined): void;
    static defaultDispatchErrorHandler(args: ReceiverDispatchErrorHandlerArgs): void;
    static defaultAsyncDispatchErrorHandler(args: ReceiverDispatchErrorHandlerArgs): Promise<void>;
    static defaultProcessEventErrorHandler(args: ReceiverProcessEventErrorHandlerArgs): Promise<boolean>;
    static defaultUnhandledRequestHandler(args: ReceiverUnhandledRequestHandlerArgs): void;
}
export interface RequestVerificationOptions {
    enabled?: boolean;
    signingSecret: string;
    nowMilliseconds?: () => number;
    logger?: Logger;
}
export interface ReceiverDispatchErrorHandlerArgs {
    error: Error | CodedError;
    logger: Logger;
    request: IncomingMessage;
    response: ServerResponse;
}
export interface ReceiverProcessEventErrorHandlerArgs {
    error: Error | CodedError;
    logger: Logger;
    request: IncomingMessage;
    response: ServerResponse;
    storedResponse: any;
}
export interface ReceiverUnhandledRequestHandlerArgs {
    logger: Logger;
    request: IncomingMessage;
    response: ServerResponse;
}
//# sourceMappingURL=HTTPModuleFunctions.d.ts.map