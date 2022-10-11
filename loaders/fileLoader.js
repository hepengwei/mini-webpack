const path = require("path");
const sha256 = require("sha256");

module.exports = function () {
  const ext = path.extname(this.filename);
  const hash = sha256(this.raw);
  const outputPath = this.query.outputPath || "./";
  const img_relative = path.join(outputPath, `${hash}${ext}`);
  this.context.hooks.emit.tap("imgResolve", () => {
    this.context.assets[img_relative] = this.raw;
  });
  return JSON.stringify(img_relative.replace(/\\/g, "/"));
};
