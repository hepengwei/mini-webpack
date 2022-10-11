module.exports = function (content) {
  content = content.replace(/add\([^\)]+\)/g, () => {
    return "add(2,2)";
  });
  return content;
};
