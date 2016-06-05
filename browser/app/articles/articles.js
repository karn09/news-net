app.config(function ($stateProvider) {
    $stateProvider.state('articles', {
        url: '/articles',
        templateUrl: 'app/articles/articles.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('article', {
        url: '/article',
        templateUrl: 'html/article-view/article-view.html',
        resolve: {
          current: function(ArticleViewFactory) {
            return ArticleViewFactory.getArticleById();
          }
        },
        controller: 'ArticleViewCtrl'
    });
});

app.controller('ArticleViewCtrl', function($scope, current, $compile) {
  $scope.current = current;
  $scope.title = current.title;
  $scope.content = current.content;
});
