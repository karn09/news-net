// This function will eventually contain some logic
// for receiving background-color values from the
// current tab.
function getBgColors (tab) {
  // But for now, let's just make sure what we have so
  // far is working as expected.
  alert('The browser action was clicked! Yay!');
}

// When the browser action is clicked, call the
// getBgColors function.
//chrome.browserAction.onClicked.addListener(getBgColors);



chrome.browserAction.onClicked.addListener(function(tab) {
  var url = tab.url;
  console.log("url: ", url);
  var parser = new XMLHttpRequest();
  parser.open('GET', 'http://localhost:1337/api/parser/' + encodeURIComponent(url), false);
  parser.send();
  //alert(parser.responseText);
  var addPage = new XMLHttpRequest();
  addPage.open('POST', 'http://localhost:1337/api/pages/ext/', false);
  addPage.setRequestHeader('Content-Type', 'application/json');
  addPage.send(parser.responseText);
  alert(addPage.responseText);

});