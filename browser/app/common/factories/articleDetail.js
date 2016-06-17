app.factory('ArticlesFactory', function($http, idbService) {
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

  detailObj.fetchCategories = function(){
    // return fetch('/api/categories')
    //   .then(function(response) {
    //     return response.json();
    //   })
    console.log(window.navigator.onLine);
    return $http.get("/api/categories/")
    .then(function(response){
      response.data.forEach(function(category) {
        if (category.pages && category.pages.length > 0) {
          category.pages.forEach(function(page) {
            // console.log(page)
              idbService.addPage(page)
          })
          // for (var i = 0; i < category.pages.length; i++) {
          // }
        }
      });

      console.log('connected: ', response.data)
      return response.data;
      // return idbService.add('categories', response.data)
      //   .then(function(data) {
      //     console.log('inner ', response.data)
      //     return response.data;
      //   })
      //   .catch(function(err) {
      //     console.log(err);
      //     console.log(response.data)
      //     return response.data
      //   })
    })
    .catch(function(err) {
      console.log("No connection: ", err);
    })
  }

  detailObj.fetchArticleById = function(id) {
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
    return $http.put('/users/removePage/' + id)
    .then(function(response){
      return response.data;
    })
  };

  detailObj.saveArticleByUrl = function(url, category) {
    // default to all, or optional category
  }

  return detailObj;
})
