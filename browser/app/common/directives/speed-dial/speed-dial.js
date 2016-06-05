app.directive('speedDial', function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'app/common/directives/speed-dial/speed-dial.html',
    link: function (scope, element, attribute) {
      scope.isOpen = false;
      scope.hello = "world"
    }
  }
})
