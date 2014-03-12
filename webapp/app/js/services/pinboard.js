'use strict';

treeherder.factory('thPinboard',
                   function($http, thUrl, ThJobClassificationModel, $rootScope,
                            thEvents, ThBugJobMapModel, thNotify) {

    var pinnedJobs = {};
    var relatedBugs = {};

    var saveClassification = function(job) {
        var classification = new ThJobClassificationModel(this);
        classification.job_id = job.id;
        classification.create();
    };

    var saveBugs = function(job) {
        _.forEach(relatedBugs, function(bug) {
            var bjm = new ThBugJobMapModel({
                bug_id : bug.id,
                job_id: job.id,
                type: 'annotation'
            });
            bjm.create();
            api.removeBug(bug.id);
        });
    };

    var api = {
        pinJob: function(job) {
            pinnedJobs[job.id] = job;
            // update the ui because these are added outside the angular event
            // model.
            $rootScope.$apply();
        },

        unPinJob: function(id) {
            delete pinnedJobs[id];
        },

        // clear all pinned jobs and related bugs
        unPinAll: function() {
            for (var jid in pinnedJobs) {
                if (pinnedJobs.hasOwnProperty(jid)) { delete pinnedJobs[jid]; } }
            for (var bid in relatedBugs) {
                if (relatedBugs.hasOwnProperty(bid)) { delete relatedBugs[bid]; } }
        },

        addBug: function(bug) {
            relatedBugs[bug.id] = bug;
        },

        removeBug: function(id) {
            delete relatedBugs[id];
        },

        // open form to create a new note
        createNewClassification: function() {
            return new ThJobClassificationModel({
                note: "",
                who: null,
                failure_classification_id: -1
            });
        },

        // save the classification and related bugs to all pinned jobs
        save: function(classification) {
            _.each(pinnedJobs, saveClassification, classification);
            $rootScope.$broadcast(thEvents.jobsClassified, {jobs: pinnedJobs});

            if (!_.size(relatedBugs)) {
                thNotify.send("no bug associations to save");
            } else {
                _.each(pinnedJobs, saveBugs);
                $rootScope.$broadcast(thEvents.bugsAssociated, {jobs: pinnedJobs});
            }
        },

        // save the classification only on all pinned jobs
        saveClassificationOnly: function(classification) {
            _.each(pinnedJobs, saveClassification, classification);
            $rootScope.$broadcast(thEvents.jobsClassified, {jobs: pinnedJobs});
        },

        // save bug associations only on all pinned jobs
        saveBugsOnly: function() {
            if (!_.size(relatedBugs)) {
                thNotify.send("no bug associations to save");
            } else {
                _.each(pinnedJobs, saveBugs);
                $rootScope.$broadcast(thEvents.bugsAssociated, {jobs: pinnedJobs});
            }
        },

        hasPinnedJobs: function() {
            return !_.isEmpty(pinnedJobs);
        },
        pinnedJobs: pinnedJobs,
        relatedBugs: relatedBugs
    };

    return api;
});
