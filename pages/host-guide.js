import { useEffect } from "react";

export default function HostGuide() {
  useEffect(() => {
    // Keep old /host-guide working, but render the exact UI you like:
    window.location.replace("/host-guide.html");
  }, []);

  return null;
}
