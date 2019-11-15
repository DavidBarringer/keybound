var readline = require('readline');
var axios = require('axios');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
var robot = require('robotjs');

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
  }).catch((e) => console.log(e.code));
  if(commandBuffer[0]){
    var screenWidth = robot.getScreenSize().width;
    var screenHeight = robot.getScreenSize().height;
    switch(commandBuffer[0]){
      case('p'):
        pointer = 1;
        if(commandBuffer[pointer] > 0 && commandBuffer[pointer] <= localHand.length){
          var card = localHand[commandBuffer[pointer] - 1];
          var cardX = card.TopLeftX;
          var cardY = screenHeight - (card.TopLeftY);
          console.log(cardX, cardY)
          robot.mouseClick();
          robot.moveMouse(cardX, cardY);
          setTimeout(() => {
            robot.mouseToggle("down");
            robot.moveMouse(screenWidth/2, screenHeight/2);
            robot.mouseToggle("up");
          }, 200);
        }
        commandBuffer.shift();
        commandBuffer.shift();
        console.log("Command = play");
        break;
      case('a'):
      console.log("Command = attack");
      break;
      case('m'):
      console.log("Command = mulligan");
      default:
      console.log("Command not recognised");
      commandBuffer.shift();
    }
  }
}, 3000)
