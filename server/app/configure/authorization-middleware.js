//Access Control
module.exports = { 
    isUser: function(req, res, next){
        var sessionUser = req.session.passport.user; 
        if(!sessionUser) res.status(401).send("Error: Not logged in as user"); 
        else next();
    }
}