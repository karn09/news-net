var host = 'http://localhost:1337'

document.addEventListener('DOMContentLoaded', function() {


  //Get /session
  getUser(function(response){
    console.log("user", response.user)
    if(response.user._id){
      savePage();
    }else{
      console.log("Please sign in.")
    }
  })

  //If not logged in, present login page

  //Submit form data to /api/login route

  //If / When logged in  

  // savePage();

});

function getUser(callback){
  var getUserXHR = new XMLHttpRequest();
  getUserXHR.addEventListener("load", listener)
  getUserXHR.open('GET', `${host}/session`)
  getUserXHR.send();

  function listener (){
    try{
      callback(JSON.parse(this.responseText));
    }catch(e){
      console.log("Please sign in.")
    }
  }
}

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

function savePage(){
  getCurrentTabUrl(function(url){
    console.log("url: ", url);
    var parser = new XMLHttpRequest();
    parser.open('GET', `${host}/api/parser/` + encodeURIComponent(url), false);
    parser.send();
    //alert(parser.responseText);
    var addPage = new XMLHttpRequest();
    addPage.open('POST', `${host}/api/pages/`, false);
    addPage.setRequestHeader('Content-Type', 'application/json');
    addPage.send(parser.responseText);
    alert(addPage.responseText);
  });
}