import { useNetworkState } from "expo-network";

/** True unless the device reports no connection; an unknown state counts as online. */
export function useOnline() {
  const state = useNetworkState();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
