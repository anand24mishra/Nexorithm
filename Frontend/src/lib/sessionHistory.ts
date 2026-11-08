import type { NavigateFunction } from "react-router-dom";

let sessionExit = false;
let publicScrubbed = false;

/** Session just ended, so the next protected render must leave for the public page. */
export function markSessionExit() {
  sessionExit = true;
  publicScrubbed = false;
}

export function isSessionExit() {
  return sessionExit;
}

export function clearSessionExit() {
  sessionExit = false;
}

export function noteSessionStarted() {
  sessionExit = false;
  publicScrubbed = false;
}

/**
 * Replace the current history entry with the public landing page.
 * A second push would leave the protected URL in the forward stack, where a
 * trackpad swipe can reopen it.
 */
export function scrubToPublic(navigate: NavigateFunction) {
  if (publicScrubbed && window.location.pathname === "/") return;
  publicScrubbed = true;
  navigate("/", { replace: true });
}
