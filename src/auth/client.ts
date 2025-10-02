import { NodeOAuthClient } from "@atproto/oauth-client-node";
import type { Database } from "../db";
import { SessionStore, StateStore } from "./storage";

export const createClient = async (db: Database, port: number) => {
  const publicUrl = process.env.PUBLIC_URL;
  const url = publicUrl || `http://127.0.0.1:${port}`;
  const enc = encodeURIComponent;

  // Use Bluesky as the authorization server for testing
  const authorizationServerMetadata = {
    issuer: "https://bsky.social",
    authorization_endpoint: "https://bsky.social/oauth/authorize",
    token_endpoint: "https://bsky.social/oauth/token",
    pushed_authorization_request_endpoint: "https://bsky.social/oauth/par",
    scopes_supported: ["atproto", "transition:generic", "transition:chat.bsky", "transition:email"],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "private_key_jwt"],
    dpop_signing_alg_values_supported: ["ES256"],
    require_pushed_authorization_requests: true,
  };

  return new NodeOAuthClient({
    clientMetadata: {
      client_name: "AT Protocol Express App",
      client_id: publicUrl
        ? `${url}/client-metadata.json`
        : `http://localhost?redirect_uri=${enc(`${url}/api/auth/oauth/callback`)}&scope=${enc("atproto transition:generic")}`,
      client_uri: url,
      redirect_uris: [`${url}/api/auth/oauth/callback`],
      scope: "atproto transition:generic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      application_type: "web",
      token_endpoint_auth_method: "none",
      dpop_bound_access_tokens: true,
    },
    // @ts-ignore - Using non-standard option to configure external authorization server
    authorizationServerMetadata,
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  });
};
