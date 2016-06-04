app.directive('speedDial', function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'html/speed-dial/speed-dial.html',
    link: function (scope, element, attribute) {
      scope.isOpen = false;
      scope.hello = "world"
    }
  }
})
