/// <reference types="node" />
import { Logger } from '@slack/logger';
import { IncomingMessage, ServerResponse } from 'http';
import { AckFn } from '../types';
import { ReceiverUnhandledRequestHandlerArgs } from './HTTPModuleFunctions';
export interface AckArgs {
    logger: Logger;
    processBeforeResponse: boolean;
    unhandledRequestHandler?: (args: ReceiverUnhandledRequestHandlerArgs) => void;
    unhandledRequestTimeoutMillis?: number;
    httpRequest: IncomingMessage;
    httpResponse: ServerResponse;
}
export declare type HTTResponseBody = any | string | undefined;
export declare class HTTPResponseAck {
    private logger;
    private isAcknowledged;
    private processBeforeResponse;
    private unhandledRequestHandler;
    private unhandledRequestTimeoutMillis;
    private httpRequest;
    private httpResponse;
    private noAckTimeoutId?;
    storedResponse: any | string | undefined;
    constructor(args: AckArgs);
    private init;
    bind(): AckFn<HTTResponseBody>;
    ack(): void;
}
//# sourceMappingURL=HTTPResponseAck.d.ts.map