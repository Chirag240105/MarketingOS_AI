"use client";

import toast from "react-hot-toast";

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string, err?: unknown) => {
    const detail = err instanceof Error ? err.message : "";
    toast.error(detail ? `${msg}: ${detail}` : msg);
  },
  loading: (msg: string) => toast.loading(msg),
  promise: <T>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string },
  ) => toast.promise(promise, msgs),
  dismiss: (id?: string) => toast.dismiss(id),
};
