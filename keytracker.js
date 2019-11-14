const readline = require('readline');
const axios = require('axios');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

var commandBuffer = [];

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

setInterval(() => {
  axios.get('http://localhost:21337/positional-rectangles').then((res) => {
    if(res.data.GameState != "InProgress"){
      return;
    }
    var width = res.data.Screen.ScreenWidth;
    var height = res.data.Screen.ScreenHeight;
    cards = res.data.Rectangles;
    var localHand = [];
    var localActive = [];
    var localBoard = [];
    var oppBoard = [];
    var oppActive = [];
    var oppHand = [];
    var spellBoard = [];
    for(card in cards){
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
      else if(card.TopLeftY > 9*height/10){
        oppHand.push(card);
      }
      else if(card.TopLeftY > 4*height/5){
        oppActive.push(card);
      }
      else{
        oppBoard.push(card);
      }
    }
  }).catch((e) => console.log(e.code));
  if(commandBuffer[0]){
    switch(commandBuffer[0]){
      case('p'):
      console.log("Command = play");
      break;
      case('a'):
      console.log("Command = attack");
      break;
      case('m'):
      console.log("Command = mulligan");
      default:
      console.log("Command not recognised");
    }
    commandBuffer.shift();
  }
}, 10000)
