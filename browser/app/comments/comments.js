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

app.controller('CommentsCtrl', function($scope, $rootScope, $stateParams, comments, CommentsFactory, AuthService){
    $scope.comments = comments;

    AuthService.getLoggedInUser()
    .then(function(user){
        $scope.user = user;
        console.log("user", $scope.user)
    })

    $scope.submitComment = function(){
        CommentsFactory.postCommentToArticle($stateParams.id, $scope.input)
        .then(function(comment){
            $scope.comments.comments.push(comment);
        })
    }

    $scope.removeComment = function(index, id){
        CommentsFactory.removeComment(id);
        $scope.comments.comments.splice(index, 1);
    }
});