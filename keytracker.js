var readline = require('readline');
var axios = require('axios');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
var robot = require('robotjs');
robot.setMouseDelay(100);

var commandBuffer = [];
var pointer = 0;

var localHand = [];
var localActive = [];
var localBoard = [];
var oppBoard = [];
var oppActive = [];
var oppHand = [];
var spellBoard = [];

process.stdin.on('keypress', (str, key) => {
  if(key.name === "escape"){
    commandBuffer = [];
  }
  else if(key.name === "backspace"){
    commandBuffer.pop();
  }
  else if(key.ctrl && key.name==="c"){
    process.exit();
  }
  else{
    commandBuffer.push(key.name);
  }
  console.log(commandBuffer);
});

setInterval(async () => {
  axios.get('http://localhost:21337/positional-rectangles').then((res) => {
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
    for(x in cards){
      var card = cards[x];
      if(card.CardCode == "face"){
        continue;
      }
      if(card.Height > height/5){
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
    localHand.sort((a, b) => {
      return a.TopLeftX - b.TopLeftX;
    });
    localActive.sort((a, b) => {
      return a.TopLeftX - b.TopLeftX;
    });
  }).catch((e) => console.log(e.code));
  if(commandBuffer[0]){
    var screenWidth = robot.getScreenSize().width;
    var screenHeight = robot.getScreenSize().height;
    switch(commandBuffer[0]){
      case('p'):
        pointer = 1;
        if(commandBuffer[pointer] > 0 && commandBuffer[pointer] <= localHand.length){
          var card = localHand[commandBuffer[pointer] - 1];
          var cardX = card.TopLeftX + 40;
          var cardY = screenHeight - (card.TopLeftY);
          console.log(cardX, cardY)
          robot.mouseClick();
          robot.moveMouse(cardX, cardY);
          robot.mouseToggle("down");
          setTimeout(() => {
            robot.moveMouse(screenWidth/2, screenHeight/2);
            robot.mouseToggle("up");
          }, 200);
        }
        //TODO: sort else statement
        commandBuffer.shift();
        commandBuffer.shift();
        pointer = 0;
        break;
      case('a'):
        pointer = 1;
        if(commandBuffer[pointer] > 0 && commandBuffer[pointer] <= localActive.length){
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
          robot.mouseClick();
          robot.moveMouse(cardX, cardY);
          robot.mouseToggle("down");
          setTimeout(() => {
            robot.moveMouse(boardX, boardY);
            robot.mouseToggle("up");
          }, 200);
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        else if(commandBuffer[pointer] == 'a'){
          var startX = localActive[0].TopLeftX;
          var endX = localActive[localActive.length - 1].TopLeftX + localActive[localActive.length -1].Width;
          var startY = screenHeight - localActive[0].TopLeftY;
          var endY = screenHeight - localActive[localActive.length - 1].TopLeftY;
          robot.mouseClick();
          robot.moveMouse(startX, startY);
          robot.mouseToggle("down");
          setTimeout(() => {
            robot.moveMouseSmooth(endX, endY);
            robot.moveMouse(screenWidth/2, screenHeight - (screenHeight/3));
            robot.mouseToggle("up");
          },200);
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
      break;
      case('m'):
      console.log("Command = mulligan");
      case('s'):
        pointer = 1;
        if(commandBuffer[pointer] == 's'){
          robot.mouseClick();
          robot.moveMouse(5*screenWidth/6, screenHeight/2);
          robot.mouseClick();
          commandBuffer.shift();
          commandBuffer.shift();
          pointer = 0;
        }
        break;
      default:
      console.log("Command not recognised");
      commandBuffer.shift();
    }
  }
}, 1000)
