app.factory('CommentsFactory', function($http) {
  var CommentsFactory = {};

  CommentsFactory.fetchAllForPage = function(id) {
    $http.get('/comments/page/' + id)
    .then(function(response){
      return response.data;
    })
  };

  return CommentsFactory;
})
