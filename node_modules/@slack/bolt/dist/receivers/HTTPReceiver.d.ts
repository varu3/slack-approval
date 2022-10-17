/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Server, ServerOptions, RequestListener } from 'http';
import { Server as HTTPSServer, ServerOptions as HTTPSServerOptions } from 'https';
import { ListenOptions } from 'net';
import { Logger, LogLevel } from '@slack/logger';
import { InstallProvider, CallbackOptions, InstallProviderOptions, InstallURLOptions, InstallPathOptions } from '@slack/oauth';
import App from '../App';
import { Receiver } from '../types';
import { CustomRoute } from './custom-routes';
import { StringIndexed } from '../types/helpers';
import { BufferedIncomingMessage } from './BufferedIncomingMessage';
import { ReceiverDispatchErrorHandlerArgs, ReceiverProcessEventErrorHandlerArgs, ReceiverUnhandledRequestHandlerArgs } from './HTTPModuleFunctions';
export interface HTTPReceiverOptions {
    signingSecret: string;
    endpoints?: string | string[];
    port?: number;
    customRoutes?: CustomRoute[];
    logger?: Logger;
    logLevel?: LogLevel;
    processBeforeResponse?: boolean;
    signatureVerification?: boolean;
    clientId?: string;
    clientSecret?: string;
    stateSecret?: InstallProviderOptions['stateSecret'];
    redirectUri?: string;
    installationStore?: InstallProviderOptions['installationStore'];
    scopes?: InstallURLOptions['scopes'];
    installerOptions?: HTTPReceiverInstallerOptions;
    customPropertiesExtractor?: (request: BufferedIncomingMessage) => StringIndexed;
    dispatchErrorHandler?: (args: ReceiverDispatchErrorHandlerArgs) => void;
    processEventErrorHandler?: (args: ReceiverProcessEventErrorHandlerArgs) => Promise<boolean>;
    unhandledRequestHandler?: (args: ReceiverUnhandledRequestHandlerArgs) => void;
    unhandledRequestTimeoutMillis?: number;
}
export interface HTTPReceiverInstallerOptions {
    installPath?: string;
    directInstall?: InstallProviderOptions['directInstall'];
    renderHtmlForInstallPath?: InstallProviderOptions['renderHtmlForInstallPath'];
    redirectUriPath?: string;
    stateStore?: InstallProviderOptions['stateStore'];
    stateVerification?: InstallProviderOptions['stateVerification'];
    legacyStateVerification?: InstallProviderOptions['legacyStateVerification'];
    stateCookieName?: InstallProviderOptions['stateCookieName'];
    stateCookieExpirationSeconds?: InstallProviderOptions['stateCookieExpirationSeconds'];
    authVersion?: InstallProviderOptions['authVersion'];
    clientOptions?: InstallProviderOptions['clientOptions'];
    authorizationUrl?: InstallProviderOptions['authorizationUrl'];
    metadata?: InstallURLOptions['metadata'];
    userScopes?: InstallURLOptions['userScopes'];
    installPathOptions?: InstallPathOptions;
    callbackOptions?: CallbackOptions;
    port?: number;
}
/**
 * Receives HTTP requests with Events, Slash Commands, and Actions
 */
export default class HTTPReceiver implements Receiver {
    private endpoints;
    private port;
    private routes;
    private signingSecret;
    private processBeforeResponse;
    private signatureVerification;
    private app?;
    requestListener: RequestListener;
    private server?;
    installer?: InstallProvider;
    private installPath?;
    private installRedirectUriPath?;
    private installUrlOptions?;
    private installPathOptions?;
    private installCallbackOptions?;
    private stateVerification?;
    private logger;
    private customPropertiesExtractor;
    private dispatchErrorHandler;
    private processEventErrorHandler;
    private unhandledRequestHandler;
    private unhandledRequestTimeoutMillis;
    constructor({ signingSecret, endpoints, port, customRoutes, logger, logLevel, processBeforeResponse, signatureVerification, clientId, clientSecret, stateSecret, redirectUri, installationStore, scopes, installerOptions, customPropertiesExtractor, dispatchErrorHandler, processEventErrorHandler, unhandledRequestHandler, unhandledRequestTimeoutMillis, }: HTTPReceiverOptions);
    init(app: App): void;
    start(port: number): Promise<Server>;
    start(port: string): Promise<Server>;
    start(portOrListenOptions: number | string | ListenOptions, serverOptions?: ServerOptions): Promise<Server>;
    start(portOrListenOptions: number | string | ListenOptions, httpsServerOptions?: HTTPSServerOptions): Promise<HTTPSServer>;
    stop(): Promise<void>;
    private unboundRequestListener;
    private handleIncomingEvent;
    private handleInstallPathRequest;
    private handleInstallRedirectRequest;
}
//# sourceMappingURL=HTTPReceiver.d.ts.map