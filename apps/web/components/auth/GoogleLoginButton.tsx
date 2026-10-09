"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: {
              credential: string;
            }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;

          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
            },
          ) => void;

          prompt: () => void;

          disableAutoSelect?: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

const GOOGLE_SCRIPT_ID =
  "brx-google-identity-services";

const GOOGLE_SCRIPT_SRC =
  "https://accounts.google.com/gsi/client";

export default function GoogleLoginButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleLoginButtonProps) {
  const buttonRef =
    useRef<HTMLDivElement>(null);

  const initializedRef =
    useRef(false);

  const onSuccessRef =
    useRef(onSuccess);

  const onErrorRef =
    useRef(onError);

  const [scriptReady, setScriptReady] =
    useState(false);

  const [scriptError, setScriptError] =
    useState("");

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  /*
   * Keep callbacks current without forcing
   * Google initialization to run again.
   */
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  /*
   * Load Google Identity Services immediately.
   *
   * We intentionally do not depend on next/script
   * timing here. This fixes the first-load issue where
   * Google appears only after refreshing the page.
   */
  useEffect(() => {
    if (!clientId) {
      return;
    }

    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existingScript =
      document.getElementById(
        GOOGLE_SCRIPT_ID,
      ) as HTMLScriptElement | null;

    if (existingScript) {
      const handleLoad = () => {
        if (
          window.google?.accounts?.id
        ) {
          setScriptReady(true);
          setScriptError("");
        }
      };

      const handleError = () => {
        setScriptError(
          "Unable to load Google Sign-In.",
        );

        onErrorRef.current?.(
          "Unable to load Google Sign-In.",
        );
      };

      existingScript.addEventListener(
        "load",
        handleLoad,
      );

      existingScript.addEventListener(
        "error",
        handleError,
      );

      /*
       * The script may already have finished loading
       * before this component attached its listener.
       */
      if (window.google?.accounts?.id) {
        handleLoad();
      }

      return () => {
        existingScript.removeEventListener(
          "load",
          handleLoad,
        );

        existingScript.removeEventListener(
          "error",
          handleError,
        );
      };
    }

    const script =
      document.createElement("script");

    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;

    const handleLoad = () => {
      if (
        window.google?.accounts?.id
      ) {
        setScriptReady(true);
        setScriptError("");
      } else {
        const message =
          "Google Sign-In loaded incorrectly.";

        setScriptError(message);
        onErrorRef.current?.(message);
      }
    };

    const handleError = () => {
      const message =
        "Unable to load Google Sign-In.";

      setScriptError(message);
      onErrorRef.current?.(message);
    };

    script.addEventListener(
      "load",
      handleLoad,
    );

    script.addEventListener(
      "error",
      handleError,
    );

    document.head.appendChild(script);

    return () => {
      script.removeEventListener(
        "load",
        handleLoad,
      );

      script.removeEventListener(
        "error",
        handleError,
      );
    };
  }, [clientId]);

  /*
   * Initialize Google and render the actual
   * Google button once the script is ready.
   */
  const initializeGoogle =
    useCallback(() => {
      if (
        disabled ||
        !scriptReady ||
        !clientId ||
        !buttonRef.current ||
        !window.google?.accounts?.id
      ) {
        return;
      }

      if (initializedRef.current) {
        return;
      }

      try {
        initializedRef.current = true;

        window.google.accounts.id.initialize(
          {
            client_id: clientId,

            callback: (response) => {
              if (
                !response?.credential
              ) {
                initializedRef.current =
                  false;

                onErrorRef.current?.(
                  "Google did not return a valid credential.",
                );

                return;
              }

              onSuccessRef.current(
                response.credential,
              );
            },

            auto_select: false,

            cancel_on_tap_outside: true,
          },
        );

        const container =
          buttonRef.current;

        container.innerHTML = "";

        window.google.accounts.id.renderButton(
          container,
          {
            theme: "outline",
            size: "large",
            width: 400,
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left",
          },
        );
      } catch {
        initializedRef.current =
          false;

        onErrorRef.current?.(
          "Unable to initialize Google Sign-In.",
        );
      }
    }, [
      clientId,
      disabled,
      scriptReady,
    ]);

  useEffect(() => {
    initializeGoogle();
  }, [initializeGoogle]);

  /*
   * Reset initialization when the component
   * becomes enabled again.
   */
  useEffect(() => {
    if (!disabled) {
      return;
    }

    initializedRef.current = false;

    if (buttonRef.current) {
      buttonRef.current.innerHTML = "";
    }
  }, [disabled]);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-center text-sm text-red-200">
        Google Sign-In is not configured.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={buttonRef}
        className={`flex min-h-[44px] w-full justify-center transition ${
          disabled
            ? "pointer-events-none opacity-50"
            : ""
        }`}
      />

      {!scriptReady &&
        !scriptError && (
          <div
            className="mt-2 text-center text-xs text-slate-500"
            aria-live="polite"
          >
            Loading Google Sign-In...
          </div>
        )}

      {scriptError && (
        <div
          className="mt-2 text-center text-xs text-red-300"
          role="alert"
        >
          {scriptError}
        </div>
      )}
    </div>
  );
}