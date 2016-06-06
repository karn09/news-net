app.factory('ArticlesFactory', function($http) {
  var detailObj = {};

  detailObj.fetchAll = function(){
    return $http.get("/api/pages")
    .then(function(response){
      return response.data;
    })
  }

  //Can either provide name or id as parameter (i.e. obj = {name: "Technology"})
  detailObj.fetchAllByCategory = function(obj) {
    var urlString = "/api/pages/category?"
    for(var key in obj){
      var queryParameter = key + "=" + obj[key];
      urlString += queryParameter;
    }

    return $http.get(urlString)
    .then(function(response){
      return response.data;
    })
  };

  detailObj.fetchOneById = function(id) {
    return $http.get("/api/pages/" + id)
    .then(function(response){
      return response.data;
    })
  };

  detailObj.addArticle = function(url, category) {
    // add one article to category
  };

  //Remove article from user's list, not delete.
  detailObj.removeArticleByID = function(id) {
    $http.put('/users/removePage/' + id)
    .then(function(response){
      return response.data;
    })
  };

  detailObj.saveArticleByUrl = function(url, category) {
    // default to all, or optional category
  }

  return detailObj;
})
