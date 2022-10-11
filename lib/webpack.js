const options = require("../webpack.config");
const Compiler = require("./Compiler");

const compiler = new Compiler(options);

compiler.run();