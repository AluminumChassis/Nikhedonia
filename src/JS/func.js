const { dialog } = require('electron').remote
const electron = require('electron').remote

const fs = require('fs');
const path = require('path')
/*
const shelljs = require('shelljs')
shelljs.config.execPath = path.join('C:', 'Program Files', 'nodejs', 'node.exe')
*/
const { spawn } = require('child_process');
let w = electron.getCurrentWindow()

var codeArea = document.getElementById("code");
var syntax = document.getElementById("syntax");
var termIn = document.getElementById("terminal-in");
var termOut = document.getElementById("terminal-out");

var defaultHighlighting = [["def","#3573A5"],["elif","#57C478"],["if","#57C478"],["print(","#f3d250"],["(","#f3d250"],[")","#f3d250"],["import","#90ccf4"],["+","#c96567"],["-","#c96567"],["*","#c96567"],["&lt;","#c96567"],["&gt;","#c96567"],["&#61;","#c96567"]]
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
            highlight();
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
    highlight()
    linesUpdate();
}
codeArea.onscroll = function(){
  scroll()
}
var running = "";
var pyshell;
var child; 
termIn.onkeydown=function(e){
  switch(e.keyCode) {
    case 13:
      if(running) {
        child.stdin.write(termIn.value + "\n");
        
        //child.stdin.end();
      } else {
        running=termIn.value.substring(termIn.value.indexOf(" ")+1)
        child = spawn(termIn.value.substring(0,termIn.value.indexOf(" ")),[running]).on('error', function( err ){ console.log(err) });
        
        child.stdout.on('data', (chunk) => {
          terminalMessage("Python out",chunk)
        });
        child.stderr.on('data', (data) => {
          terminalMessage("Python error:",data)
        });
        child.on('close', (code) => {
          terminalMessage("Python exited with code: ", code)
          running=""
        });
      
      }
      break;
    case 9:
      e.preventDefault();
      if(paths[currentFile]) {
        termIn.value+=paths[currentFile]
      }
  }
}
function terminalMessage(header, message) {
  if (!message) {message="[No result]"}
  termOut.innerHTML+="<div class='command'>&#62;"+header+"<br>"+message +"</div>";
  termOut.scrollTop = termOut.scrollHeight;
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
function highlight(){
  words = defaultHighlighting;
  setTimeout(function(){
    ss = codeArea.value.replaceAll(" ","█").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("=","&#61;");

    for (var i = 0; i < words.length; i++) {
      s = ss.split(words[i][0]);
      j = "<div class='color' style='color:"+words[i][1]+"'>"+"█".repeat(match(words[i][0]).length)+"</div>"
      s=s.join(j)
      ss=s;
    }
    syntax.innerHTML = ss.replaceAll("\n","<br>").replaceAll("\t","----");
  },0);
}
function match(word) {
  if(word=="&#61;"||word=="&lt;"||word=="&gt;"){
      return "."
  } else {
      return word;
  }
}
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};