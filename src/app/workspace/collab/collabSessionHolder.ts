/**
 * Module-level holder for the active CollabSession.
 * This enables sharing the session between CollabPanel (which creates/destroys it)
 * and WorkspaceEditorPane (which binds Monaco to it).
 *
 * We use a plain module-level variable instead of Zustand because the session
 * contains non-serializable Y.Doc / WebrtcProvider objects.
 */
import type { CollabSession } from "./CollabProvider";

let _session: CollabSession | null = null;

export function getCollabSession(): CollabSession | null {
  return _session;
}

export function setCollabSession(session: CollabSession | null): void {
  _session = session;
}
