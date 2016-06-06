app.config(function ($stateProvider) {
    $stateProvider.state('articles', {
        url: '/articles',
        templateUrl: 'app/articles/articles.html',
        resolve: {
            articles: function(ArticlesFactory){
                return ArticlesFactory.fetchAll();
            }
        },
        controller: 'ArticlesCtrl'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('article', {
        url: '/article',
        templateUrl: 'app/article-view/article-view.html',
        resolve: {
          current: function(ArticleViewFactory) {
            return ArticleViewFactory.getArticleById();
          }
        },
        controller: 'ArticleViewCtrl'
    });
});

app.controller('ArticlesCtrl', function($scope, articles){
    $scope.articles = articles;
})

app.controller('ArticleViewCtrl', function($scope, current, $compile) {
    $scope.current = current;
    $scope.title = current.title;
    $scope.content = current.content;
});
