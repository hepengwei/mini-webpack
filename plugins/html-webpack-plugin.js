const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");

class HtmlWebpackPlugin {
  constructor(options) {
    this.template = options.template;
    this.filename = options.filename || "index.html";
  }

  apply(compiler) {
    compiler.hooks.emit.tap("insertHtml", () => {
      const { filename } = compiler.options.output;
      const js_url = `./${filename}`;
      const code = fs.readFileSync(this.template).toString();
      const dom = new JSDOM(code);
      const body = dom.window.document.querySelector("body");
      body.innerHTML = body.innerHTML + `<script src="${js_url}"></script>`;
      compiler.assets[this.filename] = dom.serialize();
    });
  }
}

module.exports = HtmlWebpackPlugin;
