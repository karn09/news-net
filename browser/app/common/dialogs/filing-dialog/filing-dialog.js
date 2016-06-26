app.controller('fileArticleFormCtrl', function ($mdDialog, CategoriesFactory, folders, subscriptions) {

	this.folders = folders;
	this.subscriptions = subscriptions;

	this.close = function () {
		$mdDialog.cancel();
	};

	this.submit = function (articleId, categoryData) {

		// console.log("Submitted Article Data: ", articleId, categoryData);
		
		if(categoryData.type === 'public'){
			CategoriesFactory.addToSubscription(categoryData._id, articleId)
			.then(function(){
				$mdDialog.hide();
			})
		}else{
			CategoriesFactory.addToFolder(categoryData._id, articleId).
			then(function(){
				$mdDialog.hide();
			})
		}

	}
})
