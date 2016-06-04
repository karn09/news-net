app.config(function ($stateProvider) {

    $stateProvider.state('parser', {
        url: '/parser',
        templateUrl: 'app/parser/parser.html',
        controller: 'ParserCtrl'
    });

});

app.controller('ParserCtrl', function ($scope, $state, ParserFactory) {

    $scope.parseUrl = function () {

        //console.log("inside parserCtrl parseUrl: ", $scope.url);
        ParserFactory.parseUrl($scope.url)
        .then(function(response){
            console.log(response);
            $scope.parsed = response;
        })

    };

});


