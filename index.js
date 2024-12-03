const config = require("../config/config");
const path = require("path");
const { ipcRenderer } = require("electron");

class Plugin {
  static instance = null;

  #ctx;
  #config;

  constructor(ctx) {
    if (Plugin.instance) return Plugin.instance;

    this.#ctx = ctx;
    this.name = "rts-info";
    this.#config = null;
    this.config = {};
    this.logger = null;

    Plugin.instance = this;
  }

  static getInstance() {
    if (!Plugin.instance) throw new Error("Plugin not initialized");

    return Plugin.instance;
  }

  onLoad() {
    const { Logger, info } = this.#ctx;

    const { CustomLogger } =
      require("../logger/logger").createCustomLogger(Logger);
    this.logger = new CustomLogger("rts-info");

    const defaultDir = path.join(
      info.pluginDir,
      "./rts-info/resource/default.yml"
    );
    const configDir = path.join(info.pluginDir, "./rts-info/config.yml");

    this.#config = new config(this.name, this.logger, defaultDir, configDir);

    this.config = this.#config.getConfig(this.name);

    ipcRenderer.send("open-plugin-window", {
      pluginId: "rts-info",
      htmlPath: `${info.pluginDir}/rts-info/web/index.html`,
      options: {
        width: 800,
        height: 600,
        title: "RTS Info 視窗",
      },
    });
  }
}

module.exports = Plugin;
