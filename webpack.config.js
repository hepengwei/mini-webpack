const path = require("path");
const addLoader = require("./loaders/addLoader");
const babelLoader = require("./loaders/babelLoader");
const cssLoader = require("./loaders/cssLoader");
const fileLoader = require("./loaders/fileLoader");
const HtmlWebpackPlugin = require("./plugins/html-webpack-plugin");

module.exports = {
  entry: path.join(__dirname, "./src/js/index.js"),
  output: {
    path: path.join(__dirname, "/build"),
    filename: "main.js",
  },
  module: {
    rules: [
      {
        test: /\.js/,
        use: [addLoader, babelLoader],
      },
      {
        test: /\.css/,
        use: [cssLoader],
      },
      {
        test: /\.(jpg|png|gif)/,
        use: [
          {
            loader: fileLoader,
            options: {
              outputPath: "./images",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./src/index.html"),
      filename: "index.html",
    }),
  ],
};
