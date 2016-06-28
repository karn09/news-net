app.factory('CommentsFactory', function($http) {
  var CommentsFactory = {};
  var pageCache = {};
  CommentsFactory.fetchAllForPage = function(id) {
    return $http.get('api/comments/page/' + id)
    .then(function(response){
      if (!pageCache[id]) {
        pageCache[id] = [];
      }
      angular.copy(response.data, pageCache[id])
      return pageCache[id];
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
  	 // pageCache[id].comments.push({
  	 //   text: text,
  	 //   dateStamp: 'Pending',
  	 //   user: {
  	 //     email: 'Pending'
  	 //   }
  	 // })
  		return response.data;
  	})
  }

  CommentsFactory.removeComment = function(id){
    return $http.delete('/api/comments/' + id)
    .then(function(response){
      return response.data;
    })
  }

  CommentsFactory.editComment = function(id, text){
    return $http.put('/api/comments/' + id, {text: text})
    .then(function(response){
      return response.data;
    })
  }

  CommentsFactory.vote = function(id, direction){
    return $http.put('/api/comments/' + id + `/${direction}vote`)
    .then(function(response){
      return response.data;
    })
  }

  return CommentsFactory;
  
})
