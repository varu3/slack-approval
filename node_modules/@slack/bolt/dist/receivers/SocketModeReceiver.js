"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const url_1 = require("url");
const socket_mode_1 = require("@slack/socket-mode");
const http_1 = require("http");
const logger_1 = require("@slack/logger");
const oauth_1 = require("@slack/oauth");
const custom_routes_1 = require("./custom-routes");
const verify_redirect_opts_1 = require("./verify-redirect-opts");
const SocketModeFunctions_1 = require("./SocketModeFunctions");
/**
 * Receives Events, Slash Commands, and Actions of a web socket connection
 */
class SocketModeReceiver {
    constructor({ appToken, logger = undefined, logLevel = logger_1.LogLevel.INFO, clientId = undefined, clientSecret = undefined, stateSecret = undefined, redirectUri = undefined, installationStore = undefined, scopes = undefined, installerOptions = {}, customRoutes = [], customPropertiesExtractor = (_args) => ({}), processEventErrorHandler = SocketModeFunctions_1.SocketModeFunctions.defaultProcessEventErrorHandler, }) {
        this.installer = undefined;
        this.client = new socket_mode_1.SocketModeClient({
            appToken,
            logLevel,
            logger,
            clientOptions: installerOptions.clientOptions,
        });
        this.logger = logger !== null && logger !== void 0 ? logger : (() => {
            const defaultLogger = new logger_1.ConsoleLogger();
            defaultLogger.setLevel(logLevel);
            return defaultLogger;
        })();
        this.routes = (0, custom_routes_1.buildReceiverRoutes)(customRoutes);
        this.processEventErrorHandler = processEventErrorHandler;
        // Verify redirect options if supplied, throws coded error if invalid
        (0, verify_redirect_opts_1.verifyRedirectOpts)({ redirectUri, redirectUriPath: installerOptions.redirectUriPath });
        if (clientId !== undefined &&
            clientSecret !== undefined &&
            (installerOptions.stateVerification === false || // state store not needed
                stateSecret !== undefined ||
                installerOptions.stateStore !== undefined) // user provided state store
        ) {
            this.installer = new oauth_1.InstallProvider({
                clientId,
                clientSecret,
                stateSecret,
                installationStore,
                logLevel,
                logger,
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
        }
        // Add OAuth and/or custom routes to receiver
        if (this.installer !== undefined || customRoutes.length) {
            const installPath = installerOptions.installPath === undefined ? '/slack/install' : installerOptions.installPath;
            this.httpServerPort = installerOptions.port === undefined ? 3000 : installerOptions.port;
            this.httpServer = (0, http_1.createServer)(async (req, res) => {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const method = req.method.toUpperCase();
                // Handle OAuth-related requests
                if (this.installer) {
                    // create install url options
                    const installUrlOptions = {
                        metadata: installerOptions.metadata,
                        scopes: scopes !== null && scopes !== void 0 ? scopes : [],
                        userScopes: installerOptions.userScopes,
                        redirectUri,
                    };
                    // Installation has been initiated
                    const redirectUriPath = installerOptions.redirectUriPath === undefined ? '/slack/oauth_redirect' : installerOptions.redirectUriPath;
                    if (req.url && req.url.startsWith(redirectUriPath)) {
                        const { stateVerification, callbackOptions } = installerOptions;
                        if (stateVerification === false) {
                            // if stateVerification is disabled make install options available to handler
                            // since they won't be encoded in the state param of the generated url
                            await this.installer.handleCallback(req, res, callbackOptions, installUrlOptions);
                        }
                        else {
                            await this.installer.handleCallback(req, res, callbackOptions);
                        }
                        return;
                    }
                    // Visiting the installation endpoint
                    if (req.url && req.url.startsWith(installPath)) {
                        const { installPathOptions } = installerOptions;
                        await this.installer.handleInstallPath(req, res, installPathOptions, installUrlOptions);
                        return;
                    }
                }
                // Handle request for custom routes
                if (customRoutes.length && req.url) {
                    // NOTE: the domain and scheme are irrelevant here.
                    // The URL object is only used to safely obtain the path to match
                    const { pathname: path } = new url_1.URL(req.url, 'http://localhost');
                    const match = this.routes[path] && this.routes[path][method] !== undefined;
                    if (match) {
                        this.routes[path][method](req, res);
                        return;
                    }
                }
                this.logger.info(`An unhandled HTTP request (${req.method}) made to ${req.url} was ignored`);
                res.writeHead(404, {});
                res.end();
            });
            this.logger.debug(`Listening for HTTP requests on port ${this.httpServerPort}`);
            if (this.installer) {
                this.logger.debug(`Go to http://localhost:${this.httpServerPort}${installPath} to initiate OAuth flow`);
            }
        }
        this.client.on('slack_event', async (args) => {
            var _a;
            const { ack, body, retry_num, retry_reason } = args;
            const event = {
                body,
                ack,
                retryNum: retry_num,
                retryReason: retry_reason,
                customProperties: customPropertiesExtractor(args),
            };
            try {
                await ((_a = this.app) === null || _a === void 0 ? void 0 : _a.processEvent(event));
            }
            catch (error) {
                const shouldBeAcked = await this.processEventErrorHandler({
                    error: error,
                    logger: this.logger,
                    event,
                });
                if (shouldBeAcked) {
                    await ack();
                }
            }
        });
    }
    init(app) {
        this.app = app;
    }
    start() {
        if (this.httpServer !== undefined) {
            // This HTTP server is only for the OAuth flow support
            this.httpServer.listen(this.httpServerPort);
        }
        // start socket mode client
        return this.client.start();
    }
    stop() {
        if (this.httpServer !== undefined) {
            // This HTTP server is only for the OAuth flow support
            this.httpServer.close((error) => {
                if (error)
                    this.logger.error(`Failed to shutdown the HTTP server for OAuth flow: ${error}`);
            });
        }
        return new Promise((resolve, reject) => {
            try {
                this.client.disconnect();
                resolve();
            }
            catch (error) {
                reject(error);
            }
        });
    }
}
exports.default = SocketModeReceiver;
//# sourceMappingURL=SocketModeReceiver.js.map