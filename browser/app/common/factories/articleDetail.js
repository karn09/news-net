app.factory('articleDetailFactory', function($http) {
  var detailObj = {};

  detailObj.fetchAllByCategory = function(category) {
    // return all titles and summaries associated with current category
  };

  detailObj.fetchOneById = function(id) {

  };

  detailObj.addArticle = function(category) {
    // add one article to category
  };

  detailObj.removeArticleByID = function() {
    // remove on article by ID
  };

  detailObj.saveArticleByUrl = function(url, category) {
    // default to all, or optional category
  }

  return detailObj;
})
