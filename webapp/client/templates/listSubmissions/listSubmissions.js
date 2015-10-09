Template.listSubmissions.helpers({
  hasCreatedSubmission: function () {
    return WranglerSubmissions.find({}).count() > 0;
  },
});

Template.listSubmissions.events({
  "click #create-new-submission": function (event, instance){
    Meteor.call("createSubmission", function (error, result) {
      Router.go('editSubmission', { "submission_id": result });
    });
  }
});

Template.submissionActions.events({
  "click .delete-submission": function (event, instance) {
    Meteor.call("deleteSubmission", instance.data._id);
  },
  "click .cancel-validation": function (event, instance) {
    console.log("This doesn't do anything...");
  },
});
