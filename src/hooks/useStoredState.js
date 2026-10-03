import { useState, useEffect } from "react";
import { saveStored } from "../lib/storage";

// Like useState, but the initial value comes from `load` (a validated localStorage read)
// and every change is written back under `key`.
export function useStoredState(key, load) {
  const [value, setValue] = useState(load);
  useEffect(() => { saveStored(key, value); }, [key, value]);
  return [value, setValue];
}
