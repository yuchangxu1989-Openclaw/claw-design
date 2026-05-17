import type { Artifact, ArtifactStatus } from '../types.js';

export interface RevisionEntry {
  id: string;
  timestamp: string;
  description: string;
  changes: RevisionChange[];
  previousHtml: string;
}

export interface RevisionChange {
  type: 'content' | 'style' | 'layout' | 'add' | 'remove';
  target: string;
  description: string;
}

export interface RevisionableArtifact extends Artifact {
  revisions: RevisionEntry[];
  currentRevision: number;
}

const VALID_TRANSITIONS: Record<ArtifactStatus, ArtifactStatus[]> = {
  generating: ['ready'],
  ready: ['revision', 'archived'],
  revision: ['ready'],
  archived: [],
};

export function canTransition(from: ArtifactStatus, to: ArtifactStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionStatus(artifact: Artifact, to: ArtifactStatus): Artifact {
  if (!canTransition(artifact.status, to)) {
    throw new Error(`Invalid transition: ${artifact.status} → ${to}`);
  }
  return { ...artifact, status: to };
}

export function toRevisionable(artifact: Artifact): RevisionableArtifact {
  return {
    ...artifact,
    revisions: [],
    currentRevision: 0,
  };
}

export function startRevision(
  artifact: RevisionableArtifact,
  description: string,
): RevisionableArtifact {
  if (artifact.status !== 'ready') {
    throw new Error(`Cannot start revision from status: ${artifact.status}`);
  }
  const entry: RevisionEntry = {
    id: `rev-${artifact.revisions.length + 1}`,
    timestamp: new Date().toISOString(),
    description,
    changes: [],
    previousHtml: artifact.html,
  };
  return {
    ...artifact,
    status: 'revision',
    revisions: [...artifact.revisions, entry],
    currentRevision: artifact.revisions.length + 1,
  };
}

export function applyRevision(
  artifact: RevisionableArtifact,
  newHtml: string,
  changes: RevisionChange[],
): RevisionableArtifact {
  if (artifact.status !== 'revision') {
    throw new Error(`Cannot apply revision in status: ${artifact.status}`);
  }
  const revisions = [...artifact.revisions];
  const current = revisions[revisions.length - 1];
  if (current) {
    revisions[revisions.length - 1] = { ...current, changes };
  }
  return {
    ...artifact,
    status: 'ready',
    html: newHtml,
    revisions,
  };
}

export function rollbackToRevision(
  artifact: RevisionableArtifact,
  revisionIndex: number,
): RevisionableArtifact {
  if (revisionIndex < 0 || revisionIndex >= artifact.revisions.length) {
    throw new Error(`Revision index out of range: ${revisionIndex}`);
  }
  const targetRevision = artifact.revisions[revisionIndex];
  return {
    ...artifact,
    status: 'ready',
    html: targetRevision.previousHtml,
    currentRevision: revisionIndex,
  };
}

export function getRevisionHistory(artifact: RevisionableArtifact): RevisionEntry[] {
  return [...artifact.revisions];
}
