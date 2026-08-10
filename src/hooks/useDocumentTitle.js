import { useEffect } from "react";
import { APP_NAME } from "../utils/constants";

/** Sets `document.title` for the mounted page and restores it on unmount. */
export default function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
