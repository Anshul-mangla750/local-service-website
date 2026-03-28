import { useEffect } from "react";

import { useAppContext } from "../context/AppContext";

export default function NoticeBanner() {
  const { notice, clearNotice } = useAppContext();

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      clearNotice();
    }, 3800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice, clearNotice]);

  if (!notice) {
    return null;
  }

  return (
    <div className={`notice-banner notice-${notice.type}`}>
      <span>{notice.message}</span>
      <button type="button" onClick={clearNotice}>
        Dismiss
      </button>
    </div>
  );
}
