"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPResponseAck = void 0;
const errors_1 = require("../errors");
const HTTPModuleFunctions_1 = require("./HTTPModuleFunctions");
class HTTPResponseAck {
    constructor(args) {
        var _a, _b;
        this.logger = args.logger;
        this.isAcknowledged = false;
        this.processBeforeResponse = args.processBeforeResponse;
        this.unhandledRequestHandler = (_a = args.unhandledRequestHandler) !== null && _a !== void 0 ? _a : HTTPModuleFunctions_1.HTTPModuleFunctions.defaultUnhandledRequestHandler;
        this.unhandledRequestTimeoutMillis = (_b = args.unhandledRequestTimeoutMillis) !== null && _b !== void 0 ? _b : 3001;
        this.httpRequest = args.httpRequest;
        this.httpResponse = args.httpResponse;
        this.storedResponse = undefined;
        this.noAckTimeoutId = undefined;
        this.init();
    }
    init() {
        this.noAckTimeoutId = setTimeout(() => {
            if (!this.isAcknowledged) {
                this.unhandledRequestHandler({
                    logger: this.logger,
                    request: this.httpRequest,
                    response: this.httpResponse,
                });
            }
        }, this.unhandledRequestTimeoutMillis);
        return this;
    }
    bind() {
        return async (responseBody) => {
            this.logger.debug(`ack() call begins (body: ${responseBody})`);
            if (this.isAcknowledged) {
                throw new errors_1.ReceiverMultipleAckError();
            }
            this.ack();
            if (this.processBeforeResponse) {
                // In the case where processBeforeResponse: true is enabled,
                // we don't send the HTTP response immediately. We hold off until the listener execution is completed.
                if (!responseBody) {
                    this.storedResponse = '';
                }
                else {
                    this.storedResponse = responseBody;
                }
                this.logger.debug(`ack() response stored (body: ${responseBody})`);
            }
            else {
                HTTPModuleFunctions_1.HTTPModuleFunctions.buildContentResponse(this.httpResponse, responseBody);
                this.logger.debug(`ack() response sent (body: ${responseBody})`);
            }
        };
    }
    ack() {
        this.isAcknowledged = true;
        if (this.noAckTimeoutId) {
            clearTimeout(this.noAckTimeoutId);
        }
    }
}
exports.HTTPResponseAck = HTTPResponseAck;
//# sourceMappingURL=HTTPResponseAck.js.map