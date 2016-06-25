function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}


document.addEventListener('DOMContentLoaded', function() {

  getCurrentTabUrl(function(url){
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

});