(function() {
  var hostname = (process.env.VMC_APP_HOST || "deqkalvm272.qkal.sap.corp")
  var port = (process.env.VMC_APP_PORT || "5000")
  var host = hostname+":"+port
  var protocol = 'http:'
  var url = require('url')
  var path = require('path')
  var express = require('express')
  var passport = require('passport')
  var OpenIDStrategy = require('passport-openid').Strategy
//  var negotiate = require('express-negotiate')
  var jsdom = require("jsdom")
  document = jsdom.jsdom()
  var myWindow = document.createWindow()
  $ = require('jQuery')
  jQuery = $.create(myWindow)
  var xmldom = require("xmldom")
  DOMParser = xmldom.DOMParser
  XMLSerializer = xmldom.XMLSerializer
  document.location = {href : "http://latitude.cloudfoundry.com/"}
  require('./Math.uuid')
  require('./rdfquery/jquery.json.js')
  require('./rdfquery/jquery.uri.js')
  require('./rdfquery/jquery.xmlns.js')
  require('./rdfquery/jquery.curie.js')
  require('./rdfquery/jquery.datatype.js')
  require('./rdfquery/jquery.rdf.js')
  require('./rdfquery/jquery.rdf.json.js')
  require('./rdfquery/jquery.rdf.xml.js')
  require('./rdfquery/jquery.rdf.turtle.js')
  require('./rdfquery/jquery.rdfa.js')

  passport.use(new OpenIDStrategy({
      returnURL: protocol+'//'+host+'/auth/openid/return',
      realm: protocol+'//'+host
    },
    function(identifier, done) {
      console.log('passport identifier: '+JSON.stringify(identifier))
      return done(null, {identifier: identifier})
    }
  ))

  passport.serializeUser(function(user, done) {
    done(null, user.identifier);
  })
  
  passport.deserializeUser(function(identifier, done) {
    done(null, { identifier: identifier });
  })

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login.html')
  }

  var mongodb = require('mongodb')
  var mongo

  if (process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    mongo = env['mongodb-1.8'][0]['credentials'];
  } else {
    mongo = {
      "hostname":"127.0.0.1",
      "port":27017,
      "username":"",
      "password":"",
      "name":"",
      "db":"db"
    }
  }
  console.log("mongo is: "+JSON.stringify(mongo))
  if (mongo.username && mongo.password){
    mongo.url = "mongodb://" + mongo.username + ":" + mongo.password + "@" + mongo.hostname + ":" + mongo.port + "/" + mongo.db;
  }
  else{
    mongo.url = "mongodb://" + mongo.hostname + ":" + mongo.port + "/" + mongo.db;
  }

//  var server = new mongodb.Server(mongo.hostname, mongo.port, {})
//  var db = new mongodb.Db('repository', server, {strict: true})
//  db.open(function (error, client) {
//                  if (error) throw error;
//                })
  var db
  mongodb.connect(mongo.url, function(err, conn) {
                              if (err)
                                 console.warn(err)
                              else
                                 db = conn
                             })

  app = express.createServer()
  app.use(express.cookieParser());
  app.use(express.logger({ format: ':method :url :status :response-time' }))
  app.use(express.favicon(__dirname + '/store/favicon.ico'))
  app.use(express.query())
  app.use(express.bodyParser())  
  app.use(express.session({ secret: 'keyboard cat' }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(express.static(__dirname + '/store'))
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))
  app.use(function(err, req, res, next) {
    if (err instanceof negotiate.NotAcceptable) {
        res.send('Sorry, I dont know how to return any of the content types requested', 406);
    } else {
        next(err);
    }
})

  function translate(req, res,  entry, receiver) {
    var contentType = entry["content-type"].split(';')[0]
    if (contentType == "$collection") {
       if (req.accepts("text/html")) {
          var result = "<html><body><h1>Resources</h1><ul>"
          entry.content.forEach(function(e) {
                                 result+= '<li><a href="'+
                                          e._id +
                                          '">' + path.basename(e._id) + "</a></li>"
                                })
          result += "</ul></body></html>"
          receiver("text/html", result)
       } else if (req.accepts("application/json")) {
          receiver("application/json", entry.content)
       } else
          res.send('format not supported', 406)
    } else if (contentType == "$collections") {
       if (req.accepts("text/html")) {
          var result = "<html><body><h1>Collections</h1><ul>"
          entry.content.forEach(function(e) {
                                 result+= '<li><a href="'+
                                          protocol+'//'+host+e+ '/">' + e+ "</a></li>"
                    })
          result += "</ul></body></html>"
          receiver("text/html", result)
       } else if (req.accepts("application/json")) {
          receiver("application/json", entry.content)
       } else
          res.send('format not supported', 406)
    } else {
       if (req.accepts(contentType))
          receiver(contentType, entry.content) 
       else if (req.accepts("text/plain"))
          receiver("text/plain", entry.content)
       else if (req.accepts("text/html"))
          receiver("text/html", '<html><body><pre>'+entry.content+'</pre></body></html>')
       else if (req.accepts("text/turtle")) {
          if (contentType == "text/html") { // try to fetch rdfa
            var base = protocol+'//'+host+req.url
            document.location = {href : base}
            var node = jQuery(entry.content)
            var body = node.find('body')
            var kb = body.rdf().base(base)
            var dmp = kb.databank.dump({format: 'text/turtle',
                                        indent: true,
                                        serialize: true})
            receiver("text/turtle", dmp)
          } else {
             var kb = $.rdf().load(entry.content)
             var dmp = kb.databank.dump({format: 'text/turtle',
                                         indent: true,
                                         serialize: true})
             receiver("text/turtle", dmp)
          }
       } else if (req.accepts("application/rdf+json")) {
          var kb = $.rdf().load(entry.content)
          var dmp = kb.databank.dump({format: 'application/json',
                                      indent: true,
                                      serialize: true})
          console.log("size of result is "+dmp.length)
          receiver("application/rdf+json", dmp)
       } else if (req.accepts("application/rdf+xml")) {
          var kb = $.rdf().load(entry.content)
          var dmp = kb.databank.dump({format: 'application/rdf+xml', serialize: true})
          receiver("application/rdf+xml", dmp)
       } else
          res.send('format not supported', 406)
    }
  }


  app.post('/auth/openid', passport.authenticate('openid'),
           function(req, res) {
             res.redirect('/');
           })

  app.get('/auth/openid/return', 
    passport.authenticate('openid', { successRedirect: '/',
                                      failureRedirect: '/login.html' }))

  app.get('/', function(req, res) {
    console.log("Get root collection index")
    host = req.headers.host
    db.collections(function(err, collections) {
          var colls = []
          if (collections) collections.forEach(function(c) {
                                if (c.collectionName.charAt(0) == '/')
                                   colls.push(c.collectionName)
                              })
          result = translate(req, res,
                             { "content-type": "$collections",
                               content: colls },
                             function(contentType, data) {
                                   console.log("data is "+data)
                                   res.header('Content-Type', contentType)
                                   //res.header('Content-Length', data.length)
                                   res.header('Access-Control-Allow-Origin', '*')
                                   res.send(data)
                            })
    })
  })
 
  app.get('*', /*ensureAuthenticated,*/ function(req, res) {
      host = req.headers.host
      var parsed = url.parse(req.params[0])
      var p = parsed.pathname
      p = path.normalize(p)
      var collname = path.dirname(p)
      var basename = path.basename(p)
      console.log("basename: "+basename)
      console.log("collname: "+collname)
      if (p.charAt(p.length-1) == '/') {
         collname = p.slice(0,-1)
         basename = ""
      }
      var ifnonmatch = req.header("If-None-Match")

// fetch resource from db
      db.collection(collname, function (err, collection) {
          console.log("db.collection yields collection :"+collection)
          console.log("err is::"+err)
          if (err) { 
             console.warn(err.message)
             res.send(err.message, 500)
             return
          } 
          if (basename == '') {
             var entry = { "content-type": "$collection" }
             var resources = collection.find({}, {_id:true})
                                       .toArray(function(err, docs) {
                                          entry.content = docs
                                          translate(req, res, entry,
                                                 function(contentType, data) { 
                                                    console.log("found resource with empty basename: "+data)
                                                    res.header('Content-Type',
                                                               contentType)
                                                    //res.header('Content-Length', data.length)
                                                    res.send(data)
                                                 })
                                        })
          } else {
             var id = protocol+'//'+host+collname+'/'+basename
             console.log("id is: "+id)
             console.log("collection is: "+collection)
             var cursor = collection.find({ _id: id })
             console.log("cursor "+cursor)
             cursor.nextObject(function(err, entry) {
                           if (err)  {
                              console.warn(err.message)
                              res.send('Error', 500)
                           } else {
                              if (entry) {
                                 if (ifnonmatch == entry.etag) {
                                    res.send('not changed', 304)
                                 } else {
// find transcoding to accept mime-type
                                    translate(req, res, entry, function(contentType, data) {
                                       res.header('Content-Type', contentType)
                                       //res.header('Content-Length', data.length)
                                       res.header('Last-Modified', new Date(entry.mtime).toUTCString())
                                       res.header('ETag', '"'+entry.etag+'"')
                                       res.send(data)
                                    })
                                 }
                              } else {
                                 res.send('not found', 404)
                              }   
                           }
                          })
          }
      })
  })

  app.put('/', function(req, res) {
      res.send("Error: cannot put something on root",400)
  })

  app.put('*', /* ensureAuthenticated,*/ function(req, res) {
      console.log("PUT on "+req.params[0])
      host = req.headers.host
      var contentType = req.header('Content-Type')
      var ifmatch = req.header('If-Match')
      if (!contentType) contentType = 'application/octet'
      var parsed = url.parse(req.params[0])
      var p = parsed.pathname
      p = path.normalize(p)
      var collname = path.dirname(p)
      if (collname == "/") {
         res.send("Error: cannot put something on root",400)
         return
      }
      var basename = path.basename(p)
      var id = protocol+'//'+host+collname+'/'+basename
      console.log("id is "+id)
      if (req.is('application/rdf+xml')) {

      } else if (req.is('application/json')) {

      } else {
        var body = ''
        req.on('data', function (raw) {
                          body+=raw
                       })
        req.on('end', function () {
          var insert = function(collection) {
              console.log("insert collection")
              var entry = {"_id": id,
                           "etag": Math.uuid(17),
                           "mtime": new Date().toISOString(),
                           "content-type": contentType,
                           "content": body }
              collection.find({_id: id}, {etag: true})
                        .nextObject(function(err, doc) {
                          if (doc) { // update the resource 
                            console.log("found resource, try updating")
                            if (!ifmatch) {
                               res.send("", 409) //is this right?
                            } else {
                               if (ifmatch != doc.etag) { res.send("", 409)
                              } else {
                                collection.save(entry,
                                  function(err, rec) {
                                      if (err) {
                                         console.warn(err.message)
                                         res.send('Error', 500)
                                      } else {
                                         res.send('updated', 200)
                                      }
                                  })
                              }
                            }
                          } else { // create the resource
                             console.log("create new resource")
                             collection.save(entry, {safe:true},
                                 function(err, rec) {
                                     if (err) {
                                        console.warn(err.message)
                                        res.send('Error', 500)
                                     } else {
                                        res.send('created', 201)
                                     }
                                 })
                          }
                         })
          }
          db.collection(collname, function (err, collection) {
              if (err) {
                 if (err.message.indexOf("does not exist")>-1) {
                    console.log("collection "+ collname + " does not exist, create one.")
                    // we shall create it and continue
                    db.createCollection(collname, function(err, collection){
                       if (err) {
                          console.log(err.message)
                          res.send('Error', 500)
                       } else {
                          insert(collection)
                       }
                    })
                    return
                 } else { 
                    console.log(err.stack)
                    console.warn(err.message)
                    res.send('Error', 500)
                    return
                 }
              }
              insert(collection)
          })
        })
      }
  })

  app.delete('*', function(req, res) {
      var parsed = url.parse(req.params[0])
      var p = parsed.pathname
      p = path.normalize(p)
      var collname = path.dirname(p)
      var basename = path.basename(p)
      var id = protocol+'//'+host+collname+'/'+basename
      db.collection(collname, function (err, collection) {
          if (err) {
             console.warn(err.message)
             stat = 500
             return
          }
          collection.remove({'_id': id}, {safe: true},
                            function(err, entry) {
                              if (err) {
                                 console.warn(err.message)
                                 res.send('server error', 500)
                              } else
                                 res.send('deleted', 204)
                            })
      })
  })

  app.listen(port)
  console.log('Repository server started on port %s', port)
}).call(this)
