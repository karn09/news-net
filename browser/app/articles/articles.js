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
        url: '/articles/:id',
        templateUrl: 'app/article-view/article-view.html',
        resolve: {
          article: function($stateParams, ArticlesFactory) {
            return ArticlesFactory.fetchArticleById($stateParams.id);
          }
        },
        controller: 'ArticleCtrl'
    });
});

app.controller('ArticlesCtrl', function($scope, articles){
    $scope.articles = articles;
})

app.controller('ArticleCtrl', function($scope, article, $compile) {
    $scope.current = article;
    $scope.title = article.title;
    $scope.content = article.content;
});
