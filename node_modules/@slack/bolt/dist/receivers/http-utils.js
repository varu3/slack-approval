"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractRetryReason = exports.extractRetryNum = void 0;
const logger_1 = require("@slack/logger");
const HTTPModuleFunctions_1 = require("./HTTPModuleFunctions");
const logger = new logger_1.ConsoleLogger();
// Deprecated: this function will be removed in the near future
function extractRetryNum(req) {
    logger.warn('This method is deprecated. Use HTTPModuleFunctions.extractRetryNumFromHTTPRequest(req) instead.');
    return HTTPModuleFunctions_1.HTTPModuleFunctions.extractRetryNumFromHTTPRequest(req);
}
exports.extractRetryNum = extractRetryNum;
// Deprecated: this function will be removed in the near future
function extractRetryReason(req) {
    logger.warn('This method is deprecated. Use HTTPModuleFunctions.extractRetryReasonFromHTTPRequest(req) instead.');
    return HTTPModuleFunctions_1.HTTPModuleFunctions.extractRetryReasonFromHTTPRequest(req);
}
exports.extractRetryReason = extractRetryReason;
//# sourceMappingURL=http-utils.js.map