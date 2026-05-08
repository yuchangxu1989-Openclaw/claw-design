import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ArtifactType, DesignSkill } from '../types.js';

/** Resolve the discoverable execution skills directory relative to this file's location */
function getExecutionSkillsDir(): string {
  const currentDir = fileURLToPath(new URL('..', import.meta.url));
  return join(currentDir, 'execution', 'skills');
}

/** Resolve the built-in skills directory (src/skills/ and src/execution/) */
function getBuiltInDirs(): string[] {
  const currentDir = fileURLToPath(new URL('..', import.meta.url));
  return [
    join(currentDir, 'execution'),
    join(currentDir, 'skills'),
  ];
}

export class SkillRegistry {
  private readonly skillsByName = new Map<string, DesignSkill>();
  private readonly skillsByType = new Map<ArtifactType, DesignSkill[]>();

  register(skill: DesignSkill): void {
    this.skillsByName.set(skill.contract.name, skill);

    for (const type of getSupportedTypes(skill)) {
      const skills = this.skillsByType.get(type) ?? [];
      const deduped = [...skills.filter(item => item.contract.name !== skill.contract.name), skill];
      this.skillsByType.set(type, deduped);
    }
  }

  registerAll(skills: Iterable<DesignSkill>): void {
    for (const skill of skills) {
      this.register(skill);
    }
  }

  getByName(name: string): DesignSkill | undefined {
    return this.skillsByName.get(name);
  }

  getByArtifactType(type: ArtifactType): DesignSkill[] {
    return [...(this.skillsByType.get(type) ?? [])];
  }

  list(): DesignSkill[] {
    return [...this.skillsByName.values()];
  }

  listNames(): string[] {
    return this.list().map(skill => skill.contract.name);
  }

  async discoverAndRegister(dir = getExecutionSkillsDir()): Promise<DesignSkill[]> {
    const discovered = await discoverSkillsFromDir(dir);
    this.registerAll(discovered);
    return discovered;
  }

  /**
   * Auto-discover all built-in skills from src/execution/ and src/skills/ directories.
   * Replaces manual `new Skill()` + `registerAll()` in createPipeline().
   */
  async discoverBuiltIn(): Promise<DesignSkill[]> {
    const allDiscovered: DesignSkill[] = [];
    for (const dir of getBuiltInDirs()) {
      const discovered = await discoverSkillsFromDir(dir);
      this.registerAll(discovered);
      allDiscovered.push(...discovered);
    }
    return allDiscovered;
  }
}

/**
 * Discover all DesignSkill implementations from the skills/ subdirectory.
 * Each file must `export default` a DesignSkill instance or a class with a no-arg constructor.
 */
export async function discoverSkills(): Promise<DesignSkill[]> {
  return discoverSkillsFromDir(getExecutionSkillsDir());
}

export async function discoverSkillsFromDir(dir: string): Promise<DesignSkill[]> {
  const skills: DesignSkill[] = [];

  let files: string[];
  try {
    files = readdirSync(dir).filter(file => {
      const extension = extname(file);
      return ['.js', '.ts', '.mjs', '.cjs'].includes(extension) && !file.endsWith('.d.ts');
    });
  } catch {
    return skills;
  }

  for (const file of files) {
    try {
      const fullPath = join(dir, file);
      const mod = await import(pathToFileURL(fullPath).href);
      const exported = mod.default ?? mod;

      if (isDesignSkill(exported)) {
        skills.push(exported);
      } else if (typeof exported === 'function') {
        const instance = new exported();
        if (isDesignSkill(instance)) {
          skills.push(instance);
        }
      }
    } catch {
      // Skip files that fail to load — keep discovery resilient.
    }
  }

  return skills;
}

function getSupportedTypes(skill: DesignSkill): ArtifactType[] {
  const declared = skill.contract.supportedTypes;
  if (Array.isArray(declared) && declared.length > 0) {
    return [...new Set(declared)];
  }
  return [skill.contract.artifactType];
}

function isDesignSkill(obj: unknown): obj is DesignSkill {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    'contract' in candidate &&
    typeof candidate.generate === 'function' &&
    typeof (candidate.contract as Record<string, unknown>)?.name === 'string'
  );
}
