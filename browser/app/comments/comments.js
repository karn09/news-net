//To-Do - User comments, individual comment
app.config(function ($stateProvider) {
    $stateProvider.state('pageComments', {
        url: '/comments/page/:id',
        templateUrl: 'app/comments/comments.html',
        resolve: {
          comments: function($stateParams, CommentsFactory) {
            return CommentsFactory.fetchAllForPage($stateParams.id);
          }
        },
        controller: 'CommentsCtrl'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('userComments', {
        url: '/comments/user/:id',
        templateUrl: 'app/comments/comments.html',
        resolve: {
          comments: function($stateParams, CommentsFactory) {
            return CommentsFactory.fetchAllForUser($stateParams.id);
          }
        },
        controller: 'CommentsCtrl'
    });
});

app.controller('CommentsCtrl', function($scope, $stateParams, comments, CommentsFactory){
    $scope.comments = comments;

    $scope.submitComment = function(){
        CommentsFactory.postCommentToArticle($stateParams.id, $scope.input);
    }
});