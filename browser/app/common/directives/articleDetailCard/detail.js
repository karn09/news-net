app.directive('articleDetail', function() {
  return {
    restrict: 'E',
    scope: {
    	article: '='
    },
    templateUrl: 'app/common/directives/articleDetailCard/detail.html',
  }
})
