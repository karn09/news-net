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
        imgs = newElem.find('img');
        for (var i = 0; i < imgs.length; i++) {

          imgs[i].addClass = 'floatRight'
        }
        elem.append(newElem);
      });
    }
  };
}]);
