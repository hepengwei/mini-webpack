const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const template = require("@babel/template").default;   
const generate = require("@babel/generator").default;

class Complilation {
  white_list = ["", ".js"];

  constructor(options, context) {
    this.options = options;
    this.entry = this.options.entry;
    this.dirname = path.dirname(this.options.entry);
    this.compiler = context;
    this.ast = null;
    this.modules = {};
    this.assets = {};
  }

  buildModule() {
    this.moduleResolve(this.entry);
    this.bundleResolve();
    return this.assets;
  }

  /**
   * 处理模块资源
   */
  moduleResolve(filename, relative_path) {
    const ext = path.extname(filename);
    const rule = this.options.module.rules.find((item) => {
      return item.test.test(ext);
    });
    let code = fs.readFileSync(filename);
   
    if (rule) {
      const fn_list = [...rule.use];
      code = this.loaderResolve(fn_list, code, relative_path);
    }
    this.analyseLib(code, filename, relative_path);
  }

  /**
   *  使用loader处理文件内容
   */
  loaderResolve(fn_list, code, relative_path) {
    const raw = code;
    code = code.toString();
    const loader = fn_list.pop();
    if (loader) {
      let result;
      if (typeof loader === "function") {
        result = loader.call(
          { filename: relative_path, context: this.compiler, raw },
          code
        );
      } else if (typeof loader === "object") {
        const { loader: loaderFn, options } = loader;
        result = loaderFn.call(
          {
            query: options,
            filename: relative_path,
            context: this.compiler,
            raw,
          },
          code
        );
      }
      code = this.loaderResolve(fn_list, result);
    }
    return code;
  }

  /**
   * 依赖分析
   */
  analyseLib(code, filename, relative_path) {
    const ext = path.extname(filename);
    // 只有js文件需要解析依赖
    if (this.white_list.includes(ext)) {
      const ast = parser.parse(code, {
        sourceType: "module",
      });

      this.cur_task = {
        ast,
        filename,
        js_path: relative_path,
      };
      const deps = [];

      traverse(ast, {
        CallExpression(path) {
          if (
            path.node.callee.type === "Identifier" &&
            path.node.callee.name === "require"
          ) {
            deps.push(path.node.arguments[0].value);
          }
        },
      });

      this.queue(deps);

      this.modules[relative_path || filename] = { code, deps };

      for (let i = 0; i < deps.length; i++) {
        const dep = deps[i];
        this.moduleResolve(this.extHandler(path.join(this.dirname, dep)), dep);
      }
    } else {
      //非js文件需要替换require语句
      const { js_path, filename, ast } = this.cur_task;

      traverse(ast, {
        CallExpression(path) {
          if (
            path.node.callee.type === "Identifier" &&
            path.node.callee.name === "require" &&
            path.node.arguments[0].value === relative_path
          ) {
            const dist_ast = template.ast`${code}`;
            path.replaceWith(dist_ast);
          }
        },
      });

      const result = generate(ast);
      if (result) {
        this.modules[js_path || filename].code = result.code;
      }
    }
  }

  /**
   * 将所有解析css、图片的任务放前面，解析js的任务放后面
   */
  queue(deps) {
    let index = 0;
    for (let i = 0; i < deps.length; i++) {
      const ext = path.extname(deps[i]);
      if (!this.white_list.includes(ext)) {
        const del = deps.splice(i, 1)[0];
        deps.splice(index, 0, del);
        index++;
      }
    }
  }

  /**
   * 根据依赖的没有后缀名的文件名称查找对应带真实后缀名的文件名
   */
  extHandler(pathname) {
    const white_list = [...this.white_list, ".json"];
    for (let i = 0; i < white_list.length; i++) {
      const filename = pathname + white_list[i];
      if (fs.existsSync(filename)) {
        return filename;
      }
    }
  }

  /**
   * 生成bundle文件中的代码
   */
   bundleResolve() {
    const code = `;(function(entry,modules){
      function require(pathname){
        var module = {exports: {}}
        ;(function(require,module,exports){
          const code = modules[pathname].code;
          try{
            eval(code);
          }catch(error){
            console.log(error);
          }
        })(require,module,module.exports);
        return module.exports;
      }
      require(entry);
    })(${JSON.stringify(this.entry)},${JSON.stringify(this.modules)})`;
    this.assets[this.compiler.outputFilename] = code;
  }
}

module.exports = Complilation;
