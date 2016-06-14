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

  CommentsFactory.postCommentToArticle = function(id, text){
  	return $http.post('/api/comments/page/' + id, {text: text})
  	.then(function(response){
  		return response.data;
  	})
  }

  CommentsFactory.removeComment = function(id){
    return $http.delete('/api/comments/' + id)
    .then(function(response){
      return response.data;
    })
  }

  return CommentsFactory;
  
})
