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

//Need to fix Angular bug here
app.controller('editCommentCtrl', function($mdDialog, $state, $scope, CommentsFactory){
    this.close = function () {
        $mdDialog.cancel();
    };

    this.submit = function (index, data) {
        var comment  = $scope.comments.comments[index];
        CommentsFactory.editComment(comment._id, data)
        .then(function(response){
            $mdDialog.hide();
            $scope.comments.comments[index].text = response.text;
        })


    }
})

app.controller('CommentsCtrl', function($scope, $rootScope, $stateParams, $mdDialog, comments, CommentsFactory, AuthService){
    $scope.comments = comments;
    console.log("scope comments", $scope.comments)

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

    $scope.editComment = function(){
        $mdDialog.show({
            scope: this,
            preserveScope: true,
            clickOutsideToClose: true,
            controller: 'editCommentCtrl',
            controllerAs: 'edit',
            templateUrl: '/app/comments/edit-comment.html',
        })
    }

    $scope.vote = function(id, direction){
        CommentsFactory.vote(id, direction)
        .then(function(response){
            var index = $scope.comments.comments.map(function(element){ return element._id }).indexOf(response._id);
            $scope.comments.comments[index].voteCount = response.voteCount;
        })
    }

    
});





