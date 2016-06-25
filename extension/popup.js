var host = 'http://localhost:1337'

document.addEventListener('DOMContentLoaded', function() {

  //Get /session
  getUser(function(response){
    console.log("user", response.user)
    if(response.user._id){
      savePage();
    }else{
      showLogin();
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
      showLogin()
    }
  }
}

function showLogin(){
  console.log("showLogin");
  var form = document.createElement("form");
  form.setAttribute('method', 'post');
  form.setAttribute('action', `${host}/login`);

  var emailField = document.createElement("input");
  emailField.setAttribute('name', 'email');
  emailField.setAttribute('placeholder', 'email');
  emailField.setAttribute('type', 'text');

  var passwordField = document.createElement('input');
  passwordField.setAttribute('name', 'password' );
  passwordField.setAttribute('placeholder', 'name');
  passwordField.setAttribute('type', 'text');

  var submit = document.createElement('input');
  submit.setAttribute('type', 'submit');
  submit.setAttribute('value', 'Submit');

  form.appendChild(emailField);
  form.appendChild(passwordField);
  form.appendChild(submit);

  
  document.getElementsByTagName('body')[0].appendChild(form);
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
    var parsedResponse = JSON.parse(addPage.responseText);

    console.log(parsedResponse);
    var popup = document.getElementById('content-area');
    popup.innerHTML = "Saved Article: " + parsedResponse.title;
  });
}