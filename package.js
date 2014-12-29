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

Package.describe({
  name: 'vikkilogs:serve-static',
  summary: 'To add response headers to static files.',
  version: '1.0.0',
  git: 'https://github.com/vignesh-iopex/serve-static.git'
});

Npm.depends({connect: "2.9.0",
             send: "0.1.4"});

Package.onUse(function(api) {
  api.versionsFrom('1.0.2.1');
  api.use(['underscore@1.0.1', 'webapp@1.1.4'], 'server');
  api.addFiles('serve-static-server.js', 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('vikkilogs:serve-static');
  api.addFiles('serve-static-server-tests.js');
});
