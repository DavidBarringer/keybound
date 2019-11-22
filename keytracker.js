var path = require('path');
var axios = require('axios');
var os = require('os');
var fs = require('fs');
var activeWin = require('active-win');
var ioHook = require('iohook');
var robot = require('robotjs');
var jsonfile = require('jsonfile');
var child = require('child_process');
robot.setMouseDelay(100);
const platform = process.env.npm_config_platform || os.platform();
var executable;
switch (platform) {
  case 'darwin':
    executable = 'Electron.app/Contents/MacOS/Electron'
    break;
  case 'freebsd':
  case 'linux':
    executable = 'electron'
    break;
  case 'win32':
    executable = 'electron.exe';
    break;
  default:
    throw new Error('Electron builds are not available on platform: ' + platform)
}
const electron = child.spawn('./node_modules/electron/dist/' + executable, ['src/window.js']);
const data = jsonfile.readFileSync('assets/data.json');
const bindings = jsonfile.readFileSync('assets/bindings.json');

electron.on('exit', (code, signal) => {
  process.exit();
});
var windows;

var commandBuffer = [];
var pointer = 0;
var inspectPos;
var pCard;
var targetCount;
var targetMap;
var targets;
var target;

var mulligan = [];
var localFace;
var localHand = [];
var localActive = [];
var localBoard = [];
var oppFace;
var oppBoard = [];
var oppActive = [];
var oppHand = [];
var spellBoard = [];

ioHook.on('keyup', (key) => {
  if(windows && (windows.title == "Legends of Runeterra" || windows.title == "Keybound")){
    var code = bindings[key.rawcode];
    if(code){
      var name = code.name;
      if(name == "escape"){
        robot.moveMouse(0,0);
        pointer = 0;
        inspectPos = -1;
        pCard = "";
        targetCount = 0;
        commandBuffer = [];
        targetMap = [];
        targets = [];
        target = "";
        robot.mouseClick("right");
        robot.mouseClick();
      }
      else if(name == "backspace"){
        if(commandBuffer == [0]){
          robot.moveMouse(0,0);
          pointer = 0;
          inspectPos = -1;
          pCard = "";
          targetCount = 0;
          commandBuffer = [];
          targetMap = [];
          targets = [];
          target = "";
          robot.mouseClick("right");
          robot.mouseClick();
        }
        commandBuffer.pop();
        if(pointer > 0){
          pointer--;
        }
      }
      else if(name == "c" && key.ctrlKey){
        process.exit();
      }
      else{
        commandBuffer.push(name);
      }
    }
  }
});

ioHook.start();

