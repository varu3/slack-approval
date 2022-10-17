"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_1 = require("http");
const https_1 = require("https");
const logger_1 = require("@slack/logger");
const oauth_1 = require("@slack/oauth");
const url_1 = require("url");
const verify_redirect_opts_1 = require("./verify-redirect-opts");
const errors_1 = require("../errors");
const custom_routes_1 = require("./custom-routes");
const HTTPModuleFunctions_1 = require("./HTTPModuleFunctions");
const HTTPResponseAck_1 = require("./HTTPResponseAck");
// Option keys for tls.createServer() and tls.createSecureContext(), exclusive of those for http.createServer()
const httpsOptionKeys = [
    'ALPNProtocols',
    'clientCertEngine',
    'enableTrace',
    'handshakeTimeout',
    'rejectUnauthorized',
    'requestCert',
    'sessionTimeout',
    'SNICallback',
    'ticketKeys',
    'pskCallback',
    'pskIdentityHint',
    'ca',
    'cert',
    'sigalgs',
    'ciphers',
    'clientCertEngine',
    'crl',
    'dhparam',
    'ecdhCurve',
    'honorCipherOrder',
    'key',
    'privateKeyEngine',
    'privateKeyIdentifier',
    'maxVersion',
    'minVersion',
    'passphrase',
    'pfx',
    'secureOptions',
    'secureProtocol',
    'sessionIdContext',
];
const missingServerErrorDescription = 'The receiver cannot be started because private state was mutated. Please report this to the maintainers.';
/**
 * Receives HTTP requests with Events, Slash Commands, and Actions
 */
