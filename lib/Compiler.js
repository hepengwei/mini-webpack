const path = require("path");
const fs = require("fs");
const { SyncHook } = require("tapable");
const Complilation = require("./Complilation");

class Compiler {
  constructor(options) {
    this.options = options;
    this.hooks = {
      initialize: new SyncHook(["arg"]),
      compile: new SyncHook(["arg"]),
      emit: new SyncHook(["arg"]),
      done: new SyncHook(["arg"]),
    };
    this.outputDir = path.join(process.cwd(), "/dist");
    this.outputFilename = "bundle.js";
    if (this.options.output) {
      const outputOptions = this.options.output;
      if (outputOptions.path) {
        this.outputDir = outputOptions.path;
      } else {
        outputOptions.path = this.outputDir;
      }
      if (outputOptions.filename) {
        this.outputFilename = outputOptions.filename;
      } else {
        outputOptions.filename = this.outputFilename;
      }
    } else {
      this.options.output = {
        path: this.outputDir,
        filename: this.outputFilename,
      };
    }
    this.bindHook();
  }

  bindHook() {
    const { plugins } = this.options;
    plugins.forEach((plugin) => {
      plugin.apply.call(plugin, this);
    });
    this.hooks.initialize.call(this.options);
  }

  async run() {
    this.hooks.compile.call(this.options);
    this.complilation = new Complilation(this.options, this);
    this.assets = await this.complilation.buildModule();
    this.hooks.emit.call(this.assets);
    this.emit();
    this.hooks.done.call();
  }

  emit() {
    // 创建输出文件夹
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }

    const keys = Object.keys(this.assets);

    keys.forEach((filename) => {
      const absolute_path = path.join(this.outputDir, filename);
      const dirs = filename.split(path.sep).filter((value) => {
        return value !== "";
      });
      dirs.forEach((dir, index) => {
        // 处理目录
        if (!dir.includes(".")) {
          const dist_file = path.resolve(
            this.outputDir,
            dirs.slice(0, index + 1).join(path.sep)
          );
          if (!fs.existsSync(dist_file)) {
            fs.mkdirSync(dist_file, (err) => {
              err && console.log(err);
            });
          }
        } else {
          // 处理文件
          fs.writeFileSync(absolute_path, this.assets[filename]);
        }
      });
    });
  }
}

module.exports = Compiler;
