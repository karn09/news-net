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

app.controller('CommentsCtrl', function($scope, comments){
    $scope.comments = comments;
});