/*
 * Copyright 2014 Vignesh Periasami
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = Npm.require('fs');
var connect = Npm.require('connect');
var url = Npm.require('url');
var send = Npm.require('send');
var path = Npm.require('path');

var archPath = {};
var _pattern = null;
var _maxAge = 1000 * 60;

Meteor.ServeStatic = {
  config: function(options) {
    _pattern = options.patternRegex;
    _maxAge = options.maxAge || _maxAge;
    start();
  }
}

var staticFilesMiddleWare = function(staticFiles, req, res, next) {
  // to intercept request and to serve files.
  if ('GET' != req.method && 'HEAD' != req.method) {
    next();
    return;
  }
  var pathname = connect.utils.parseUrl(req).pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch (e) {
    console.log(e.toString());
    next();
    return;
  }

  var serveStaticJs = function (s) {
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=UTF-8'
    });
    res.write(s);
    res.end();
  }

  if (!_.has(staticFiles, pathname)) {
    console.log('doest have : ' + pathname);
    next();
    return;
  }

  var info = staticFiles[pathname];

  if (info.type === "js") {
    res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
  } else if (info.type === "css") {
    res.setHeader("Content-Type", "text/css; charset=UTF-8");
  }

  console.log("From serve-static : " + pathname);
  if (info.content) {
    res.write(info.content);
    res.end();
  } else {
    send(req, info.absolutePath).maxage(_maxAge).hidden(true)
      .on('error', function(err) {
        console.log('Error: Error serving static file ' + err);
        res.writeHead(500);
        res.end();
      })
      .on('directory', function() {
        res.writeHead(500);
        res.end();
      }).pipe(res);
  }

};

var readUtf8FileSync = function (filename) {
  return Meteor.wrapAsync(fs.readFile)(filename, 'utf8');
};

var getUrlPrefixForArch = function (arch) {
  return arch === WebApp.defaultArch ?
    '' : '/' + '__' + arch.replace(/^web\./, '');
};

var staticFiles;

var constructClientResource = function(clientPath, arch) {
  var clientJsonPath = path.join(__meteor_bootstrap__.serverDir, clientPath);
  var clientDir = path.dirname(clientJsonPath);

  var clientJson = JSON.parse(readUtf8FileSync(clientJsonPath));
  if (clientJson.format !== "web-program-pre1")
    throw new Error("Unsupported format for client assets: " + JSON.stringify(clientJson.format));
  var urlPrefix = getUrlPrefixForArch(arch);
  var manifest = clientJson.manifest;
  _.each(manifest, function(item) {
    if (_pattern.test(item.url) && item.where === "client") {
      staticFiles[urlPrefix + getItemPathName(item.url)] = {
        absolutePath: path.join(clientDir, item.path),
        cacheable: true,
        sourceMapUrl: item.sourceMapUrl,
        type: item.type
      };

      if (item.sourceMap) {
        staticFiles[urlPrefix + getItemPathName(item.url)] = {
          absolutePath: path.join(clientDir, item.sourceMap),
          cacheable: true
        };
      }

    }
  });
};

var getItemPathName = function (itemUrl) {
  return decodeURIComponent(url.parse(itemUrl).pathname);
};

var start = function() {
  try {
    staticFiles = {};
    archPath = {};
    var clientPaths = __meteor_bootstrap__.configJson.clientPaths;
    _.each(clientPaths, function(clientPath, arch) {
      archPath[arch] = path.dirname(clientPath);
      constructClientResource(clientPath, arch);
    });
  } catch (e) {
    console.log('something is wrong ' + e.toString());
  }
}

WebApp.rawConnectHandlers.use(function(req, res, next) {
  var pathname = getItemPathName(req.url);
  if (_pattern.test(pathname)) {
    staticFilesMiddleWare(staticFiles, req, res, next);
    return;
  }
  return next();
});
