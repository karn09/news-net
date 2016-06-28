app.directive('articleDetail', function() {
  return {
    restrict: 'E',
    scope: {
    	article: '=',
      removeItemFromFunction: '&?'
    },
    templateUrl: 'app/common/directives/articleDetailCard/detail.html',
    controller: 'ArticleDetailCtrl'
  }
})

app.controller('ArticleDetailCtrl', function($scope, ArticlesFactory) {

  $scope.addToCollection = function(article) {
    if (article.liked) {
      article.liked = false;
      ArticlesFactory.unfavoriteArticle(article._id)
        .then(function(data) {
          console.log(data)
        })
    } else {
      article.liked = true;
      ArticlesFactory.favoriteArticle(article._id)
      .then(function(data) {
        console.log(data)
      })
    }
  }
 
  if(!!$scope.removeItemFromFunction){
    var partialFunc = $scope.removeItemFromFunction()
    
    $scope.removeItemFromHere = function(pageId){
      partialFunc(pageId);
    }
  }

});
