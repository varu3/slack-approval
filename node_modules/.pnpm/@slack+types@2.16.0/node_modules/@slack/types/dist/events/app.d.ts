import type { Block, KnownBlock } from '../block-kit/blocks';
import type { BotProfile } from '../common/bot-profile';
import type { MessageAttachment } from '../message-attachments';
import type { View } from '../views';
export interface AppRequestedEvent {
    type: 'app_requested';
    app_request: {
        id: string;
        app: {
            id: string;
            name: string;
            description: string;
            help_url: string;
            privacy_policy_url: string;
            app_homepage_url: string;
            app_directory_url: string;
            is_granular_bot_app: boolean;
            is_app_directory_approved: boolean;
            is_internal: boolean;
            additional_info: string;
            icons?: {
                image_32?: string;
                image_36?: string;
                image_48?: string;
                image_64?: string;
                image_72?: string;
                image_96?: string;
                image_128?: string;
                image_192?: string;
                image_512?: string;
                image_1024?: string;
                image_original?: string;
            };
        };
    };
    previous_resolution: {
        status: 'approved' | 'restricted';
        scopes: {
            name: string;
            description: string;
            is_dangerous: boolean;
            token_type: 'bot' | 'user' | 'app' | null;
        };
    } | null;
    is_user_app_collaborator: boolean;
    user: {
        id: string;
        name: string;
        email: string;
    };
    team: {
        id: string;
        name: string;
        domain: string;
    };
    scopes: {
        name: string;
        description: string;
        is_dangerous: boolean;
        token_type: 'bot' | 'user' | 'app' | null;
    };
    message: string;
    date_created: number;
}
export interface AppHomeOpenedEvent {
    type: 'app_home_opened';
    user: string;
    channel: string;
    tab?: 'home' | 'messages';
    view?: View;
    event_ts: string;
}
export interface AppInstalledEvent {
    type: 'app_installed';
    app_id: string;
    app_name: string;
    app_owner_id: string;
    user_id: string;
    team_id: string;
    team_domain: string;
    event_ts: string;
}
export interface AppDeletedEvent {
    type: 'app_deleted';
    app_id: string;
    app_name: string;
    app_owner_id: string;
    team_id: string;
    team_domain: string;
    event_ts: string;
}
export interface AppUninstalledTeamEvent {
    type: 'app_uninstalled_team';
    app_id: string;
    app_name: string;
    app_owner_id: string;
    team_id: string;
    team_domain: string;
    user_id: string;
    event_ts: string;
}
export interface AppMentionEvent {
    type: 'app_mention';
    subtype?: string;
    bot_id?: string;
    bot_profile?: BotProfile;
    username?: string;
    team?: string;
    user_team?: string;
    source_team?: string;
    user_profile?: {
        name: string;
        first_name: string;
        real_name: string;
        display_name: string;
        team: string;
        is_restricted?: boolean;
        is_ultra_restricted?: boolean;
        avatar_hash?: string;
        image_72?: string;
    };
    user?: string;
    text: string;
    attachments?: MessageAttachment[];
    blocks?: (KnownBlock | Block)[];
    files?: {
        id: string;
    }[];
    upload?: boolean;
    display_as_bot?: boolean;
    edited?: {
        user: string;
        ts: string;
    };
    ts: string;
    channel: string;
    event_ts: string;
    thread_ts?: string;
    client_msg_id?: string;
}
export interface AppRateLimitedEvent {
    type: 'app_rate_limited';
    token: string;
    team_id: string;
    minute_rate_limited: number;
    api_app_id: string;
}
export interface AppUninstalledEvent {
    type: 'app_uninstalled';
}
//# sourceMappingURL=app.d.ts.map