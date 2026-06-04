# Claw Design Plugin Protocol

OpenClaw(主会话) 2026-06-05

Claw Design plugins extend candidate inputs around the core design pipeline. They declare capabilities for the host to discover, install, enable, disable, and uninstall. Plugins do not replace routing, theme constraints, quality conclusion rules, or delivery state.

## Manifest

Each plugin directory must contain `claw-design-plugin.json`.

```json
{
  "name": "starter-assets",
  "version": "1.0.0",
  "type": "asset",
  "source": {
    "kind": "local",
    "reference": "./plugins/starter-assets"
  },
  "capabilities": [
    {
      "id": "starter-icons",
      "summary": "Icon and template candidates",
      "inputFormats": ["json"],
      "outputFormats": ["svg", "html"],
      "artifactTypes": ["slides", "landing-page"],
      "scenes": ["presentation", "web"],
      "scope": "assets/icons"
    }
  ],
  "entry": "./plugin.js",
  "dependencies": [],
  "quality": {
    "maturity": "stable",
    "notes": "Reviewed asset metadata"
  }
}
```

Required fields:

- `name`: stable plugin identifier.
- `version`: semantic plugin version.
- `type`: one of `asset`, `transform`, or `validator`.
- `capabilities`: declared capability boundaries, including input formats, output formats, applicable artifact types, and the plugin-owned `scope`.
- `entry`: plugin-owned entry path. It must be relative and stay inside the plugin directory.
- `dependencies`: plugin dependencies declared for audit and installation planning.
- `quality`: maturity and quality notes.

## Plugin Types

- `asset`: contributes theme, material, icon, illustration, template, or motion candidates to generation context.
- `transform`: contributes export adapter candidates for format derivation or structural transformation.
- `validator`: contributes quality gate candidates for extra checks.

## Registry Protocol

Remote discovery uses a registry index document:

```json
{
  "protocolVersion": "claw-design-plugin-registry/v1",
  "plugins": [
    {
      "manifestUrl": "file:///path/to/plugin/claw-design-plugin.json",
      "source": {
        "kind": "registry",
        "reference": "internal-registry"
      }
    }
  ]
}
```

The current standalone host reads `file://` registry indexes. The protocol is intentionally URL-based so HTTPS registries can expose the same index shape.

## CLI

```bash
claw-design plugin discover
claw-design plugin install ./plugins/starter-assets
claw-design plugin install registry:starter-assets
claw-design plugin list
claw-design plugin disable starter-assets
claw-design plugin enable starter-assets
claw-design plugin uninstall starter-assets
```

Set `CLAW_DESIGN_PLUGIN_HOME` to choose the plugin state directory. By default, state is stored in `~/.claw-design/plugins.json`.

## Safety Boundary

Plugins are loaded as declarations. The host injects declared capabilities as candidates:

- asset capabilities enter `pluginAssetCandidates`;
- transform capabilities enter `pluginExportCandidates`;
- validator capabilities enter `pluginValidationCandidates`.

Plugin paths must be relative and cannot contain `..`. A plugin can only affect the current task through its declared candidates. It cannot mutate core routing, theme constraints, quality conclusion rules, or delivery state.
