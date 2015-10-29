Template.reviewSuperpathwayDocuments.helpers({
  elementsSelector: function () {
    return {
      "submission_id": this._id,
      "document_type": "superpathway_elements",
    };
  },
  interactionsSelector: function () {
    return {
      "submission_id": this._id,
      "document_type": "superpathway_interactions",
    };
  },
});

Template.reviewMutationDocuments.helpers({
  mutationsSelector: function () {
    return {
      "submission_id": this._id,
      "document_type": "prospective_document",
      "collection_name": "mutations",
    };
  },
});

Template.reviewGeneExpression.helpers({
  sampleNormalization: function () {
    return WranglerDocuments.find({
      document_type: "sample_normalization"
    }, {
      sort: [["contents.sample_label", "asc"]]
    });
  },
  sampleLabelMaps: function () {
    return WranglerDocuments.find({
      document_type: "sample_label_map"
    }, {
      sort: [["contents.sample_label", "asc"]]
    });
  },
  geneLabelMaps: function () {
    return WranglerDocuments.find({
      document_type: "gene_label_map"
    }, {
      sort: [["contents.gene_label", "asc"]]
    });
  },
});

Template.reviewRectangularGeneExpressionDocuments.helpers({
  sampleLabelSelector: function () {
    return {
      "submission_id": this._id,
      "document_type": "sample_label",
    };
  },
  geneLabelSelector: function () {
    return {
      "submission_id": this._id,
      "document_type": "gene_label",
    };
  },
});

Template.submissionTypeNotDefined.helpers({
  hasDocuments: function () {
    return Counts.get("all-documents") > 0;
  },
  getSubmissionTypes: getSubmissionTypes,
});
