'use strict';
var _            = require('underscore');
var gutil        = require('gulp-util');
var PluginError  = gutil.PluginError;
var through      = require('through2');
var path         = require('path');
var fs=require('fs');

var PLUGIN_NAME  = 'gulp-rev-used';

var defaults = {
    revSuffix: '-[0-9a-f]{8,10}-?',
    extMap: {
        '.scss': '.css',
        '.less': '.css',
        '.jsx': '.js'
    }
};

function _getManifestData(file, opts) {
    var data;
    var ext = path.extname(file.path);
    if (ext === '.json') {
        var json = {};
        try {
            var content = file.contents.toString('utf8');
            if (content) {
                json = JSON.parse(content);
            }
        } catch (x) {
            this.emit('error', new PluginError(PLUGIN_NAME,  x));
            return;
        }
        if (_.isObject(json)) {
            var isRev = 1;
            Object.keys(json).forEach(function (key) {
                if (!_.isString(json[key])) {
                    isRev = 0;
                    return;
                }
                let cleanReplacement =  path.basename(json[key]).replace(new RegExp( opts.revSuffix ), '' );
                if (!~[
                        path.basename(key),
                        _mapExtnames(path.basename(key), opts)
                    ].indexOf(cleanReplacement)
                ) {
                    isRev = 0;
                }
            });

            if (isRev) {
                data = json;
            }
        }

    }
    return data;
}

// Issue #30 extnames normalisation
function _mapExtnames(filename, opts) {
    var fileExt = path.extname(filename);
    Object.keys(opts.extMap).forEach(function (ext) {
        if (fileExt === ext) {
            filename = filename.replace(new RegExp( '\\' + ext + '$' ), opts.extMap[ext]);
        }
    });
    return filename;
}


function revUsed(opts) {
    var remove = opts&&opts.remove;
    var assetsRoot= opts&&opts.root;
    opts = _.defaults((opts || {}), defaults);

    var manifest  = {};
    var mutables = [];
    return through.obj(function (file, enc, cb) {
        if (!file.isNull()) {
            var mData = _getManifestData.call(this, file, opts);
            if (mData) {
                _.extend( manifest, mData );
            } else {
                mutables.push(file);
            }
        }
        cb();
    }, function (cb) {
        var changes = [];
        if (opts.collectedManifest) {
            this.push(
                new gutil.File({
                    path: opts.collectedManifest,
                    contents: new Buffer(JSON.stringify(manifest, null, "\t"))
                })
            );
        }

        

        var used=[]
        for (var key in manifest) {
            used.push({file:key,count:0,hashFile:manifest[key]});
        }
        mutables.forEach(function (file){
            if (!file.isNull()) {
                var src = file.contents.toString('utf8');
                used.forEach((r)=>{
                    if(src.indexOf(r.file)>=0){
                        r.count++;
                    }
                })
            }
        });
        console.log("============== no used assets ============")
        used.forEach((r)=>{
            if(r.count===0){
                if(remove)fs.unlink(assetsRoot+'/'+r.hashFile,(err)=>{console.log(err)});
                console.log(r.file);
            }
        })
        console.log("============== no used assets end ============")

        cb();
    });
}

module.exports = revUsed;
