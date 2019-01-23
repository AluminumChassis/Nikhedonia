const { dialog } = require('electron').remote
var fs = require('fs');
var codeArea = document.getElementById("code");
var syntax = document.getElementById("syntax");
var termIn = document.getElementById("terminal-in");
var termOut = document.getElementById("terminal-out");
const electron = require('electron').remote
const path = require('path')
const shelljs = require('shelljs')
shelljs.config.execPath = path.join('C:', 'Program Files', 'nodejs', 'node.exe')
let w = electron.getCurrentWindow()
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
    highlight([["def","#24c"],["print(","#c42"],["(","#c42"],[")","#c42"]])
    linesUpdate();
}
codeArea.onscroll = function(){
  scroll()
}
termIn.onkeydown=function(e){
  if(e.keyCode==13) {
    termOut.innerHTML+="<div class='command'>&#62;"+termIn.value+"<br>"+shelljs.exec(termIn.value, {silent:true}).stdout +"</div>";
    termOut.scrollTop = termOut.scrollHeight;
  }
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

var resize = document.getElementById("resize");
function resizeWindow() {
  current = resize.innerText;
  resize.innerText=='□'?w.maximize():w.unmaximize();
  resize.innerText=resize.innerText=='□'?'◱':'□';
  scroll()
}
w.on('enter-full-screen', () => {
  resize.innerText='◱'
  scroll()
});
w.on('maximize', () => {
  resize.innerText='◱'
  scroll()
});
w.on('leave-full-screen', () => {
  resize.innerText='□'
  scroll()
});
w.on('unmaximize', () => {
  resize.innerText='□'
  scroll()
});
function startUp(){
  scroll()
  w.maximize();
}
function scroll(){
  document.getElementById("lineCount").style.top=(2*document.getElementById("tabs").clientHeight-codeArea.scrollTop)+"px";
  document.getElementById("syntax").style.top=(2*document.getElementById("tabs").clientHeight-codeArea.scrollTop)+"px";
  document.getElementById("syntax").style.left=(-codeArea.scrollLeft)+"px";
}
var s,ss;
function highlight(words){
  setTimeout(function(){
    ss = codeArea.value.replaceAll(" ","-").replaceAll("<","&#60;");
    for (var i = 0; i < words.length; i++) {
      s = ss.split(words[i][0]);
      j = "<div class='color' style='color:"+words[i][1]+"'>"+"█".repeat(words[i][0].length)+"</div>"
      s=s.join(j)
      ss=s;
    }
    console.log(ss)
    syntax.innerHTML = ss.replaceAll("\n","<br>").replaceAll("\t","----");
  },0);
}
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};