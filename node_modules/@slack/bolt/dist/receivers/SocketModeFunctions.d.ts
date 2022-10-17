import type { Logger } from '@slack/logger';
import { CodedError } from '../errors';
import { ReceiverEvent } from '../types';
export declare class SocketModeFunctions {
    static defaultProcessEventErrorHandler(args: SocketModeReceiverProcessEventErrorHandlerArgs): Promise<boolean>;
}
export interface SocketModeReceiverProcessEventErrorHandlerArgs {
    error: Error | CodedError;
    logger: Logger;
    event: ReceiverEvent;
}
//# sourceMappingURL=SocketModeFunctions.d.ts.map