app.controller('dialogFormCtrl', function($mdDialog) {
  console.log(this)
  this.close = function() {
    $mdDialog.cancel();
  };
  this.submit = function() {
    $mdDialog.hide();
  }
})
