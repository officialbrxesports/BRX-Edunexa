"use client";

import Script from "next/script";
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
  onSuccess: (
    credential: string,
  ) => void;

  onError?: (
    message: string,
  ) => void;

  disabled?: boolean;
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleLoginButtonProps) {
  const buttonRef =
    useRef<HTMLDivElement>(null);

  const initializedRef =
    useRef(false);

  const [
    scriptLoaded,
    setScriptLoaded,
  ] = useState(false);

  const clientId =
    process.env
      .NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const initializeGoogle =
    useCallback(() => {
      if (
        disabled ||
        !scriptLoaded ||
        !buttonRef.current ||
        !clientId ||
        !window.google
      ) {
        return;
      }

      if (initializedRef.current) {
        return;
      }

      initializedRef.current = true;

      try {
        window.google.accounts.id.initialize(
          {
            client_id: clientId,

            callback: (
              response,
            ) => {
              if (
                !response?.credential
              ) {
                onError?.(
                  "Google did not return a valid credential.",
                );

                return;
              }

              onSuccess(
                response.credential,
              );
            },

            auto_select: false,

            cancel_on_tap_outside: true,
          },
        );

        if (
          buttonRef.current
        ) {
          buttonRef.current.innerHTML =
            "";

          window.google.accounts.id.renderButton(
            buttonRef.current,
            {
              theme: "outline",
              size: "large",
              width: 400,
              text: "continue_with",
              shape: "pill",
              logo_alignment: "left",
            },
          );
        }
      } catch {
        initializedRef.current =
          false;

        onError?.(
          "Unable to initialize Google Sign-In.",
        );
      }
    }, [
      clientId,
      disabled,
      onError,
      onSuccess,
      scriptLoaded,
    ]);

  useEffect(() => {
    initializeGoogle();
  }, [initializeGoogle]);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
        Google Sign-In is not configured.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          onError?.(
            "Unable to load Google Sign-In.",
          );
        }}
      />

      <div
        ref={buttonRef}
        className={`flex min-h-[44px] w-full justify-center transition ${
          disabled
            ? "pointer-events-none opacity-50"
            : ""
        }`}
      />

      {!scriptLoaded && (
        <div className="text-center text-xs text-slate-500">
          Loading Google Sign-In...
        </div>
      )}
    </>
  );
}