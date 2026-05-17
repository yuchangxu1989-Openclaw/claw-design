// execution/skills/ — Drop-in skill directory
//
// To add a new skill:
// 1. Create a .ts file in this directory
// 2. Export default a DesignSkill instance (or a class with no-arg constructor)
// 3. That's it — SkillRegistry.discoverSkills() picks it up automatically
//
// Example:
//   import type { DesignSkill } from '../../types.js';
//   const mySkill: DesignSkill = { contract: {...}, generate: async (...) => {...} };
//   export default mySkill;