setInterval(async () => {
  windows = await activeWin();
  fs.writeFileSync('assets/commandBuffer.txt', commandBuffer);
  axios.get('http://localhost:21337/positional-rectangles').then((res) => {
    mulligan = [];
    localHand = [];
    localActive = [];
    localBoard = [];
    oppBoard = [];
    oppActive = [];
    oppHand = [];
    spellBoard = [];
    if(res.data.GameState != "InProgress"){
      return;
    }
    var width = res.data.Screen.ScreenWidth;
    var height = res.data.Screen.ScreenHeight;
    cards = res.data.Rectangles;
    cards.sort((a, b) => {
      return a.TopLeftX - b.TopLeftX;
    });
    for(x in cards){
      var card = cards[x];
      if(card.CardCode == "face" && card.LocalPlayer){
        localFace = card;
      }
      else if(card.CardCode == "face" && !card.LocalPlayer){
        oppFace = card;
      }
      else if(card.Height > height/5 && card.TopLeftY > screenHeight/2){
        mulligan.push(card);
      }
      else if(card.Height > height/5 && card.LocalPlayer){
        localHand.push(card);
      }
      else if(card.TopLeftY < height/3){
        localActive.push(card);
      }
      else if(card.TopLeftY < height/2){
        localBoard.push(card);
      }
      else if(card.Width === card.Height){
        spellBoard.push(card);
      }
      else if(card.TopLeftY > height){
        oppHand.push(card);
      }
      else if(card.TopLeftY > 4*height/5){
        oppActive.push(card);
      }
      else{
        oppBoard.push(card);
      }
    }
  }).catch((e) => {});
  if(commandBuffer[0]){
    var screenWidth = robot.getScreenSize().width;
    var screenHeight = robot.getScreenSize().height;
    switch(commandBuffer[0]){
      case('p'):
        if(pointer == 0){
          robot.mouseClick("right");
          pointer = 1;
          targetCount = 0;
          targetMap = [];
          targets = [];
        }
        if((commandBuffer[1] >= 0 && commandBuffer[1] <= localHand.length) || pCard){
          if(pointer == 1 && !pCard){
            if(commandBuffer[1] == '0'){
              pCard = localHand[9];
            }
            else{
              pCard = localHand[commandBuffer[1] - 1];
            }
            var cardX = pCard.TopLeftX;
            var cardY = screenHeight - (pCard.TopLeftY);
            robot.moveMouse(cardX, cardY);
            robot.moveMouse(cardX + 35, cardY);
            robot.mouseToggle("down");
            robot.moveMouse(screenWidth/2, screenHeight/2);
            robot.mouseToggle("up");
            pointer = 2;
          }
          else if(pointer == 1 && pCard){
            pCard = "";
            pointer--;
          }
          var code = pCard.CardCode;
          if(data[code]){
            if(data[code].choices){
              if(commandBuffer[2] > 0 && commandBuffer[2] <= mulligan.length){
                if(pointer == 2){
                  var card = mulligan[commandBuffer[2] - 1];
                  var cardX = card.TopLeftX + card.Width/2;
                  var cardY = screenHeight - (card.TopLeftY - card.Height/2);
                  robot.moveMouse(cardX, cardY);
                  robot.mouseClick();
                  pointer = 3;
                }
              }
              else if(commandBuffer[2]){
                commandBuffer.pop();
              }
            }
            targetMap = data[code].targets;
            for (i in targetMap){
              if(!target){
                target = {... targetMap[i]};
              }
              if(target.spell){
                spellBoard.shift();
                targets = spellBoard;
              }
              if(target.local && target.opponent){
                if(commandBuffer[pointer] == 'l'){
                  target.opponent = false;
                  pointer++;
                }
                else if(commandBuffer[pointer] == 'o'){
                  target.local = false;
                  pointer++;
                }
                else if(commandBuffer[pointer]){
                  commandBuffer.pop();
                }
              }
              if(!target.opponent && target.local){
                if(target.local.length == 1){
                  if(target.local[0] == "active"){
                    targets = localActive;
                  }
                  else if(target.local[0] == "hand"){
                    targets = localHand;
                  }
                  else if(target.local[0] == "board"){
                    targets = localBoard;
                  }
                }
                else if(commandBuffer[pointer] == 'a' && target.local.includes("active")){
                  targets = localActive;
                  pointer++;
                }
                else if(commandBuffer[pointer] == 'h' && target.local.includes("hand")){
                  targets = localHand;
                  pointer++;
                }
                else if(commandBuffer[pointer] == 'f' && target.local.includes("face")){
                  targets = localFace;
                }
                else if(commandBuffer[pointer] == 'b' && target.local.includes("board")){
                  targets = localBoard;
                  pointer++;
                }
                else if(commandBuffer[pointer] && !targets){
                  commandBuffer.pop();
                }
              }
              if(!target.local && target.opponent){
                if(target.opponent.length == 1){
                  if(target.opponent[0] == "active"){
                    targets = oppActive;
                  }
                  else if(target.opponent[0] == "board"){
                    targets = oppBoard;
                  }
                }
                else if(commandBuffer[pointer] == 'a' && target.opponent.includes("active")){
                  targets = oppActive;
                  pointer++;
                }
                else if(commandBuffer[pointer] == 'f' && target.opponent.includes("face")){
                  targets = oppFace;
                }
                else if(commandBuffer[pointer] == 'b' && target.opponent.includes("board")){
                  targets = oppBoard;
                  pointer++;
                }
                else if(commandBuffer[pointer] && !targets){
                  commandBuffer.pop();
                }
              }
              if(Array.isArray(targets)){
                if(commandBuffer[pointer] > 0 && commandBuffer[pointer] <= targets.length){
                  card = targets[commandBuffer[pointer] - 1];
                  cardX = card.TopLeftX + 20;
                  cardY = screenHeight - (card.TopLeftY - 40);
                  robot.moveMouse(cardX, cardY);
                  robot.mouseClick();
                  target = "";
                  targets = [];
                  targetCount++;
                  pointer++;
                }
                else if(commandBuffer[pointer]){
                  commandBuffer.pop();
                }
              }
              else{
                cardX = targets.TopLeftX + targets.Width/2;
                cardY = screenHeight - (targets.TopLeftY - 40);
                robot.moveMouse(cardX, cardY);
                robot.mouseClick();
                target = "";
                targets = [];
                targetCount++;
                pointer++;
              }
            }
          }
          if(targetCount == targetMap.length && pCard){
            for(var i = 0; i < pointer; i++){
              commandBuffer.shift();
            }
            pointer = 0;
            targetCount = 0;
            targets = [];
            targetMap = [];
            pCard = "";
          }
          robot.moveMouse(0,0);
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('a'):
        pointer = 1;
        if(localActive.length == 0){
          commandBuffer.pop();
          pointer = 0;
        }
        else if(commandBuffer[1] > 0 && commandBuffer[1] <= localActive.length){
          var card = localActive[commandBuffer[pointer] - 1];
          var cardX = card.TopLeftX + card.Width/2;
          var cardY = screenHeight - (card.TopLeftY - (card.Height/2));
          var boardX, boardY;
          var boardPos = commandBuffer[pointer];
          if(!localBoard.length){
            boardX = screenWidth/2;
            boardY = screenHeight - screenHeight/3;
          }
          else{
            boardX = localBoard[localBoard.length - 1].TopLeftX + localBoard[localBoard.length - 1].Width + 40;
            boardY = screenHeight - (localBoard[0].TopLeftY - (localBoard[0].Height/2));
          }
          robot.moveMouse(cardX, cardY);
          robot.mouseToggle("down");
          robot.moveMouse(boardX, boardY);
          robot.mouseToggle("up");
          robot.moveMouse(0,0);
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        else if(commandBuffer[1] == 'a'){
          var startX = localActive[0].TopLeftX;
          var endX = localActive[localActive.length - 1].TopLeftX + localActive[localActive.length -1].Width;
          var startY = screenHeight - localActive[0].TopLeftY;
          var endY = screenHeight - localActive[localActive.length - 1].TopLeftY;
          robot.moveMouse(startX, startY);
          robot.mouseToggle("down");
          robot.moveMouseSmooth(endX, endY);
          robot.moveMouse(screenWidth/2, screenHeight - (screenHeight/3));
          robot.mouseToggle("up");
          robot.moveMouse(0,0);
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('c'):
        pointer = 1;
        if(commandBuffer[1] > 0 && commandBuffer[1] <= oppActive.length){
          var oppCard = oppActive[commandBuffer[1] - 1];
          var oppX = oppCard.TopLeftX;
          var oppY = screenHeight - oppCard.TopLeftY;
          pointer = 2
          if(commandBuffer[2] > 0  && commandBuffer[2] <= localBoard.length){
            var card = localBoard[commandBuffer[2] - 1];
            var cardX = card.TopLeftX + (card.Width/2);
            var cardY = card.TopLeftY;
            robot.moveMouse(oppX, oppY);
            robot.mouseToggle("down");
            robot.moveMouse(cardX, cardY);
            robot.mouseToggle("up");
            robot.moveMouse(0,0);
            commandBuffer.shift();
            commandBuffer.shift();
            commandBuffer.shift();
            pointer = 0;
          }
          else if(commandBuffer[2]){
            commandBuffer.pop();
          }
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('m'):
        pointer = 1;
        if(commandBuffer[1] > 0 && commandBuffer[1] <= mulligan.length){
          var card = mulligan[commandBuffer[1] - 1];
          var posX = card.TopLeftX + (card.Width/2);
          var posY = screenHeight - (card.TopLeftY - card.Height - screenHeight/10);
          robot.moveMouse(posX, posY);
          robot.mouseClick();
          robot.moveMouse(0,0);
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('b'):
        pointer = 1;
        if(commandBuffer[1] > 0 && commandBuffer[1] <= localActive.length){
          var localCard = localActive[commandBuffer[1] - 1];
          var localX = localCard.TopLeftX + localCard.Width/2;
          var localY = screenHeight - (localCard.TopLeftY - localCard.Height/2);
          pointer = 2;
          if(commandBuffer[2] > 0 && commandBuffer[2] <= oppBoard.length){
            var oppCard = oppBoard[commandBuffer[2] - 1];
            var oppX = oppCard.TopLeftX + oppCard.Width/2;
            var oppY = oppCard.TopLeftY - oppCard.Height/2;
            robot.moveMouse(localX, localY);
            robot.mouseToggle("down");
            robot.moveMouse(oppX, oppY);
            robot.mouseToggle("up");
            robot.moveMouse(0,0);
            commandBuffer.shift();
            commandBuffer.shift();
            commandBuffer.shift();
            pointer = 0;
          }
          else if(commandBuffer[2]){
            commandBuffer.pop();
          }
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('i'):
        if(pointer == 0){
          pointer = 1;
        }
        if(commandBuffer[1] == 'l'){
          if(pointer == 1){
            pointer = 2;
          }
          var done = false;
          if(commandBuffer[2] == 'a'){
            if(commandBuffer[3] > 0 && commandBuffer[3] <= localActive.length){
              if(pointer == 2){
                pointer = 3;
                var card = localActive[commandBuffer[3] - 1];
                var cardX = card.TopLeftX + card.Width/2;
                var cardY = screenHeight - (card.TopLeftY - card.Height/2);
                robot.moveMouse(cardX, cardY);
                robot.mouseClick("right");
              }
              if(pointer == 3){
                pointer = 4;
              }
              inspectPos = 0;
              if(commandBuffer[pointer] == 'left'){
                robot.moveMouse(3*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos--;
                pointer++;
              }
              else if(commandBuffer[pointer] == 'right'){
                robot.moveMouse(7*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos++;
                pointer++;
              }
              else if(commandBuffer[pointer]){
                done = true;
                pointer--;
              }
              if(inspectPos < 0){
                done = true;
              }
            }
            else if(commandBuffer[3]){
              commandBuffer.pop();
            }
          }
          else if(commandBuffer[2] == 'h'){
            if(commandBuffer[3] > 0 && commandBuffer[3] <= localHand.length){
              if(pointer == 2){
                pointer = 3;
                var card = localHand[commandBuffer[3] - 1];
                var cardX = card.TopLeftX;
                var cardY = screenHeight - card.TopLeftY;
                robot.moveMouse(cardX, cardY);
                robot.moveMouse(cardX + 40, cardY);
                robot.mouseClick("right");
              }
              inspectPos = 0;
              if(pointer == 3){
                pointer = 4;
              }
              if(commandBuffer[pointer] == 'left'){
                robot.moveMouse(3*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                pointer++;
                inspectPos--;
              }
              else if(commandBuffer[pointer] == 'right'){
                robot.moveMouse(7*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                pointer++;
                inspectPos++;
              }
              else if(commandBuffer[pointer]){
                done = true;
                pointer--;
              }
              if(inspectPos < 0){
                done = true;
              }
            }
            else if(commandBuffer[3]){
              commandBuffer.pop();
            }
          }
          else if(commandBuffer[2] == 'b'){
            if(commandBuffer[3] > 0 && commandBuffer[3] <= localBoard.length){
              if(pointer == 2){
                pointer = 3;
                var card = localBoard[commandBuffer[3] - 1];
                var cardX = card.TopLeftX + card.Width/2;
                var cardY = screenHeight - (card.TopLeftY - card.Height/2);
                robot.moveMouse(cardX, cardY);
                robot.mouseClick("right");
              }
              if(pointer == 3){
                pointer = 4;
              }
              inspectPos = 0;
              if(commandBuffer[pointer] == 'left'){
                robot.moveMouse(3*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos--;
                pointer++;
              }
              else if(commandBuffer[pointer] == 'right'){
                robot.moveMouse(7*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos++;
                pointer++;
              }
              else if(commandBuffer[pointer]){
                done = true;
                pointer--;
              }
              if(inspectPos < 0){
                done = true;
              }
            }
            else if(commandBuffer[3]){
              commandBuffer.pop();
            }
          }
          else if(commandBuffer[2] == 'd'){
            robot.moveMouse(screenWidth/4, 9*screenHeight/10);
            robot.mouseClick();
            done = true;
          }
          else if(commandBuffer[2]){
            commandBuffer.pop();
          }
          if(done){
            pointer++;
            for(var i = 0; i < pointer; i++){
              commandBuffer.shift();
            }
            pointer = 0;
          }
        }
        else if(commandBuffer[1] == 'o'){
          if(pointer == 1){
            pointer = 2;
          }
          var done = false;
          if(commandBuffer[2] == 'a'){
            if(commandBuffer[3] > 0 && commandBuffer[3] <= oppActive.length){
              if(pointer == 2){
                pointer = 3;
                var card = oppActive[commandBuffer[3] - 1];
                var cardX = card.TopLeftX + card.Width/2;
                var cardY = screenHeight - (card.TopLeftY - card.Height/2);
                robot.moveMouse(cardX, cardY);
                robot.mouseClick("right");
              }
              if(pointer == 3){
                pointer = 4;
              }
              inspectPos = 0;
              if(commandBuffer[pointer] == 'left'){
                robot.moveMouse(3*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos--;
                pointer++;
              }
              else if(commandBuffer[pointer] == 'right'){
                robot.moveMouse(7*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos++;
                pointer++;
              }
              else if(commandBuffer[pointer]){
                done = true;
                pointer--;
              }
              if(inspectPos < 0){
                done = true;
              }
            }
            else if(commandBuffer[3]){
              commandBuffer.pop();
            }
          }
          else if(commandBuffer[2] == 'h'){
            if(commandBuffer[3] > 0 && commandBuffer[3] <= oppHand.length){
              if(pointer == 2){
                pointer = 3;
                var card = oppHand[commandBuffer[3] - 1];
                var cardX = card.TopLeftX + 20;
                var cardY = screenHeight - card.TopLeftY;
                robot.moveMouse(cardX, cardY);
                robot.mouseClick("right");
              }
              inspectPos = 0;
              if(pointer == 3){
                pointer = 4;
              }
              if(commandBuffer[pointer] == 'left'){
                robot.moveMouse(3*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                pointer++;
                inspectPos--;
              }
              else if(commandBuffer[pointer] == 'right'){
                robot.moveMouse(7*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                pointer++;
                inspectPos++;
              }
              else if(commandBuffer[pointer]){
                done = true;
                pointer--;
              }
              if(inspectPos < 0){
                done = true;
              }
            }
            else if(commandBuffer[3]){
              commandBuffer.pop();
            }
          }
          else if(commandBuffer[2] == 'b'){
            if(commandBuffer[3] > 0 && commandBuffer[3] <= oppBoard.length){
              if(pointer == 2){
                pointer = 3;
                var card = oppBoard[commandBuffer[3] - 1];
                var cardX = card.TopLeftX + card.Width/2;
                var cardY = screenHeight - (card.TopLeftY - card.Height/2);
                robot.moveMouse(cardX, cardY);
                robot.mouseClick("right");
              }
              if(pointer == 3){
                pointer = 4;
              }
              inspectPos = 0;
              if(commandBuffer[pointer] == 'left'){
                robot.moveMouse(3*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos--;
                pointer++;
              }
              else if(commandBuffer[pointer] == 'right'){
                robot.moveMouse(7*screenWidth/10, screenHeight/2);
                robot.mouseClick();
                inspectPos++;
                pointer++;
              }
              else if(commandBuffer[pointer]){
                done = true;
                pointer--;
              }
              if(inspectPos < 0){
                done = true;
              }
            }
            else if(commandBuffer[3]){
              commandBuffer.pop();
            }
          }
          else if(commandBuffer[2] == 'd'){
            robot.moveMouse(3*screenWidth/4, screenHeight/10);
            robot.mouseClick();
            done = true;
          }
          else if(commandBuffer[2]){
            commandBuffer.pop();
          }
          if(done){
            pointer++;
            for(var i = 0; i < pointer; i++){
              commandBuffer.shift();
            }
            pointer = 0;
          }
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('r'):
        pointer = 1;
        if(commandBuffer[1] == 's'){
          pointer = 2;
          if(commandBuffer[2] > 0 && commandBuffer[2] <= spellBoard.length){
            var card = spellBoard[commandBuffer[2] - 1];
            var cardX = card.TopLeftX + card.Width/2;
            var cardY = screenHeight - (card.TopLeftY - card.Height/2);
            robot.moveMouse(cardX, cardY);
            robot.mouseToggle("down");
            robot.moveMouse(screenWidth/2, 9*screenHeight/10);
            robot.mouseToggle("up");
            robot.moveMouse(0,0);
            commandBuffer.shift();
            commandBuffer.shift();
            commandBuffer.shift();
            pointer = 0;
          }
          else if(commandBuffer[2]){
            commandBuffer.pop();
          }
        }
        else if(commandBuffer[1] == 'b'){
          pointer = 2;
          if(commandBuffer[2] > 0 && commandBuffer[2] <= localBoard.length){
            var card = localBoard[commandBuffer[2] - 1];
            var cardX = card.TopLeftX + card.Width/2;
            var cardY = screenHeight - (card.TopLeftY - card.Height/2);
            robot.moveMouse(cardX, cardY);
            robot.mouseToggle("down");
            robot.moveMouse(screenWidth/2, 4*screenHeight/5);
            robot.mouseToggle("up");
            robot.moveMouse(0,0);
            commandBuffer.shift();
            commandBuffer.shift();
            commandBuffer.shift();
            pointer = 0;
          }
          else if(commandBuffer[2]){
            commandBuffer.pop();
          }
        }
        else if (commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('s'):
        pointer = 1;
        if(commandBuffer[1] == 's'){
          robot.moveMouse(5*screenWidth/6, screenHeight/2);
          robot.mouseClick();
          robot.moveMouse(0,0);
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      case('q'):
        pointer = 1;
        if(commandBuffer[1] == 'q'){
          robot.moveMouse(19*screenWidth/20, screenHeight/20);
          robot.mouseClick();
          robot.moveMouse(9*screenWidth/20, 9*screenHeight/10);
          robot.mouseClick();
          robot.moveMouse(9*screenWidth/20, 11*screenHeight/20);
          robot.mouseClick();
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        else if(commandBuffer[1]){
          commandBuffer.pop();
        }
        break;
      default:
        commandBuffer.shift();
    }
  }
}, 1000)
