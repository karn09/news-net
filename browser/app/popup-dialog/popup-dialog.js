app.controller('dialogFormCtrl', function($mdDialog) {
  this.close = function() {
    $mdDialog.cancel();
  };
  this.submit = function(type, data) {
    // if type category, send to category api
    // if type url, send to url api
    $mdDialog.hide();
  }
})
