Meteor.methods({
  // WranglerSubmission methods
  createSubmission: function () {
    var userId = makeSureLoggedIn();

    return WranglerSubmissions.insert({
      "user_id": userId,
      "date_created": new Date(),
      "status": Meteor.isClient ? "creating" : "editing",
    });
  },
  deleteSubmission: function (submission_id) {
    check(submission_id, String);

    var userId = makeSureLoggedIn();
    ensureSubmissionEditable(userId, submission_id);

    // TODO: remove actual objects from the database, if inserted

    WranglerFiles.find({ "submission_id": submission_id })
        .forEach(function (document) {
      Blobs.remove(document.blob_id);
    });
    WranglerDocuments.remove({ "submission_id": submission_id });
    WranglerFiles.remove({ "submission_id": submission_id });
    WranglerSubmissions.remove(submission_id);
  },

  // WranglerFiles methods
  addWranglerFile: function (submission_id, blobId, blobName) {
    // blobName sent so it can be fast on the client
    // (Blobs is not published at this point)
    // (the file is inserted and then removed because it's not published)
    check([submission_id, blobId, blobName], [String]);

    var userId = makeSureLoggedIn();
    var submission = ensureSubmissionEditable(userId, submission_id);

    if (Meteor.isServer) { // must be on the server because Blobs not published
      var file = Blobs.findOne(blobId);
      if (!file.metadata) {
        throw new Meteor.Error("file-lacks-metadata", "File metadata not set");
      }
      if (file.metadata.user_id !== Meteor.userId() ||
          file.metadata.submission_id !== submission_id) {
        throw new Meteor.Error("file-metadata-wrong", "File metadata is wrong");
      }
      if (file.original.name !== blobName) {
        throw new Meteor.Error("file-name-wrong");
      }
    }

    var wranglerFileId = WranglerFiles.insert({
      "submission_id": submission_id,
      "user_id": submission.user_id,
      "blob_id": blobId,
      "blob_name": blobName,
      "status": Meteor.isClient ? "creating" : "uploading",
    });

    if (Meteor.isServer){
      var guessJobId = Jobs.insert({
        "name": "guessWranglerFileType",
        "user_id": userId,
        "date_created": new Date(),
        "args": {
          "wrangler_file_id": wranglerFileId,
        }
      });
      Jobs.insert({
        "name": "parseWranglerFile",
        "user_id": userId,
        "date_created": new Date(),
        "args": {
          "wrangler_file_id": wranglerFileId,
        },
        "prerequisite_job_id": guessJobId,
      });
    }
  },
  removeWranglerFile: function (submission_id, wranglerFileId) {
    check(submission_id, String);
    check(wranglerFileId, String);
    ensureSubmissionEditable(makeSureLoggedIn(), submission_id);

    var wranglerFile = WranglerFiles.findOne({
      "_id": wranglerFileId,
      "submission_id": submission_id, // security
    });

    WranglerFiles.remove(wranglerFileId);
    console.log("removed file");

    this.unblock();

    WranglerDocuments.remove({
      "submission_id": submission_id,
      "wrangler_file_id": wranglerFileId,
    });
    Blobs.remove(wranglerFile.blob_id);
    console.log("removed rest of file");

    // TODO: call this for everything that is uncompressed from this
  },
  reparseWranglerFile: function (wranglerFileId, newOptions) {
    check(wranglerFileId, String);
    check(newOptions, wranglerFileOptions);

    var wranglerFile = WranglerFiles.findOne(wranglerFileId);
    if (wranglerFile) {
      var userId = makeSureLoggedIn();
      ensureSubmissionEditable(userId, wranglerFile.submission_id);

      WranglerFiles.update(wranglerFileId, {
        $set: {
          "status": "processing",
          "options": newOptions,
        }
      });

      if (Meteor.isServer) {
        var guessJobId;
        if (!newOptions.file_type) {
          guessJobId = Jobs.insert({
            "name": "guessWranglerFileType",
            "user_id": userId,
            "date_created": new Date(),
            "args": {
              "wrangler_file_id": wranglerFileId,
            },
          });
        }
        var removeDocumentsId = Jobs.insert({
          "name": "removeWranglerDocuments",
          "user_id": userId,
          "date_created": new Date(),
          "args": {
            "wrangler_file_id": wranglerFileId,
          },
          "prerequisite_job_id": guessJobId,
        });
        Jobs.insert({
          "name": "parseWranglerFile",
          "user_id": userId,
          "date_created": new Date(),
          "args": {
            "wrangler_file_id": wranglerFileId,
          },
          "prerequisite_job_id": removeDocumentsId,
        });
      }
    } else {
      throw new Meteor.Error("document-does-not-exist");
    }
  },

  // TODO: DEBUG REMOVE BEFORE PRODUCTION
  clean: function() {
    // only allow Teo's user id
    if (Meteor.isServer) {
      Blobs.remove({});
      WranglerSubmissions.remove({});
      WranglerFiles.remove({});
      WranglerDocuments.remove({});
      Jobs.remove({});
      console.log("Teo removed all the wrangler data");
    } else {
      console.log("you're not the server, silly stub");
    }
  },
});
