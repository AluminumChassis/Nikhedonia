const { dialog } = require('electron').remote
var fs = require('fs');
var codeArea = document.getElementById("code");
var syntax = document.getElementById("syntax")
var paths=[]
var currentFile=0;
var codeRaw=[]
var currentLines=1;
codeArea.onkeydown = function(e){
    codeRaw[currentFile]=codeArea.value;
    if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
      switch(e.keyCode){
        case 83:
          e.preventDefault();
          if(!paths[currentFile]) {
            paths[currentFile] = dialog.showSaveDialog({title:"Save File As"})
          }
          fs.writeFile(paths[currentFile], codeRaw[currentFile], function(err) {
            if(err) {
              alert(err);
              return;
            }
            console.log("File saved.");
          }); 
          break;
        case 79:
          e.preventDefault();
          fileNames = dialog.showOpenDialog({title:"file"})
          
          paths[currentFile] = fileNames[0]

          fs.readFile(paths[currentFile], function(err,ret) {
            if(err) {
              alert(err);
              return;
            }
            codeRaw[currentFile]=ret;
            codeArea.value=ret;
            linesUpdate();
          }); 
          break;
        case 9:
          e.preventDefault();
          currentFile++;
          break;
        default:
          break;
      }
    } else {
      switch (e.keyCode){
        case 9:
          e.preventDefault();
          var s = this.selectionStart;
          this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
          this.selectionEnd = s+1;
          break;
        default:
          break;
      }
    }
    highlight([["def","blue"],["print","red"],["(","green"],[")","green"]])
    linesUpdate();
}
codeArea.onscroll = function(){
  document.getElementById("lineCount").style.top=(-codeArea.scrollTop)+"px";
  document.getElementById("syntax").style.top=(-codeArea.scrollTop)+"px";
}
function linesUpdate() {
  setTimeout(function(){
    var lines = codeArea.value.split("\n").length;
    if(lines>currentLines){
      var toAdd=""
      for (var i = currentLines+1; i<lines+1; i++){
        toAdd+=i+"<br>";
      }
      document.getElementById("lineCount").innerHTML+=toAdd;
    } else if(lines<currentLines){
      document.getElementById("lineCount").innerHTML=document.getElementById("lineCount").innerHTML.split("<br>").slice(0,lines).join("<br>")+"<br>";
    }
    if (lines==1) {
      document.getElementById("lineCount").innerHTML="1<br>";
    }
    console.log(lines)
    currentLines = lines;
    },0)
}

function startUp(){

}
var s,ss;
function highlight(words){
  setTimeout(function(){
    
    lines = codeArea.value.split("\n")
    syntax.innerText=lines.join("\n")
    ss = codeArea.value;
    for (var i = 0; i < words.length; i++) {
      s = ss.split(words[i][0]);
      j = "<div class='color' style='color:"+words[i][1]+"'>"+"█".repeat(words[i][0].length)+"</div>"
      s=s.join(j)
      ss=s;
    }
    console.log(ss)
    syntax.innerHTML = ss.replaceAll("\n","<br>").replaceAll("\t","----");
  },10);
}
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};