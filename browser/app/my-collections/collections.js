app.config(function ($stateProvider) {
    $stateProvider.state('collections', {
        url: '/collections',
        templateUrl: 'app/my-collections/collections.html',
        resolve: {
            articles: function(ArticlesFactory){
                return ArticlesFactory.fetchUserArticlesPopulated();
            }
        },
        controller: 'ArticlesCtrl'
    });
});


//
// app.controller('ArticleCtrl', function($scope, article, $compile) {
//     $scope.current = article;
//     $scope.title = article.title;
//     $scope.content = article.content;
// });
