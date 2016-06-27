app.directive('bindCompiledHtml', ['$compile', function($compile) {
  return {
    template: '<div></div>',
    scope: {
      rawHtml: '=bindCompiledHtml'
    },
    link: function(scope, elem) {
      var imgs = [];
      scope.$watch('rawHtml', function(value) {
        if (!value) return;
        var newElem = $compile(value)(scope.$parent);
        elem.contents().remove();
        newElem.find('img').addClass('img-responsive');
        elem.append(newElem);
      });
    }
  };
}]);
