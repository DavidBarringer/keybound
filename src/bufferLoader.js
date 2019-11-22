var fs = require('fs');

setInterval(() => {
  const commandBuffer = document.getElementById('commandBuffer');
  var data = fs.readFileSync('assets/commandBuffer.txt');
  commandBuffer.innerHTML = "Command: " + data;
}, 100);