/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage } from 'http';
export interface BufferedIncomingMessage extends IncomingMessage {
    rawBody: Buffer;
}
//# sourceMappingURL=BufferedIncomingMessage.d.ts.map