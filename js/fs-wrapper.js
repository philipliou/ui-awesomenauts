window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
  window.requestFileSystem(PERSISTENT, grantedBytes, initFS, errorHandler);
}, function(e) {
  console.log('Error', e);
});

var globalFS;
function createDir(dir, folders) {
  // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
  if (folders[0] == '.' || folders[0] == '') {
    folders = folders.slice(1);
  }

  dir.getDirectory(folders[0], {create: true}, function(dirEntry) {
    // Recursively add the new subfolder (if we still have another to create).
    if (folders.length) {
      createDir(dirEntry, folders.slice(1));
    }
  }, errorHandler);
};

function getTags(obj) {

}

function readFromFile(file, callback) {
  globalFS.root.getFile(file, {}, function(fileEntry) {
    fileEntry.file(function(file) {

      var reader = new FileReader();

      reader.onloadend = function(e) {
        callback(this.result);
      };

      reader.onerror = function(e) {
        errorHandler(e.target.error);
      }

      reader.readAsText(file);
    }, errorHandler);
  }, errorHandler)
}

function fileExists(file, callback) {
  globalFS.root.getFile(file, {}, function(fileEntry) {
    callback(true);
  }, 
    function(err) {
      if(err.code == FileError.NOT_FOUND_ERR) {
        callback(false);
      } else {
        errorHandler(err);
      }
  });
}

function getTagsForId(id, cb) {
  var file = tagFolder + id + ".txt";
  fileExists(file, function(exists) {
    if(exists) {
      readFromFile(file, function(result) {
        if(result) {
          var obj = JSON.parse(result);
          cb(obj.tags);
        }
      });
    } else {
      cb([]);
    }

  });
}

function updateTags(obj, cb) {
  var file = tagFolder + obj.yelp_obj.id + ".txt";
  writeToFile(JSON.stringify(obj), file, function(e) {
    if(!e.error) {
      cb(true);
    } else {
      cb(false);
      errorHandler(e.target.error);
    }
  });
}

function writeToFile(data, file, callback) {
  globalFS.root.getFile(file, {create:true}, function(fileEntry) {
    fileEntry.createWriter(function(fileWriter) {
      fileWriter.onwriteend = function(e) {
        fileWriter.onwriteend = function(e) {
          callback(e.target)  
        }
        var blob = new Blob([data], {type: 'text/plain'});
        fileWriter.write(blob);
      }

      fileWriter.truncate(1);

    }, errorHandler);

  }, errorHandler);
}


var tagFolder = "tags/";

function initFS(fs){
  createDir(fs.root, tagFolder.split('/'));
  globalFS = fs;
}

function errorHandler(err){
  var msg = 'An error occured: ';
  switch (err.code) {
    case FileError.NOT_FOUND_ERR:
      msg += 'File or directory not found';
      break;
    case FileError.NOT_READABLE_ERR:
      msg += 'File or directory not readable';
      break;
    case FileError.PATH_EXISTS_ERR:
      msg += 'File or directory already exists';
      break;
    case FileError.TYPE_MISMATCH_ERR:
      msg += 'Invalid filetype';
      break;
    default:
      msg += 'Unknown Error:' + err;
      break;
  };
  console.log(msg);
};