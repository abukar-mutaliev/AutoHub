import { createContext, useContext } from "react";

const SessionContext = createContext({
  isSessionLoading: false,
  sessionTick: 0,
  refreshSession: () => {}
});

export function SessionProvider({ value, children }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
