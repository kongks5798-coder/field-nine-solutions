/**
 * Plugin System for Dalkak IDE
 * Enables community-built extensions that can add panels, commands, and AI capabilities.
 */

export type PluginCapability = "panel" | "command" | "ai-model" | "theme" | "snippet" | "deploy-target";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  capabilities: PluginCapability[];
  entryPoint: string;
  permissions: string[];
  minAppVersion?: string;
}

export interface PluginInstance {
  manifest: PluginManifest;
  state: "installed" | "active" | "disabled" | "error";
  installedAt: string;
  config: Record<string, unknown>;
}

export interface PluginCommand {
  id: string;
  pluginId: string;
  label: string;
  shortcut?: string;
  execute: () => void | Promise<void>;
}

export interface PluginPanel {
  id: string;
  pluginId: string;
  title: string;
  icon: string;
  position: "left" | "right" | "bottom";
  render: () => string; // HTML string for iframe sandbox
}

// Plugin Registry — manages installed plugins
class PluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map();
  private commands: Map<string, PluginCommand> = new Map();
  private panels: Map<string, PluginPanel> = new Map();
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("f9_plugins_v1");
      if (stored) {
        const data = JSON.parse(stored) as PluginInstance[];
        data.forEach(p => this.plugins.set(p.manifest.id, p));
      }
    } catch { /* ignore */ }
  }

  private saveToStorage() {
    try {
      localStorage.setItem("f9_plugins_v1", JSON.stringify(Array.from(this.plugins.values())));
    } catch { /* ignore */ }
  }

  install(manifest: PluginManifest, config?: Record<string, unknown>): boolean {
    if (this.plugins.has(manifest.id)) return false;
    const instance: PluginInstance = {
      manifest,
      state: "installed",
      installedAt: new Date().toISOString(),
      config: config || {},
    };
    this.plugins.set(manifest.id, instance);
    this.saveToStorage();
    this.emit("plugin:installed", manifest.id);
    return true;
  }

  uninstall(pluginId: string): boolean {
    if (!this.plugins.has(pluginId)) return false;
    // Clean up commands and panels
    for (const [id, cmd] of this.commands) {
      if (cmd.pluginId === pluginId) this.commands.delete(id);
    }
    for (const [id, panel] of this.panels) {
      if (panel.pluginId === pluginId) this.panels.delete(id);
    }
    this.plugins.delete(pluginId);
    this.saveToStorage();
    this.emit("plugin:uninstalled", pluginId);
    return true;
  }

  activate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.state === "active") return false;
    plugin.state = "active";
    this.saveToStorage();
    this.emit("plugin:activated", pluginId);
    return true;
  }

  deactivate(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.state !== "active") return false;
    plugin.state = "disabled";
    this.saveToStorage();
    this.emit("plugin:deactivated", pluginId);
    return true;
  }

  registerCommand(cmd: PluginCommand): void {
    this.commands.set(cmd.id, cmd);
  }

  registerPanel(panel: PluginPanel): void {
    this.panels.set(panel.id, panel);
  }

  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): PluginInstance[] {
    return this.getAllPlugins().filter(p => p.state === "active");
  }

  getAllCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  getAllPanels(): PluginPanel[] {
    return Array.from(this.panels.values());
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }
}

// Singleton instance
let registryInstance: PluginRegistry | null = null;

export function getPluginRegistry(): PluginRegistry {
  if (!registryInstance) {
    registryInstance = new PluginRegistry();
  }
  return registryInstance;
}

// Built-in plugin manifests (examples)
export const BUILTIN_PLUGINS: PluginManifest[] = [
  {
    id: "dalkak-prettier",
    name: "Prettier \uCF54\uB4DC \uD3EC\uB9F7\uD130",
    version: "1.0.0",
    author: "Dalkak",
    description: "\uCF54\uB4DC\uB97C \uC790\uB3D9\uC73C\uB85C \uD3EC\uB9F7\uD305\uD569\uB2C8\uB2E4",
    icon: "\u2728",
    capabilities: ["command"],
    entryPoint: "builtin",
    permissions: ["files:read", "files:write"],
  },
  {
    id: "dalkak-emmet",
    name: "Emmet \uC57D\uC5B4 \uD655\uC7A5",
    version: "1.0.0",
    author: "Dalkak",
    description: "HTML/CSS Emmet \uC57D\uC5B4\uB97C \uC9C0\uC6D0\uD569\uB2C8\uB2E4",
    icon: "\u26A1",
    capabilities: ["command"],
    entryPoint: "builtin",
    permissions: ["editor:read", "editor:write"],
  },
  {
    id: "dalkak-tailwind",
    name: "Tailwind CSS \uB3C4\uC6B0\uBBF8",
    version: "1.0.0",
    author: "Dalkak",
    description: "Tailwind CSS \uD074\uB798\uC2A4 \uC790\uB3D9\uC644\uC131 \uBC0F \uD504\uB9AC\uBDF0",
    icon: "\uD83C\uDF0A",
    capabilities: ["command", "snippet"],
    entryPoint: "builtin",
    permissions: ["editor:read"],
  },
  {
    id: "dalkak-icons",
    name: "\uC544\uC774\uCF58 \uB77C\uC774\uBE0C\uB7EC\uB9AC",
    version: "1.0.0",
    author: "Dalkak",
    description: "\uC218\uCC9C \uAC1C\uC758 SVG \uC544\uC774\uCF58\uC744 \uAC80\uC0C9\uD558\uACE0 \uC0BD\uC785\uD569\uB2C8\uB2E4",
    icon: "\uD83C\uDFA8",
    capabilities: ["panel"],
    entryPoint: "builtin",
    permissions: ["files:write"],
  },
  {
    id: "dalkak-analytics",
    name: "\uC2E4\uC2DC\uAC04 \uBD84\uC11D",
    version: "1.0.0",
    author: "Dalkak",
    description: "\uBC30\uD3EC\uB41C \uC571\uC758 \uC2E4\uC2DC\uAC04 \uBC29\uBB38\uC790 \uBD84\uC11D",
    icon: "\uD83D\uDCCA",
    capabilities: ["panel"],
    entryPoint: "builtin",
    permissions: ["deploy:read"],
  },
];
