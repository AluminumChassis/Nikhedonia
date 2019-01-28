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

var defaultHighlighting = [["def","#3573A5"],["return","#f2f223"],["for","#a93b2c"],["&#58;","#3bca31"],[".","#12d5fe"],["elif","#57C478"],["if","#57C478"],["print(","#f352f0"],["(","#f352f0"],[")","#f352f0"],["import","#90ccf4"],["+","#c96567"],["-","#c96567"],["*","#c96567"],["&lt;","#c96567"],["&gt;","#c96567"],["&#61;","#c96567"]]
var paths=[]
var currentFile=0;
var codeRaw=[]
var saved=[]
var currentLines=1;
var numTabsLeft=0;
var previousCommands = []
var currentCommand = 0;
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

            saved[currentFile]=true;

            tabsUpdate();
            console.log("File saved.");
          });
          break;
        case 79:
          e.preventDefault();
          fileNames = dialog.showOpenDialog({title:"file"})
          if(!paths.includes(fileNames[0])){
            currentFile=paths.length
            numTabsLeft++;
          }
          paths[currentFile] = fileNames[0]

          fs.readFile(paths[currentFile], function(err,ret) {
            if(err) {
              alert(err);
              return;
            }
            codeRaw[currentFile]=ret;
            switchTab();
          }); 
          break;
        case 9:
          e.preventDefault();
          currentFile++;
          if(paths.length<=currentFile){
            currentFile=0;
          }
          switchTab();
          break;
        default:
          break;
      }
    } else {
      if((91>e.keyCode&&e.keyCode>64)||e.keyCode==9||e.keyCode==46||e.keyCode==46) {
        saved[currentFile]=false;
        tabsUpdate();
      }
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
  if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    
  } else {
    switch(e.keyCode) {
      case 13:
        if(running) {
          child.stdin.write(termIn.value + "\n");
          
          //child.stdin.end();
        } else {
          if(termIn.value.indexOf(" ")>0){
            prefix = termIn.value.substring(0,termIn.value.indexOf(" "))
            switch(prefix){
              case "py":
                running=termIn.value.substring(3)
                child = spawn(prefix,[running]).on('error', function( err ){ console.log(err) });
                
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
                break
              case "os":
                command = termIn.value.substring(3)
                if(command.indexOf(" ")>0){
                  prefix = command.substring(0,command.indexOf(" "))
                  args = command.substring(command.indexOf(" "))
                } else {
                  prefix = command;
                  args = ""
                }
                console.log([command,prefix,args])
                child = spawn(prefix,args.split(" ")).on('error', function( err ){ terminalMessage(command,"Error: Unable to use command "+command) });
                
                child.stdout.on('data', (chunk) => {
                  terminalMessage(command,chunk)
                });
                child.stderr.on('data', (data) => {
                
                });
                child.on('close', (code) => {
                
                });
                break
              case "size":

                command = termIn.value.substring(termIn.value.indexOf(" "))
                args = command.substring(command.indexOf(" ")).split(" ")
                stats = fs.statSync(args[1])
                bytes = stats.size
                terminalMessage("size in bytes of: "+args[1], bytes)
                break;
              default:

                break
            }
          } else {
            switch (termIn.value) {
              case "clear":
                termOut.innerHTML=""
                break;
              default:
                terminalMessage("Command unknown", termIn.value)
                break;
            }
          }
        }
        if(previousCommands[0]!=termIn.value){
          previousCommands.splice(0,0,termIn.value)
        }
        currentCommand=-1;
        termIn.value=""
        break;
      case 9:
        e.preventDefault();
        currentCommand=-1
        if(paths[currentFile]) {
          termIn.value=termIn.value.splice(termIn.selectionStart,0,paths[currentFile])
        }
        break;
      case 38:
        currentCommand++
        if(previousCommands.length>0){
          if(currentCommand>previousCommands.length-1) {currentCommand=previousCommands.length-1}
          termIn.value=previousCommands[currentCommand]
        }
        break;
      case 40:
        currentCommand--
        if(currentCommand<0) {currentCommand=0}
        termIn.value=previousCommands[currentCommand]
        break;
      default:
        break;
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
    ss = codeArea.value.replaceAll(" ","█").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("=","&#61;").replaceAll(":","&#58;");

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
  if(word=="&#61;"||word=="&lt;"||word=="&gt;"||word=="&#58;"){
      return "."
  } else {
      return word;
  }
}
function switchTab(){
  if(numTabsLeft>document.getElementById("tabsLeft").childElementCount){
    t = document.createElement("div"); 
    t.className="tab"
    t.id="tab"+(numTabsLeft-1)
    t.innerText=paths[paths.length-1].split("\\")[paths[paths.length-1].split("\\").length-1]
    t.onclick=function(){
      console.log("clicked")
      currentFile=parseInt(this.id.substring(3))
      switchTab()
    }
    saved.push(true)
    document.getElementById("tabsLeft").appendChild(t)
  }
  for(var i = 0; i<document.getElementById("tabsLeft").children.length;i++){
    document.getElementById("tabsLeft").children[i].style="background-color:#2a2a2a"
  }
  document.getElementById("tab"+currentFile).style="background-color:#111"
  codeArea.value=codeRaw[currentFile];
  linesUpdate();
  highlight();
}
function tabsUpdate(){
  for(var i = 0; i<document.getElementById("tabsLeft").children.length;i++){
    if(saved[i]){
      document.getElementById("tabsLeft").children[i].innerText=document.getElementById("tabsLeft").children[i].innerText.replace("*","")
    } else {
      if(!document.getElementById("tabsLeft").children[i].innerText.includes("*")){
        document.getElementById("tabsLeft").children[i].innerText+="*"
      }
    }
  }
}
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};
if (!String.prototype.splice) {
    String.prototype.splice = function(start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}