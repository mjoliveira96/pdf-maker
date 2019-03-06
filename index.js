var phantom = require("node-phantom-simple");
var phantomjs = require('phantomjs');
var _ = require('lodash');
var ejs = require('ejs');
var fs = require('fs');
var _session;

function pdfMaker(template, data, pdfPath, option) {

    var fileExtension = template.split('/').pop().split('.').pop();

    return new Promise(function (resolve, reject) {
        if (fileExtension === 'html') {
            option = pdfPath || {
                paperSize: {
                    format: 'A4',
                    orientation: 'portrait',
                    border: '1.8cm'
                }
            };

            pdfPath = data;

            fs.readFile(template, 'utf8', function (err, html) {
                if (err) {
                    reject(err);
                    return;
                }

                createSession(html, pdfPath, option, resolve, reject);
            });

        } else if (fileExtension === 'ejs') {
            if (!data) {
                console.log('Please provide data object');
            }

            if (!pdfPath) {
                console.log('Please provide file path of the pdf');
            }

            option = option || {
                paperSize: {
                    format: 'A4',
                    orientation: 'portrait',
                    border: '1.8cm'
                }
            };

            fs.readFile(template, 'utf8', function (err, file) {
                if (err) {
                    reject(err);
                    return;
                }

                try {
                    var html = ejs.render(file, data);
                } catch (e) {
                    reject(e);
                    return;
                }
                createSession(html, pdfPath, option, resolve, reject);
            });

        } else {
            reject('Unknown file extension')
        }
    });
}

function createSession(html, pdfPath, option, callback, error) {
    if (_session) {
        createPage(_session, html, pdfPath, option, callback, error);
    } else {
        phantom.create({
            path: phantomjs.path
        }, function (err, session) {
            if (err) {
                error(err);
                return;
            }

            _session = session;
            createPage(session, html, pdfPath, option, callback, error)
        });
    }
}

function createPage(session, html, pdfPath, option, callback, error) {
    session.createPage(function (err, page) {
        if (err) {
            error(err);
            return;
        }

        _.forEach(option, function (val, key) {
            page.set(key, val);
        });

        page.set('content', html, function (err) {
            if (err) {
                error(err);
                return;
            }
        });

        page.onLoadFinished = function (status) {
            page.render(pdfPath, function (err) {
                page.close();
                page = null;
                if (err) {
                    error(err);
                    return;
                }
                callback();
            });
        };
    });
}

module.exports = pdfMaker;

