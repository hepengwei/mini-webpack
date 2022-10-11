const { add } = require("./util");
// require("../css/global.css");
import("../css/global.css");
const img_url = require("../img/1.png");

console.log(add(1, 1));

(() => {
  const img = new Image();
  img.src = img_url;
  window.document.getElementById("root").appendChild(img);
})();
