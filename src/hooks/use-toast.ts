"use client";

import { toast as toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/utils/errorHandler";

export interface ToastOptions {
  title?: string;
  description?: string;
  type?: "success" | "error" | "info" | "warning";
}

export function toast(options: ToastOptions | string) {
  if (typeof options === "string") {
    return toastManager.add({
      description: options,
      type: "info",
    });
  }

  return toastManager.add({
    title: options.title,
    description: options.description,
    type: options.type || "info",
  });
}

toast.success = (description: string, title = "Success") => {
  return toastManager.add({
    title,
    description,
    type: "success",
  });
};

toast.error = (error: unknown, title = "Error") => {
  const description = typeof error === "string" ? error : getErrorMessage(error);
  return toastManager.add({
    title,
    description,
    type: "error",
  });
};

toast.info = (description: string, title = "Info") => {
  return toastManager.add({
    title,
    description,
    type: "info",
  });
};

toast.dismiss = (id?: string) => {
  toastManager.close(id);
};

export function useToast() {
  return {
    toast,
    dismiss: toast.dismiss,
  };
}
