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

app.controller('ArticlesCtrl', function($scope, articles, ArticlesFactory){
    $scope.articles = articles.pages || articles;
    console.log($scope.articles)
    ArticlesFactory.fetchUserArticlesArray()
    .then(function(savedArticles){
        savedArticles.forEach(function(id){

            var index = $scope.articles.map(function(article){
                return article._id + "";
            }).indexOf(id + "");

            if(index >= 0){
                $scope.articles[index].liked = true;
            }
        })
    })
})

app.controller('ArticleCtrl', function($scope, article, $compile) {
    $scope.current = article;
    $scope.title = article.title;
    $scope.content = article.content;
});