class HTTPReceiver {
    constructor({ signingSecret = '', endpoints = ['/slack/events'], port = 3000, customRoutes = [], logger = undefined, logLevel = logger_1.LogLevel.INFO, processBeforeResponse = false, signatureVerification = true, clientId = undefined, clientSecret = undefined, stateSecret = undefined, redirectUri = undefined, installationStore = undefined, scopes = undefined, installerOptions = {}, customPropertiesExtractor = (_req) => ({}), dispatchErrorHandler = HTTPModuleFunctions_1.HTTPModuleFunctions.defaultDispatchErrorHandler, processEventErrorHandler = HTTPModuleFunctions_1.HTTPModuleFunctions.defaultProcessEventErrorHandler, unhandledRequestHandler = HTTPModuleFunctions_1.HTTPModuleFunctions.defaultUnhandledRequestHandler, unhandledRequestTimeoutMillis = 3001, }) {
        var _a, _b, _c, _d;
        // Initialize instance variables, substituting defaults for each value
        this.signingSecret = signingSecret;
        this.processBeforeResponse = processBeforeResponse;
        this.signatureVerification = signatureVerification;
        this.logger = logger !== null && logger !== void 0 ? logger : (() => {
            const defaultLogger = new logger_1.ConsoleLogger();
            defaultLogger.setLevel(logLevel);
            return defaultLogger;
        })();
        this.endpoints = Array.isArray(endpoints) ? endpoints : [endpoints];
        this.port = (installerOptions === null || installerOptions === void 0 ? void 0 : installerOptions.port) ? installerOptions.port : port;
        this.routes = (0, custom_routes_1.buildReceiverRoutes)(customRoutes);
        // Verify redirect options if supplied, throws coded error if invalid
        (0, verify_redirect_opts_1.verifyRedirectOpts)({ redirectUri, redirectUriPath: installerOptions.redirectUriPath });
        this.stateVerification = installerOptions.stateVerification;
        // Initialize InstallProvider when it's required options are provided
        if (clientId !== undefined &&
            clientSecret !== undefined &&
            (this.stateVerification === false || // state store not needed
                stateSecret !== undefined ||
                installerOptions.stateStore !== undefined) // user provided state store
        ) {
            this.installer = new oauth_1.InstallProvider({
                clientId,
                clientSecret,
                stateSecret,
                installationStore,
                logger,
                logLevel,
                directInstall: installerOptions.directInstall,
                stateStore: installerOptions.stateStore,
                stateVerification: installerOptions.stateVerification,
                legacyStateVerification: installerOptions.legacyStateVerification,
                stateCookieName: installerOptions.stateCookieName,
                stateCookieExpirationSeconds: installerOptions.stateCookieExpirationSeconds,
                renderHtmlForInstallPath: installerOptions.renderHtmlForInstallPath,
                authVersion: installerOptions.authVersion,
                clientOptions: installerOptions.clientOptions,
                authorizationUrl: installerOptions.authorizationUrl,
            });
            // Store the remaining instance variables that are related to using the InstallProvider
            this.installPath = (_a = installerOptions.installPath) !== null && _a !== void 0 ? _a : '/slack/install';
            this.installRedirectUriPath = (_b = installerOptions.redirectUriPath) !== null && _b !== void 0 ? _b : '/slack/oauth_redirect';
            this.installPathOptions = (_c = installerOptions.installPathOptions) !== null && _c !== void 0 ? _c : {};
            this.installCallbackOptions = (_d = installerOptions.callbackOptions) !== null && _d !== void 0 ? _d : {};
            this.installUrlOptions = {
                scopes: scopes !== null && scopes !== void 0 ? scopes : [],
                userScopes: installerOptions.userScopes,
                metadata: installerOptions.metadata,
                redirectUri,
            };
        }
        this.customPropertiesExtractor = customPropertiesExtractor;
        this.dispatchErrorHandler = dispatchErrorHandler;
        this.processEventErrorHandler = processEventErrorHandler;
        this.unhandledRequestHandler = unhandledRequestHandler;
        this.unhandledRequestTimeoutMillis = unhandledRequestTimeoutMillis;
        // Assign the requestListener property by binding the unboundRequestListener to this instance
        this.requestListener = this.unboundRequestListener.bind(this);
    }
    init(app) {
        this.app = app;
    }
    start(portOrListenOptions, serverOptions = {}) {
        let createServerFn = http_1.createServer;
        // Decide which kind of server, HTTP or HTTPS, by searching for any keys in the serverOptions that are exclusive
        // to HTTPS
        if (Object.keys(serverOptions).filter((k) => httpsOptionKeys.includes(k)).length > 0) {
            createServerFn = https_1.createServer;
        }
        if (this.server !== undefined) {
            return Promise.reject(new errors_1.ReceiverInconsistentStateError('The receiver cannot be started because it was already started.'));
        }
        this.server = createServerFn(serverOptions, (req, res) => {
            try {
                this.requestListener(req, res);
            }
            catch (error) {
                // You may get an error here only when the requestListener failed
                // to start processing incoming requests, or your app receives a request to an unexpected path.
                this.dispatchErrorHandler({
                    error: error,
                    logger: this.logger,
                    request: req,
                    response: res,
                });
            }
        });
        return new Promise((resolve, reject) => {
            if (this.server === undefined) {
                throw new errors_1.ReceiverInconsistentStateError(missingServerErrorDescription);
            }
            this.server.on('error', (error) => {
                if (this.server === undefined) {
                    throw new errors_1.ReceiverInconsistentStateError(missingServerErrorDescription);
                }
                this.server.close();
                // If the error event occurs before listening completes (like EADDRINUSE), this works well. However, if the
                // error event happens some after the Promise is already resolved, the error would be silently swallowed up.
                // The documentation doesn't describe any specific errors that can occur after listening has started, so this
                // feels safe.
                reject(error);
            });
            this.server.on('close', () => {
                // Not removing all listeners because consumers could have added their own `close` event listener, and those
                // should be called. If the consumer doesn't dispose of any references to the server properly, this would be
                // a memory leak.
                // this.server?.removeAllListeners();
                this.server = undefined;
            });
            let listenOptions = this.port;
            if (portOrListenOptions !== undefined) {
                if (typeof portOrListenOptions === 'number') {
                    listenOptions = portOrListenOptions;
                }
                else if (typeof portOrListenOptions === 'string') {
                    listenOptions = Number(portOrListenOptions);
                }
                else if (typeof portOrListenOptions === 'object') {
                    listenOptions = portOrListenOptions;
                }
            }
            this.server.listen(listenOptions, () => {
                if (this.server === undefined) {
                    return reject(new errors_1.ReceiverInconsistentStateError(missingServerErrorDescription));
                }
                return resolve(this.server);
            });
        });
    }
    // TODO: the arguments should be defined as the arguments to close() (which happen to be none), but for sake of
    // generic types
    stop() {
        if (this.server === undefined) {
            return Promise.reject(new errors_1.ReceiverInconsistentStateError('The receiver cannot be stopped because it was not started.'));
        }
        return new Promise((resolve, reject) => {
            var _a;
            (_a = this.server) === null || _a === void 0 ? void 0 : _a.close((error) => {
                if (error !== undefined) {
                    return reject(error);
                }
                this.server = undefined;
                return resolve();
            });
        });
    }
    unboundRequestListener(req, res) {
        // Route the request
        // NOTE: the domain and scheme are irrelevant here.
        // The URL object is only used to safely obtain the path to match
        const { pathname: path } = new url_1.URL(req.url, 'http://localhost');
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const method = req.method.toUpperCase();
        if (this.endpoints.includes(path) && method === 'POST') {
            // Handle incoming ReceiverEvent
            return this.handleIncomingEvent(req, res);
        }
        if (this.installer !== undefined && method === 'GET') {
            // When installer is defined then installPath and installRedirectUriPath are always defined
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const [installPath, installRedirectUriPath] = [this.installPath, this.installRedirectUriPath];
            // Visiting the installation endpoint
            if (path === installPath) {
                // Render installation path (containing Add to Slack button)
                return this.handleInstallPathRequest(req, res);
            }
            // Installation has been initiated
            if (path === installRedirectUriPath) {
                // Handle OAuth callback request (to exchange authorization grant for a new access token)
                return this.handleInstallRedirectRequest(req, res);
            }
        }
        // Handle custom routes
        if (Object.keys(this.routes).length) {
            const match = this.routes[path] && this.routes[path][method] !== undefined;
            if (match) {
                return this.routes[path][method](req, res);
            }
        }
        // If the request did not match the previous conditions, an error is thrown. The error can be caught by the
        // the caller in order to defer to other routing logic (similar to calling `next()` in connect middleware).
        // If you would like to customize the HTTP repsonse for this pattern,
        // implement your own dispatchErrorHandler that handles an exception
        // with ErrorCode.HTTPReceiverDeferredRequestError.
        throw new errors_1.HTTPReceiverDeferredRequestError(`Unhandled HTTP request (${method}) made to ${path}`, req, res);
    }
    handleIncomingEvent(req, res) {
        // Wrapped in an async closure for ease of using await
        (async () => {
            var _a;
            let bufferedReq;
            let body;
            // Verify authenticity
            try {
                bufferedReq = await HTTPModuleFunctions_1.HTTPModuleFunctions.parseAndVerifyHTTPRequest({
                    // If enabled: false, this method returns bufferredReq without verification
                    enabled: this.signatureVerification,
                    signingSecret: this.signingSecret,
                }, req);
            }
            catch (err) {
                const e = err;
                if (this.signatureVerification) {
                    this.logger.warn(`Failed to parse and verify the request data: ${e.message}`);
                }
                else {
                    this.logger.warn(`Failed to parse the request body: ${e.message}`);
                }
                HTTPModuleFunctions_1.HTTPModuleFunctions.buildNoBodyResponse(res, 401);
                return;
            }
            // Parse request body
            // The object containing the parsed body is not exposed to the caller. It is preferred to reduce mutations to the
            // req object, so that its as reusable as possible. Later, we should consider adding an option for assigning the
            // parsed body to `req.body`, as this convention has been established by the popular `body-parser` package.
            try {
                body = HTTPModuleFunctions_1.HTTPModuleFunctions.parseHTTPRequestBody(bufferedReq);
            }
            catch (err) {
                const e = err;
                this.logger.warn(`Malformed request body: ${e.message}`);
                HTTPModuleFunctions_1.HTTPModuleFunctions.buildNoBodyResponse(res, 400);
                return;
            }
            // Handle SSL checks
            if (body.ssl_check) {
                HTTPModuleFunctions_1.HTTPModuleFunctions.buildNoBodyResponse(res, 200);
                return;
            }
            // Handle URL verification
            if (body.type === 'url_verification') {
                HTTPModuleFunctions_1.HTTPModuleFunctions.buildUrlVerificationResponse(res, body);
                return;
            }
            const ack = new HTTPResponseAck_1.HTTPResponseAck({
                logger: this.logger,
                processBeforeResponse: this.processBeforeResponse,
                unhandledRequestHandler: this.unhandledRequestHandler,
                unhandledRequestTimeoutMillis: this.unhandledRequestTimeoutMillis,
                httpRequest: bufferedReq,
                httpResponse: res,
            });
            // Structure the ReceiverEvent
            const event = {
                body,
                ack: ack.bind(),
                retryNum: HTTPModuleFunctions_1.HTTPModuleFunctions.extractRetryNumFromHTTPRequest(req),
                retryReason: HTTPModuleFunctions_1.HTTPModuleFunctions.extractRetryReasonFromHTTPRequest(req),
                customProperties: this.customPropertiesExtractor(bufferedReq),
            };
            // Send the event to the app for processing
            try {
                await ((_a = this.app) === null || _a === void 0 ? void 0 : _a.processEvent(event));
                if (ack.storedResponse !== undefined) {
                    // in the case of processBeforeResponse: true
                    HTTPModuleFunctions_1.HTTPModuleFunctions.buildContentResponse(res, ack.storedResponse);
                    this.logger.debug('stored response sent');
                }
            }
            catch (error) {
                const acknowledgedByHandler = await this.processEventErrorHandler({
                    error: error,
                    logger: this.logger,
                    request: req,
                    response: res,
                    storedResponse: ack.storedResponse,
                });
                if (acknowledgedByHandler) {
                    // If the value is false, we don't touch the value as a race condition
                    // with ack() call may occur especially when processBeforeResponse: false
                    ack.ack();
                }
            }
        })();
    }
    handleInstallPathRequest(req, res) {
        // Wrapped in an async closure for ease of using await
        (async () => {
            try {
                /* eslint-disable @typescript-eslint/no-non-null-assertion */
                await this.installer.handleInstallPath(req, res, this.installPathOptions, this.installUrlOptions);
            }
            catch (err) {
                const e = err;
                this.logger.error(`An unhandled error occurred while Bolt processed a request to the installation path (${e.message})`);
                this.logger.debug(`Error details: ${e}`);
            }
        })();
    }
    handleInstallRedirectRequest(req, res) {
        // This function is only called from within unboundRequestListener after checking that installer is defined, and
        // when installer is defined then installCallbackOptions is always defined too.
        /* eslint-disable @typescript-eslint/no-non-null-assertion */
        const [installer, installCallbackOptions, installUrlOptions] = [
            this.installer,
            this.installCallbackOptions,
            this.installUrlOptions,
        ];
        /* eslint-enable @typescript-eslint/no-non-null-assertion */
        const errorHandler = (err) => {
            this.logger.error('HTTPReceiver encountered an unexpected error while handling the OAuth install redirect. Please report to the maintainers.');
            this.logger.debug(`Error details: ${err}`);
        };
        if (this.stateVerification === false) {
            // when stateVerification is disabled pass install options directly to handler
            // since they won't be encoded in the state param of the generated url
            installer.handleCallback(req, res, installCallbackOptions, installUrlOptions).catch(errorHandler);
        }
        else {
            installer.handleCallback(req, res, installCallbackOptions).catch(errorHandler);
        }
    }
}
exports.default = HTTPReceiver;
//# sourceMappingURL=HTTPReceiver.js.map