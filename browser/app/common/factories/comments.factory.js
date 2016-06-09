app.factory('CommentsFactory', function($http) {
  var CommentsFactory = {};

  CommentsFactory.fetchAllForPage = function(id) {
    return $http.get('api/comments/page/' + id)
    .then(function(response){
      return response.data;
    })
  };

  CommentsFactory.fetchAllForUser = function(id) {
    return $http.get('api/comments/user/' + id)
    .then(function(response){
      return response.data;
    })
  };

  return CommentsFactory;
})
