"use client";

import { useState, useEffect } from "react";

export function useObjectUrl(object: Blob | File | MediaSource | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!object) {
      setUrl(null);
      return;
    }

    const newUrl = URL.createObjectURL(object);
    setUrl(newUrl);

    return () => {
      URL.revokeObjectURL(newUrl);
    };
  }, [object]);

  return url;
}
