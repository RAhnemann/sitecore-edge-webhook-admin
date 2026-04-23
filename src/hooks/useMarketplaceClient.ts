"use client";

/**
 * useMarketplaceClient
 *
 * Initializes the Sitecore Marketplace SDK client and exposes:
 * - client: the raw ClientSDK instance
 * - isInitialized: whether the client is ready
 * - isLoading: whether initialization is in progress
 * - error: any initialization error
 * - initialize: manually trigger initialization
 * - currentUser: the logged-in Sitecore user resolved from host.user
 *
 * Based on the marketplace-starter reference implementation, with the
 * addition of currentUser resolution.
 *
 * Ref: https://www.npmjs.com/package/@sitecore-marketplace-sdk/client
 */

import { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

export interface MarketplaceUser {
  name: string;
  nickname?: string;
  email?: string;
  [key: string]: unknown;
}

export interface MarketplaceClientState {
  client: ClientSDK | null;
  error: Error | null;
  isLoading: boolean;
  isInitialized: boolean;
  currentUser: MarketplaceUser | null;
}

export interface UseMarketplaceClientOptions {
  /** Number of retry attempts when initialization fails @default 3 */
  retryAttempts?: number;
  /** Delay between retry attempts in milliseconds @default 1000 */
  retryDelay?: number;
  /** Whether to automatically initialize the client @default true */
  autoInit?: boolean;
}

const DEFAULT_OPTIONS: Required<UseMarketplaceClientOptions> = {
  retryAttempts: 3,
  retryDelay: 1000,
  autoInit: true,
};

// Module-level singleton
let sdkClient: ClientSDK | undefined = undefined;

async function getMarketplaceClient(): Promise<ClientSDK> {
  if (sdkClient) return sdkClient;

  sdkClient = await ClientSDK.init({
    target: window.parent,
    modules: [XMC],
  });

  return sdkClient;
}

export function useMarketplaceClient(options: UseMarketplaceClientOptions = {}) {
  // Depend on individual primitives, not the options object reference.
  // Without this, an inline literal like useMarketplaceClient() creates a new
  // {} on every render, causing opts → initializeClient → useEffect to
  // re-run every render, resetting state before currentUser can stabilize.
  const opts = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.retryAttempts, options.retryDelay, options.autoInit]
  );

  const [state, setState] = useState<MarketplaceClientState>({
    client: null,
    error: null,
    isLoading: false,
    isInitialized: false,
    currentUser: null,
  });

  const isInitializingRef = useRef(false);

  const initializeClient = useCallback(async (attempt = 1): Promise<void> => {
    let shouldProceed = false;

    setState((prev) => {
      if (prev.isLoading || prev.isInitialized || isInitializingRef.current) return prev;
      shouldProceed = true;
      isInitializingRef.current = true;
      return { ...prev, isLoading: true, error: null };
    });

    if (!shouldProceed) return;

    try {
      const client = await getMarketplaceClient();

      // Resolve current user — non-fatal if unavailable
      let currentUser: MarketplaceUser | null = null;
      try {
        const userResult = await client.query("host.user");
        if (userResult?.data) {
          currentUser = userResult.data as unknown as MarketplaceUser;
        }
      } catch {
        console.warn("Could not resolve host.user");
      }

      setState({ client, error: null, isLoading: false, isInitialized: true, currentUser });
    } catch (error) {
      if (attempt < opts.retryAttempts) {
        await new Promise((resolve) => setTimeout(resolve, opts.retryDelay));
        return initializeClient(attempt + 1);
      }

      setState({
        client: null,
        error: error instanceof Error ? error : new Error("Failed to initialize MarketplaceClient"),
        isLoading: false,
        isInitialized: false,
        currentUser: null,
      });
    } finally {
      isInitializingRef.current = false;
    }
  }, [opts.retryAttempts, opts.retryDelay]);

  useEffect(() => {
    if (opts.autoInit) {
      initializeClient();
    }

    return () => {
      isInitializingRef.current = false;
      setState({ client: null, error: null, isLoading: false, isInitialized: false, currentUser: null });
    };
  }, [opts.autoInit, initializeClient]);

  return useMemo(() => ({ ...state, initialize: initializeClient }), [state, initializeClient]);
}
