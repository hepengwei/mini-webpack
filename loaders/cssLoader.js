module.exports = function(content){
    return  `(function(){
        var tag = document.createElement("STYLE");
        tag.innerHTML = ${JSON.stringify(content)};
        var head = document.getElementsByTagName("Head")[0];
        head.appendChild(tag);
    })()`
}