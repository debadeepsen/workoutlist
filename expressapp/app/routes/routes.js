module.exports = (app) => {
    const common = require('../controllers_mysql/common.controller.js');
    const employee = require('../controllers_mysql/employee.controller.js');
    const system = require('../controllers_mysql/system.controller.js');
    const project = require('../controllers_mysql/project.controller.js');
    const development = require('../controllers_mysql/development.controller.js');
    const workitem = require('../controllers_mysql/workitem.controller.js');
    const worklog = require('../controllers_mysql/worklog.controller.js');
    const chat = require('../controllers_mysql/chat.controller.js');
    const projectrole = require('../controllers_mysql/projectrole.controller.js');
    const todolist = require('../controllers_mysql/todolist.controller.js');
    const meeting = require('../controllers_mysql/meeting.controller.js');
    const mail = require('../controllers_mysql/mail.controller.js');
    const comments = require('../controllers_mysql/comments.controller.js');
    const search = require('../controllers_mysql/search.controller.js');
    const upload = require('../controllers_mysql/upload.controller.js');
    const monthly_report = require('../controllers_mysql/monthly.report.controller.js');
    const workitem_report = require('../controllers_mysql/workitem.report.controller.js');
    const worklog_report = require('../controllers_mysql/worklog.report.controller.js');
    const pdf_report = require('../controllers_mysql/pdf.controller.js');
    const holiday_list = require('../controllers_mysql/holiday.list.controller.js');
    const bulk_update = require('../controllers_mysql/bulkUpdate.controller.js');
    const notification = require('../controllers_mysql/notification.controller.js');
    const patch_notes = require('../controllers_mysql/patchnotes.controller.js');
    const functional_area = require('../controllers_mysql/functionalArea.controller.js');
    const project_cycle = require('../controllers_mysql/projectcycle.controller.js');
    const feedback = require('../controllers_mysql/feedback.controller.js');
    const system_requirement = require('../controllers_mysql/systemrequirement.controller.js');
    const leave = require('../controllers_mysql/leave.controller.js');
    // Common
    app.get('/children', common.getChildren);

    // Mail
    app.post('/sendsmtp', mail.sendsmtp);
    app.post('/sendgrid', mail.sendgrid);
    app.post('/sendgmail', mail.sendgmail);

    // Search
    app.get('/search', search.search);

    // Login
    app.post('/login', employee.login);

    // Masters
    app.get('/task/types/Project', development.task_types_by_Project);
    app.get('/task/types', development.task_types);
    app.get('/task/types/:ProjectTypeId', development.get_task_types);
    app.get('/task/priorities', development.task_priorities);
    app.get('/task/statuses', development.task_statuses);
    app.get('/generictasks/:projetId', workitem.getGenericTasksByProjectId);
    app.get('/generictasks', workitem.getGenericTasks);
    app.get('/workitem/types/:ProjectTypeId', development.get_workitem_types);


    // Employee
    app.get('/employees', employee.list);
    app.get('/employees/byproject', employee.listByProject);
    app.get('/employees/profile/:employeeCode', employee.profile);
    app.post('/employees/create', employee.crup);
    app.post('/employees/edit', employee.crup);
    app.get('/employees/employeeDetails/:EmployeeId', employee.employeeDetails_By_EmployeeId);
    app.post('/employees/updateallpasswords', employee.updateallpasswords);
    app.post('/employees/resetpassword', employee.resetpassword);
    app.get('/employees/All', employee.listByAllEmployee);
    app.get('/employees/list_best_on_managerId?', employee.EmployeeList_best_on_ManagerId);
    app.get('/missing_work_logs/employees/byproject', employee.missing_work_logs_listByProject);
    app.post('/employee/showHideClosedProjects', employee.showHideClosedProjects);
    app.get('/employee/getShowClosedProjects/:EmployeeId', employee.getShowClosedProjects);

    // System
    app.get('/menu', system.menu);

    //project role
    app.get('/projectRole', projectrole.list);
    app.post('/projectRole/create', projectrole.crup);
    app.post('/projectRole/edit', projectrole.crup);
    app.post('/projectRole/edit/:ProjectRoleId?delete=1', projectrole.crup);
    app.get('/projectRole/Supervisors?', projectrole.supervisorsInproject);


    // Project
    app.get('/projects/all', project.allProjects);
    app.post('/projects/create', project.crup);
    app.post('/projects/edit', project.crup);
    app.post('/projects/roles', project.assignRole);
    app.get('/project/teammates/:managerId', project.project_teammates);
    app.get('/projects/assignees/:projectCode', project.assignees);
    app.get('/projects/employeemap', project.projectEmployeeMapV2);
    app.post('/projects/employeemap', project.mapEmployees);
    app.post('/projects/releaseEmployee', project.releaseEmployee);
    app.post('/projects/releaseAll', project.releaseAll);
    app.post('/projects/hide', project.hide);
    app.post('/projects/unHide', project.unHide);
    app.get('/project/ClosedAndHiddenList/:loggedInEmployee', project.get_Hidden_And_Closed_Project_List);
    // app.post('/projects/delete', project.delete);
    // app.post('/projects/delete/:projectId', project.delete);
    app.post('/project/close', project.close);
    app.post('/project/reopen', project.reopen);
    app.get('/projects/type_list', project.type_list);
    app.get('/projects/methodology_list?', project.methodology_list);
    app.get('/projects/projectDetails/:ProjectId', project.projectDetails_By_ProjectId);
    app.get('/projects', project.list);
    app.get('/projects/list/:assigneeId', project.mainProjectList);
    app.get('/projects/Supervisors/list/:assigneeId', project.Project_Assigned_And_Supervisors_List);
    app.get('/projects/assigned/:assigneeId', project.project_assigned_by_employeeId);
    app.get('/workitemList/projects/assigned/:assigneeId', project.assigned_And_Supervisors_List);
    app.get('/projects/bymanager/:managerId', project.byManagerId);
    app.get('/projects/byProjectManager/:managerId', project.byProjectManagerId);
    app.get('/projects/byProjectManagerIdOrAnalystId/:managerId', project.byProjectManagerId_or_AnalystId);
    app.get('/projects/i/:projectId', project.list);
    app.get('/projects/byQA_And_QTL', project.byQA_And_QTL);
    app.get('/projects/:projectCode', project.listByCode);
    app.get('/projects/bytester/:testerId', project.byQA_TesterId);
    app.get('/projects/byUser/:EmployeeId/:OrganizationId', project.projectsWithCreationRights); //need to supply OrganizationId as query strings
    //app.get('/worklogs/projects/bymanager/:managerId', project.worklogs_byManagerId);
    app.get('/projects/bycreationaccess/:assigneeId', project.project_by_creationaccess_employeeId);
    app.get('/loggedInUser/projects/roles/:assigneeId', project.loggedInUser_projects_roles)


    // Tasks
    app.post('/task/create', development.task_crup);
    app.post('/task/edit', development.task_crup);
    app.get('/tasks', development.task_list);
    app.get('/tasks/:OrganizationId', development.task_list_by_org);
    app.get('/tasks/:taskId', development.task_list);
    app.get('/task/status/:TaskTypeId', development.task_status_list);
    app.get('/task/type/:TaskTypeId', development.task_type_list);
    app.get('/task/type', development.task_type_list);
    app.get('/tasks/p/:projectCode', development.task_list);
    app.get('/tasksbyprojid', development.task_list_by_project_id);
    app.get('/tasksbyassignee/:assigneeId', development.task_list_by_assignee);
    app.get('/tasksByOrganizationId/:OrganizationId', development.task_list_by_org);
    app.get('/tasks/byprojectallocation/:resourceId', development.getTasksForMyProjects);
    app.post('/assigntaskstoresources', development.assigntaskstoresources);
    app.get('/task/status', development.getTaskStatusList);
    app.post('/task/status/edit', development.changeTaskStatus);
    app.post('/assigntaskstoresourcesEmail', development.assigntaskstoresourcesEmail);
    app.get('/assigneeListOfTask/:EmployeeId', development.list_of_assigneeTask);
    app.get('/timesheet/tasksbyassignee/:assigneeId', development.timesheet_task_list_by_assignee);
    app.get('/tasksbyprojids', development.task_list_by_project_ids);
    app.get('/tasksbyAssigneeIds', development.task_list_by_Assignee_ids);
    app.post('/task/parentstatus/edit', development.changeParentTaskStatus);
    app.get('/filtertasksByOrganizationId/:OrganizationId', development.filter_task_list_by_org);
    app.get('/getAssignSyatemRequirementDetailsByWorkItem', development.getMapRequirementDetailsByWorkItemId);


    // Work items (defined as tasks earlier)
    app.get('/workitems', workitem.workitem_list);
    app.get('/workitems/assignee/:assigneeId', workitem.workitem_list_by_assignee);
    app.get('/mobile/workitems/assignee/:assigneeId', workitem.workitem_list_by_assignee_mobile);
    app.get('/workitems/myprojects/:assigneeId', workitem.workitem_list_by_assignee_projects);
    app.get('/workitems/manager/:employeeId', workitem.workitem_under_manager);
    app.get('/workitems/reportedby/:reportedBy', workitem.reported_by_me);
    app.get('/workitems/p/:projectCode', workitem.workitem_list_by_project_code);
    app.get('/workitems/byprojectid/:projectId', workitem.list_by_project_id);
    app.get('/workitem/getIdByKey', workitem.get_id_by_key);
    app.get('/workitem/:workItemId', workitem.workitem_by_id);
    app.post('/workitem/markcomplete', workitem.mark_complete);
    app.post('/workitem/search', workitem.workitem_list_filtered);
    app.post('/completed_workitem/search', workitem.completed_workitem_list_filtered);
    app.get('/workitem/history/:workItemId', workitem.getWorkItemHistory);
    app.post('/assignWorkItemToEmployee', workitem.select_new_assignee);
    app.get('/workitem/defaultAssignee/:ProjectId', workitem.get_default_assignee);
    app.get('/filterParentItemsByOrganizationId/:OrganizationId', workitem.filter_parent_items_list_by_org);
    app.post('/workitem/save/reviewcomments', workitem.save_review_comments);
    app.get('/workitem/get/reviewcomments', workitem.get_review_comments);
    app.post('/workitem/status/reviewerReject', workitem.chenge_reject_workItem);
    app.post('/workitem/status/edit', workitem.changeWorkitemStatus);
    app.post('/workitem/edit/reviewerComments', workitem.edit_reviewer_comments);
    app.post('/workitem/status/reviewerReject', workitem.chenge_reject_workItem);
    app.post('/workitem/status/edit', workitem.changeWorkitemStatus);
    app.post('/workitem/search/save', workitem.save_search);
    app.get('/workitem/savedsearch/list', workitem.saved_search_list);
    app.post('/workitem/savedsearch/delete', workitem.delete_saved_search);
    app.get('/workitem/savedsearch/:searchCode', workitem.saved_search_by_code);
    app.post('/workitem/status/completeTestReject', workitem.chenge_complete_test_reject_workItem);


    // Work log
    app.get('/worklog', worklog.findByEmployee);
    app.get('/worklog/bydate', worklog.getByDate);
    app.post('/worklog/save', worklog.save);
    app.post('/worklog/delete', worklog.deleteWorklog);
    app.get('/worklog/dailyReminder/:EmployeeId', worklog.daily_reminder_employeeId);
    app.get('/worklog/weeklyReminder/:EmployeeId&:StartDate', worklog.weekly_reminder_employeeId);
    app.get('/worklog/timesheet/bydate', worklog.getTimeSheetByDate);
    app.get('/worklog/edit/byDate', worklog.worklog_editByDate);
    app.get('/worklog/byworkitem/:workItemId', worklog.getWorklogsByTask);
    app.post('/worklog/edit/save', worklog.worklog_editSave);
    app.post('/worklog/leave/Tracking/save', worklog.leave_tracking);


    // Iteration
    app.post('/iteration/create', development.iteration_crup);
    app.post('/iteration/edit', development.iteration_crup);
    app.get('/iteration/:ProjectId', development.iteration_list);
    app.post('/assigntaskstoiteration', development.assigntaskstoiteration);
    app.get('/tasksbyiteration', development.tasksbyiteration);
    app.get('/iteration/iterationDetails/:IterationId', development.iteration_details_id);

    // Chat
    app.post('/chat/send', chat.send);
    app.get('/chat/list', chat.list);
    app.get('/chat/check', chat.check);

    //To Do List
    app.get('/todolist', todolist.todolist_list);
    app.post('/todolist/create', todolist.todolist_crup);
    app.post('/todolist/save/bulk', todolist.bulk_save);
    app.post('/todolist/edit', todolist.todolist_crup);
    app.post('/todolist/check', todolist.todolist_check);
    app.post('/todolist/edit/:ToDoListId?delete=1', todolist.todolist_crup);
    app.post('/todolist/delete', todolist.delete_to_do_list);

    // Meeting 
    app.post('/meeting/create', meeting.crup);
    app.post('/meeting/edit', meeting.crup);
    app.post('/meeting/edit/:MeetingId?delete=1', meeting.crup);
    app.get('/meeting/list', meeting.list);
    app.get('/meeting/list/:MeetingId', meeting.list);
    app.get('/meeting/assigned/:assigneeId', meeting.assignedList);
    app.post('/meeting/attendee/creation', meeting.meetingAttendeeMap);
    app.get('/meeting/venue/list', meeting.venue_list);
    app.get('/meeting/role/list', meeting.meetingRoleMaster_list);
    app.get('/meeting/details/:meetingId', meeting.meeting_details_list);
    app.get('/meeting/attendees/:meetingId', meeting.meeting_attendees_list);
    app.post('/meeting/minutes/create', meeting.meeting_minutes_crup);
    app.post('/meeting/minutes/edit', meeting.meeting_minutes_crup);
    app.get('/meeting/assignedMinutrTackerlist/:EmployeeId', meeting.assignedMinutrTacker);


    //Comments
    app.post('/comments/create', comments.crup);
    app.post('/comments/edit', comments.crup);
    app.post('/comments/edit/:CommentId?delete=1', comments.crup);
    app.get('/comments/list/:TaskId', comments.listBytaskId);
    app.post('/delete/comment', comments.delete_comment_by_id);



    app.post('/upload', upload.upload);
    app.post('/editUploadFileInfo', upload.Edit_upload_info);
    app.post('/editFeedbackUploadFileInfo', upload.Edit_Feedback_upload_info);
    app.post('/editRequirementUploadFileInfo', upload.Edit_Requirement_upload_info);
    app.post('/deleteBussinessRule/attachmentFile', upload.delete_business_rule_attachment_upload_info);


    // Reports
    app.get('/report/monthly/:year/:month', monthly_report.getAll);


    //Work Item Reports
    app.get('/report/workitem/byresource', workitem_report.workitem_report_by_resource);
    app.get('/pdf/workitem/byresource?', pdf_report.workitems_byresource_report);
    app.get('/report/workitem/byproject', workitem_report.workitem_report_by_project);
    app.get('/report/workitem/project/byresource?', workitem_report.workitem_report_project_by_resource);
    app.get('/pdf/workitem/project/byresource?', pdf_report.workitems_project_byresource_report);
    app.get('/report/workitem/agingReport?', workitem_report.workitem_agingReport);
    app.get('/report/workitem/mappingReport?', workitem_report.workitem_mappingReport);
    app.get('/report/workitem/activity', workitem_report.activity_report);

    // Project Status Reports
    app.post('/report/project/status', workitem_report.project_status_report);


    // Work log Reports 
    app.get('/worklogs/reports?', worklog_report.getWorklogs_reports);
    app.get('/worklogs/non_project/reports?', worklog_report.getWorklogs_non_project_reports);
    //app.get('/worklogs/reports/timeperiod?', worklog_report.getWorklogs_reports_timePeriod);
    //app.get('/worklogs/reports/lastweek?', worklog_report.getWorklogs_reports_last_week_timePeriod);
    app.get('/pdf/worklogs/reports?', pdf_report.worklogs_report_pdf);
    app.get('/pdf/worklogs/reports/timeperiod?', pdf_report.worklogs_report_timeperiod_pdf);
    app.get('/pdf/worklogs/reports/lastweek?', pdf_report.worklogs_report_last_week_timeperiod_pdf);
    //app.get('/worklogs/reports/yesterday?', worklog_report.getWorklogs_reports_yesterday);
    app.get('/pdf/worklogs/reports/yesterday?', pdf_report.worklogs_report_yesterday_timeperiod_pdf);
    //app.get('/worklogs/reports/lastTwoweek?', worklog_report.getWorklogs_reports_last_two_week_timePeriod);
    app.get('/pdf/worklogs/reports/lastTwoweek?', pdf_report.worklogs_report_last_two_week_timeperiod_pdf);



    // Work Log insufficient hours
    app.get('/worklogs/insufficient_hours/yesterday?', worklog_report.Yesterday_insufficient_hours);
    app.get('/worklogs/insufficient_hours/this_week?', worklog_report.This_week_insufficient_hours);
    app.get('/worklogs/insufficient_hours/this_month?', worklog_report.This_month_insufficient_hours);
    app.get('/pdf/worklogs/insufficient_hours/yesterday?', pdf_report.worklogs_yesterday_insufficient_hours_report_pdf);
    app.get('/pdf/worklogs/insufficient_hours/this_week?', pdf_report.worklogs_this_week_insufficient_hours_report_pdf);
    app.get('/pdf/worklogs/insufficient_hours/this_month?', pdf_report.worklogs_this_month_insufficient_hours_report_pdf);

    // Work Log Missing Reports
    app.get('/worklogs/missing_days/All?', worklog_report.missing_reports);
    app.get('/worklogs/missing?', worklog_report.worklog_missing_all);
    app.post('/pdf/worklogs/missing', pdf_report.worklog_missing);

    // Supervisors List
    app.get('/supervisors', common.supervisors);
    app.get('/projectManagers', common.projectManagers);

    // Holiday List 
    app.get('/holiday/list/check?', holiday_list.check_holiday);
    app.get('/holidayList', holiday_list.holidayList); //Not in use
    app.get('/holidayList/ByYear', holiday_list.holidayListByYear);
    app.post('/holidayList/save', holiday_list.saveHoliday);


    // Bulk Update
    app.post('/bulkUpdate/save', bulk_update.save);


    // Notification
    app.get('/notification/checknew/:employeeId', notification.checkNewNotifications);
    app.post('/notification/update/:employeeId', notification.update);
    app.get('/notification/all/:employeeId', notification.getAll);

    //Patch Notes
    app.get('/patchnotes', patch_notes.patchnotes_list);

    // Functional Area
    app.post('/functionalArea/save/bulk', functional_area.bulk_save);
    app.get('/functionalareaList/:ProjectId', functional_area.functional_list);
    app.post('/editFunctionalAreaInfo', functional_area.functionalArea_edit);
    app.get('/functionalArea/byProjectId/:ProjectId', functional_area.functional_list_byWorkItemProjectId);

    // Project Cycle 
    app.get('/projectCycle/projectCycleTypeMaster/byProjetTypeId?', project_cycle.get_project_cycle_type_by_project_type);
    app.get('/projectCycle/types/bymethodology/:ProjectMethodologyId', project_cycle.get_project_cycle_type_by_methodology);
    app.get('/projectCycleType', project_cycle.getAll_Project_Cycle_Type);
    app.post('/projectCycle/update', project_cycle.changeProjectCycleDate);
    app.post('/projectCycle/end_date/update', project_cycle.updateProjectCycleEndDate);
    app.post('/projectCycle/closed/status', project_cycle.checkClosedWorkItems);
    app.post('/projectCycle/create', project_cycle.project_cycle_crup);
    app.get('/projectCycle/lastCycle', project_cycle.getLastProjectCycle);
    app.get('/projectCycle/byProject/:ProjectMethodologyId', project_cycle.getCycleTypesForProject);
    app.get('/projectCycleDetails/:ProjectCycleId', project_cycle.project_cycle_details);
    app.get('/projectCycle/list/ByProjectId/:ProjectId', project_cycle.get_projectCycle_list_By_projectId);
    app.get('/projectCycle/list/:ProjectId', project_cycle.get_projectCycle_list);
    app.get('/projectCycle/workitems/mapList?', workitem.list_by_ProjectCycle_map);
    app.get('/projectCycle/AllList/:ProjectId', project_cycle.get_All_projectCycle_list);
    app.post('/updatetaskstoiteration', project_cycle.updatetaskstoiteration);
    app.post('/review/markItems', project_cycle.mark_items_assign_for_review);
    app.get('/filter/projectCycleworkitems/byprojectid?', workitem.filter_ProjectCycle_list_by_project_id);
    app.get('/filter/projectCycleworkitems/byProjectCycleId?', workitem.filter_ProjectCycle_list_by_projectCycle_id)




    //Feedback
    app.post('/feedback/create', feedback.feedback_crup);
    app.get('/feedbackList', feedback.feedback_list);

    // Resolved Status Reports
    app.post('/report/project/resolved', workitem_report.project_resolved_status_report);

    // System Requirement 
    app.post('/system_requirement/create', system_requirement.crup);
    app.get('/system_requirement/:RequirementId', system_requirement.fetch_system_requirement_by_id);
    app.get('/system_requirement/details/:ProjectId', system_requirement.fetch_system_requirement_details_by_projectId);
    app.get('/system_requirement/list/ByProjectId/:ProjectId', system_requirement.get_system_requirement_by_projectId);
    app.post('/actor/save/bulk', system_requirement.actor_bulk_save);
    app.get('/actorList/:ProjectId', system_requirement.actor_list);
    app.get('/search/system_requirement/details?', system_requirement.fetch_system_requirement_details_by_text);

    app.get('/businessRule/:SystemRequirementId', system_requirement.business_rule);
    app.get('/acceptanceCriteria/:SystemRequirementId', system_requirement.acceptance_criteria);
    app.get('/projects_functionalDetails/:SystemRequirementId', system_requirement.project_functional_details);
    app.get('/Actor_Details/:SystemRequirementId', system_requirement.actor_details);
    app.get('/Attachments_File_Details/:SystemRequirementId', system_requirement.attachments_requirements_files);


    app.post('/editActorInfo', system_requirement.actor_edit);
    app.post('/assignWorkItemToSyatemRequirementMap', system_requirement.assign_workitem_to_system_requirement);
    app.get('/getAllSystemRequirement', system_requirement.get_All_system_requirement_list);
    app.post('/assignActorToSyatemRequirementMap', system_requirement.assign_actor_to_system_requirement_map);
    app.get('/getAssignWorkItemToSyatemRequirementMap', system_requirement.get_assign_workitem_to_system_requirement_map);
    app.get('/getAssignActorToSyatemRequirementMap', system_requirement.get_assign_actor_to_system_requirement_map);
    app.get('/getActorDetailsById/:ActorId', system_requirement.get_actor_details_by_actorId);
    app.post('/saveActorToSyatemRequirementMap', system_requirement.save_actor_to_system_requirement_map);
    app.get('/mapRequirement/details/:ActorId', system_requirement.getMapRequirementDetails);
    app.get('/pdf/generatedRequirementsDocument/:ProjectId', pdf_report.system_requirements_report);
    app.post('/delete/businessRule_and_attachment', system_requirement.delete_bussiness_rule_by_id);
    app.post('/delete/acceptance_criteria', system_requirement.delete_acceptance_criteria_by_id);
    app.get('/systemRequirement/lastCode', system_requirement.getLastSystemRequirementCode);
    app.post('/edit/systemRequirement/acceptanceCriteria', system_requirement.edit_acceptanceCriteria_by_requirement_id);
    app.post('/edit/systemRequirement/businessRule', system_requirement.edit_businessRule_by_requirement_id);
    app.get('/fetch/sub_type_master/:type', system_requirement.fetch_sub_types_master);
    app.post('/systemRequirementList/Search', system_requirement.systemRequirement_List_searched);
    app.post('/systemRequirementList/no_workItems/map', system_requirement.systemRequirement_no_items_map);
    app.get('/fetch/systemRequitement/mappingReport/:ProjectId', system_requirement.system_requirement_mapping_reports);
    app.post('/fetch/systemRequitement/mappingReport/filterData', system_requirement.systemRequirement_mapping_report_filter);
    app.post('/fetch/systemRequitement/mappingReport/no_workItems/map', system_requirement.systemRequirement_mapping_report_no_items_map);


    //Release Resource 
    app.get('/filter/release_resource/details?', employee.release_resource_filter);
    app.post('/release_resource/details', employee.release_resource_info_update);

    // Leave
    app.post('/leave/application/save', leave.saveLeaveApplication);
    app.get('/leave/record/:EmployeeId', leave.leave_record_list);
    app.post('/delete/leave/application', leave.delete_leave_record);
    app.get('/leave/application/check?', leave.check_leave_record);



}

