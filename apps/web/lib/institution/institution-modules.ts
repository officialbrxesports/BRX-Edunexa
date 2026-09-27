import {
  MODULES,
  ModuleDefinition,
  ModuleKey,
  InstitutionType,
} from "./modules";

import { INSTITUTION_MODULES } from "./institution-config";

export function getInstitutionModules(
  type: InstitutionType,
): ModuleDefinition[] {
  const keys =
    INSTITUTION_MODULES[type] ??
    INSTITUTION_MODULES.OTHER;

  return keys
    .filter((key, index) =>
      keys.indexOf(key) === index,
    )
    .map((key) => MODULES[key]);
}

export function hasInstitutionModule(
  type: InstitutionType,
  module: ModuleKey,
): boolean {
  return (
    INSTITUTION_MODULES[type]?.includes(module) ??
    false
  );
}