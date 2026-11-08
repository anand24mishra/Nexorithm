import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "./googleClientId";

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: {
          theme: string;
          size: string;
          width: number;
          text: GoogleButtonText;
          shape: string;
          logo_alignment: string;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

type Props = {
  text: GoogleButtonText;
  disabled?: boolean;
  onCredential: (credential: string) => void;
};

const initializedClientIds = new Set<string>();
const credentialBridge: { current: (credential: string) => void } = {
  current: () => {},
};

function ensureGoogleInitialized(clientId: string): void {
  const google = window.google;
  if (!google || initializedClientIds.has(clientId)) return;
  google.accounts.id.initialize({
    client_id: clientId,
    auto_select: false,
    cancel_on_tap_outside: true,
    callback: (response) => {
      if (response.credential) credentialBridge.current(response.credential);
    },
  });
  initializedClientIds.add(clientId);
}

export function GoogleSignIn({ text, disabled = false, onCredential }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "blocked">(
    GOOGLE_CLIENT_ID ? "loading" : "missing",
  );

  useEffect(() => {
    onCredentialRef.current = onCredential;
    const forward = (credential: string) => {
      onCredentialRef.current(credential);
    };
    credentialBridge.current = forward;
    return () => {
      if (credentialBridge.current === forward) credentialBridge.current = () => {};
    };
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    let cancelled = false;
    let poll = 0;
    let attempts = 0;
    let paintedWidth = 0;
    let observer: ResizeObserver | undefined;

    const render = () => {
      const slot = slotRef.current;
      const google = window.google;
      if (!slot || !google || cancelled) return false;

      ensureGoogleInitialized(GOOGLE_CLIENT_ID);

      const width = Math.round(Math.min(Math.max(slot.clientWidth, 240), 400));
      if (slot.childElementCount > 0 && width === paintedWidth) return true;

      slot.innerHTML = "";
      paintedWidth = width;
      google.accounts.id.renderButton(slot, {
        theme: "filled_black",
        size: "large",
        width,
        text,
        shape: "pill",
        logo_alignment: "left",
      });
      setStatus("ready");
      return true;
    };

    if (!render()) {
      poll = window.setInterval(() => {
        attempts += 1;
        if (render()) {
          window.clearInterval(poll);
          return;
        }
        if (attempts > 50) {
          window.clearInterval(poll);
          if (!cancelled) setStatus("blocked");
        }
      }, 100);
    }

    if (slotRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(() => {
        render();
      });
      observer.observe(slotRef.current);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (poll) window.clearInterval(poll);
    };
  }, [text]);

  if (status === "missing") {
    return (
      <p className="auth-google-note">
        Google sign-in is not configured for this build.
      </p>
    );
  }

  if (status === "blocked") {
    return (
      <p className="auth-google-note">
        Google’s script did not load. Continue with email, or allow accounts.google.com.
      </p>
    );
  }

  return (
    <>
      <div className="auth-google" aria-busy={status === "loading"}>
        {status === "loading" ? <div className="auth-google-skeleton" aria-hidden="true" /> : null}
        <div
          ref={slotRef}
          className="auth-google-slot"
          style={disabled ? { pointerEvents: "none", opacity: 0.55 } : undefined}
        />
      </div>
      <div className="auth-divider">or</div>
    </>
  );
}
