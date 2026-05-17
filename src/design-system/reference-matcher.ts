// FR-G03 AC3: Reference page matcher — auto-selects reference page by task type
import type { DesignSystemPackage, ReferencePage } from './types.js';

export type TaskType =
  | 'slides'
  | 'chart'
  | 'architecture'
  | 'flowchart'
  | 'poster'
  | 'landing'
  | 'ui-mockup'
  | 'dashboard'
  | 'infographic'
  | 'logic-diagram'
  | 'prototype'
  | 'general';

export interface ReferencePageEntry {
  taskType: TaskType;
  page: ReferencePage;
}

/**
 * Manages reference pages per task type within a design system package.
 * FR-G03 AC3: Reference pages can be user-specified or auto-matched by task type.
 */
export class ReferencePageMatcher {
  private taskReferences = new Map<string, Map<TaskType, ReferencePage>>();

  /**
   * Register a task-specific reference page for a package.
   */
  registerReference(packageId: string, taskType: TaskType, page: ReferencePage): void {
    if (!this.taskReferences.has(packageId)) {
      this.taskReferences.set(packageId, new Map());
    }
    this.taskReferences.get(packageId)!.set(taskType, page);
  }

  /**
   * Resolve the best reference page for a given task.
   * Priority: user-specified > task-type match > package default.
   */
  resolve(
    pkg: DesignSystemPackage,
    taskType: TaskType,
    userSpecified?: ReferencePage,
  ): ReferencePage {
    // 1. User-specified takes priority
    if (userSpecified) {
      return userSpecified;
    }

    // 2. Task-type specific reference
    const pkgRefs = this.taskReferences.get(pkg.id);
    if (pkgRefs) {
      const taskRef = pkgRefs.get(taskType);
      if (taskRef) return taskRef;
    }

    // 3. Fall back to package default reference
    return pkg.reference;
  }

  /**
   * List all registered reference pages for a package.
   */
  listReferences(packageId: string): ReferencePageEntry[] {
    const pkgRefs = this.taskReferences.get(packageId);
    if (!pkgRefs) return [];
    return Array.from(pkgRefs.entries()).map(([taskType, page]) => ({ taskType, page }));
  }

  /**
   * Check if a package has a task-specific reference.
   */
  hasReference(packageId: string, taskType: TaskType): boolean {
    return this.taskReferences.get(packageId)?.has(taskType) ?? false;
  }
}
