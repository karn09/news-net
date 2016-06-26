//Initialization & Config
var app = angular.module('Extension', ['ngMaterial'])
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