var express = require('express')
    , path = require('path')
    , fs = require('fs')
    , mongoose = require('mongoose')
    , http = require('http')
    , everyauth = require('everyauth');


var UserSchema = mongoose.Schema({
    name: String,
    facebook_id: String,
    facebook: {}
});


mongoose.connect('mongodb://127.0.0.1/mymongodb');
var UserModel = mongoose.model('UserModel', UserSchema);

everyauth.everymodule.findUserById(function(objId,callback) {
     UserModel.findById(objId, function(err, user){
        callback(null, user);
    });
});

var findOrCreateFBUser = function(session, accessToken, accessTokExtra, fbUserMetadata){
    var promise = this.Promise();
        UserModel.findOne({facebook_id: fbUserMetadata.id},function(err, user) {
            if (err) return promise.fulfill([err]);

            if(user) {
                promise.fulfill(user);
            } else {
                var User = new UserModel({
                    name: fbUserMetadata.name,
                    facebook_id: fbUserMetadata.id,
                    facebook: fbUserMetadata
                });

                User.save(function(err,user) {
                    if (err) return promise.fulfill([err]);
                    promise.fulfill(user);
                });
            }
        });
        return promise;
}

everyauth.facebook
    .appId('your appId')
    .appSecret('your appSecret')
    .scope('email,user_location,user_photos,publish_actions')
    .handleAuthCallbackError( function (req, res) {
        res.send('Error occured');
    })
    .findOrCreateUser(findOrCreateFBUser)
    .redirectPath('/');

/**
 * Start and setup express
 * @type {*}
 */
var app = express();
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('super secret'));
  app.use(express.session());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(everyauth.middleware(app)); // important to call this AFTER session!
  app.use(app.router);

});

app.configure('development', function(){
  app.use(express.errorHandler());
});


app.get('/', function(req, res){
    res.render('index');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

