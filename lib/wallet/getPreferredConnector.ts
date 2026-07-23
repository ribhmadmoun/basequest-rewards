import type { Connector } from "wagmi";
import { FARCASTER_MINI_APP_CONNECTOR_ID } from "@/lib/miniapp/constants";
import type { AppEnvironment } from "@/lib/miniapp/environment";

function findConnector(
  connectors: readonly Connector[],
  predicate: (connector: Connector) => boolean,
): Connector | undefined {
  return connectors.find(predicate);
}

function getFarcasterMiniAppConnector(
  connectors: readonly Connector[],
): Connector | undefined {
  return findConnector(
    connectors,
    (connector) =>
      connector.id === FARCASTER_MINI_APP_CONNECTOR_ID ||
      connector.type === "farcasterMiniApp" ||
      connector.type === "farcasterFrame",
  );
}

function getBrowserConnector(
  connectors: readonly Connector[],
): Connector | undefined {
  return (
    findConnector(connectors, (connector) => connector.id === "injected") ??
    findConnector(
      connectors,
      (connector) =>
        connector.id === "coinbaseWalletSDK" ||
        connector.id === "coinbaseWallet",
    ) ??
    findConnector(connectors, (connector) => connector.id === "walletConnect")
  );
}

/**
 * Prefers the official Farcaster Mini App connector inside Mini App hosts.
 * Never auto-selects `injected` inside Mini Apps.
 * Browser keeps the existing injected → Coinbase → WalletConnect order.
 */
export function getPreferredConnector(
  connectors: readonly Connector[],
  environment: AppEnvironment,
): Connector | undefined {
  const farcasterConnector = getFarcasterMiniAppConnector(connectors);

  if (environment.isMiniApp) {
    return farcasterConnector;
  }

  return getBrowserConnector(connectors);
}
