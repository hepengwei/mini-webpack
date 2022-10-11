const parser = require("@babel/parser");
const { transformFromAstSync } = require("@babel/core");

module.exports = function (content) {
  const ast = parser.parse(content, { sourceType: "module" });
  const { code } = transformFromAstSync(ast, null, {
    presets: ["@babel/preset-env"],
  });
  return code;
};
