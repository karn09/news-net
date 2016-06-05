app.config(function ($stateProvider) {

    $stateProvider.state('parser', {
        url: '/parser',
        templateUrl: 'app/parser/parser.html',
        controller: 'ParserCtrl'
    });

});

app.controller('ParserCtrl', function ($scope, $state, ParserFactory, Session) {

    $scope.parseUrl = function () {

        //console.log("inside parserCtrl parseUrl: session user: ", Session.user._id);

        ParserFactory.parseUrl($scope.url, Session.user._id)
        .then(function(response){
            console.log(response);
            $scope.parsed = response;
        })

    };

});


