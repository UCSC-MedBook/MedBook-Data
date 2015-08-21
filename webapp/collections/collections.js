// TODO: write a cron job to go through and delete unused ones (also files)
WranglerSubmissions = new Meteor.Collection("wrangler_submissions");
WranglerSubmissions.attachSchema(new SimpleSchema({
  "user_id": { type: Meteor.ObjectID },
  "files": {
    type: [
      new SimpleSchema({
        "file_id": { type: Meteor.ObjectID },
        "file_name": { type: String },
        "status": {
          type: String,
          allowedValues: [
            "creating",
            "uploading",
            "processing",
            "done",
            "error",
          ],
        },
        // TODO: only allow if status = "error"
        "error_description": { type: String, optional: true },
      })
    ],
    optional: true
  },
}));

WranglerDocuments = new Meteor.Collection("wrangler_documents");
WranglerDocuments.attachSchema(new SimpleSchema({
  "submission_id": { type: Meteor.ObjectID },
  "collection_name": { // not so enthused about this
    type: String,
    allowedValues: [
      "network_elements",
      "network_interactions",
    ],
  },
  "prospective_document": { type: Object, blackbox: true },
}));

UploadedFileStore = new FS.Store.GridFS("uploaded_files", {
  beforeWrite: function (fileObject) {
    // this.userId because we're on the server (doesn't work)
    fileObject.uploaded_date = new Date();
  }
});

UploadedFiles = new FS.Collection("uploaded_files", {
  stores: [UploadedFileStore],
});

// users can only modify their own documents
UploadedFiles.allow({
  insert: function (userId, doc) {
    console.log("UploadedFiles.allow insert");
    return userId === doc.user_id;
  },
  update: function(userId, doc, fields, modifier) {
    console.log("UploadedFiles.allow update:", modifier);
    return userId === doc.user_id;
  },
  remove: function (userId, doc) {
    console.log("UploadedFiles.allow remove");
    return userId === doc.user_id;
  },
  download: function (userId, doc) {
    console.log("UploadedFiles.allow download");
    return userId === doc.user_id;
  }
});
