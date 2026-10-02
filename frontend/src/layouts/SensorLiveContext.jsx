import { createContext } from "react";

export const SensorLiveContext = createContext({
    isOnline: false,
    revision: 0,
});