//Initialization & Config
var app = angular.module('Extension', [])
          .constant('host', {
            'url': 'http://localhost:1337'
          });
          
//Factories
app.factory('AuthFactory', function ($http, host) {
  var AuthFactory = {};

  AuthFactory.getCurrentUser = function(){
    return $http.get(`${host.url}/session`)
    .then(function(response){
      return response.data.user;
    })
  }

  AuthFactory.login = function(email, password){
    var data = {email: email, password: password};
    return $http.post(`${host.url}/login`, data)
    .then(function(response){
      return response.data.user;
    })
  }

  return AuthFactory;
});

app.factory("ArticleFactory", function($http, host){
  var ArticleFactory = {};

  ArticleFactory.saveArticle = function(){
    return new Promise(function(resolve, reject){
      getCurrentTabUrl(function(url){
        return $http.get(`${host.url}/api/parser/` + encodeURIComponent(url))
        .then(function(parserResponse){
          console.log("parserResponse", parserResponse.data)
          return $http.post(`${host.url}/api/pages/`, parserResponse.data);
        })
        .then(function(postResponse){
          console.log("postResponse", postResponse.data)
          resolve(postResponse.data);
        })
      })
    })
  }

  return ArticleFactory;
})

//Controllers
app.controller("popupController", function($scope, AuthFactory, ArticleFactory){

    AuthFactory.getCurrentUser()
    .then(function(user){
      console.log("user", user);
       if(user._id){
          $scope.loggedIn = true;
          save();
       }else{
          $scope.loggedIn = false;
       }
    })

    $scope.login = function(data){
      console.log("Login: ", data)
      AuthFactory.login(data.email, data.password)
      .then(function(user){
        console.log("user", user);
        if(user._id) {
          $scope.loggedIn = true;
          save()
        };
      })
    }

    function save(){
      console.log("save");
      $scope.message = "Saving Article";
      ArticleFactory.saveArticle()
      .then(function(article){
        console.log("article", article)
        $scope.message = "Saved Article: " + article.title;
        $scope.$evalAsync();
      })
    }
})

//Vanilla JS Helper Functions
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

// document.addEventListener('DOMContentLoaded', function() {

//   //Get /session
//   getUser(function(response){
//     console.log("user", response.user)
//     if(response.user._id){
//       savePage();
//     }else{
//       showLogin();
//     }
//   })

// });

// function getUser(callback){
//   var getUserXHR = new XMLHttpRequest();
//   getUserXHR.addEventListener("load", listener)
//   getUserXHR.open('GET', `${host}/session`)
//   getUserXHR.send();

//   function listener (){
//     try{
//       callback(JSON.parse(this.responseText));
//     }catch(e){
//       showLogin()
//     }
//   }
// }

// function showLogin(){
//   console.log("showLogin");
//   var form = document.createElement("form");
//   form.setAttribute('method', 'post');
//   form.setAttribute('action', `${host}/login`);

//   var emailField = document.createElement("input");
//   emailField.setAttribute('name', 'email');
//   emailField.setAttribute('placeholder', 'email');
//   emailField.setAttribute('type', 'text');

//   var passwordField = document.createElement('input');
//   passwordField.setAttribute('name', 'password' );
//   passwordField.setAttribute('placeholder', 'name');
//   passwordField.setAttribute('type', 'text');

//   var submit = document.createElement('input');
//   submit.setAttribute('type', 'submit');
//   submit.setAttribute('value', 'Submit');

//   form.appendChild(emailField);
//   form.appendChild(passwordField);
//   form.appendChild(submit);

  
//   document.getElementsByTagName('body')[0].appendChild(form);
// }



// function savePage(){
//   getCurrentTabUrl(function(url){
//     console.log("url: ", url);
//     var parser = new XMLHttpRequest();
//     parser.open('GET', `${host}/api/parser/` + encodeURIComponent(url), false);
//     parser.send();
//     //alert(parser.responseText);
//     var addPage = new XMLHttpRequest();
//     addPage.open('POST', `${host}/api/pages/`, false);
//     addPage.setRequestHeader('Content-Type', 'application/json');
//     addPage.send(parser.responseText);
//     var parsedResponse = JSON.parse(addPage.responseText);

//     console.log(parsedResponse);
//     var popup = document.getElementById('content-area');
//     popup.innerHTML = "Saved Article: " + parsedResponse.title;
//   });
// }