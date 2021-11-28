const connection = require("./mysql.controller");

exports.get_project_cycle_type_by_project_type = (req, res) => {
  let query = ``;

  if (req.query.ProjectTypeId == 1) {
    query = `SELECT ptm.*,pm.ProjectMethodologyName FROM projectcycle_type_methodology_map pctm 
        JOIN project_cycle_type_master ptm ON pctm.ProjectCycleTypeId = ptm.ProjectCycleTypeId
        JOIN project_methodology pm ON pctm.ProjectMethodologyId = pm.ProjectMethodologyId
        WHERE pctm.ProjectMethodologyId = ${req.query.ProjectMethodologyId}`;
  } else if (req.query.ProjectTypeId == 2) {
    query = `SELECT ptm.* FROM project_cycle_type_master ptm WHERE ptm.ProjectCycleTypeId = 3`;
  }

  console.log(query);
  connection.query(query, function (obj) {
    res.send({
      success: obj.error == null,
      message: "success",
      data: obj.response,
    });
  });
};

// Get All Project Cycle Type
exports.getAll_Project_Cycle_Type = (req, res) => {
  let getQuery = `SELECT ptm.* FROM project_cycle_type_master ptm WHERE ptm.Deleted ='N'`;

  connection.query(getQuery, function (obj) {
    res.send({
      success: obj.error == null,
      message: "success",
      data: obj.response,
    });
  });
};

// Get All Project Cycle Type
exports.get_project_cycle_type_by_methodology = (req, res) => {
  let getQuery = `SELECT ptm.* FROM projectcycle_type_methodology_map ptm_map
                  JOIN project_cycle_type_master ptm ON ptm_map.ProjectCycleTypeId = ptm.ProjectCycleTypeId
                  WHERE ptm_map.ProjectMethodologyId = ${req.params.ProjectMethodologyId}`;

  connection.query(getQuery, function (obj) {
    res.send({
      success: obj.error == null,
      message: "success",
      data: obj.response,
    });
  });
};

exports.project_cycle_crup = (req, res) => {
  // check for duplicates
  let duplicateQuery = `SELECT ProjectCycleNumber FROM project_cycle WHERE ProjectId = '${req.body.ProjectId}' AND 
                         ProjectCycleTypeId = '${req.body.ProjectCycleTypeId}' 
                         AND ProjectCycleNumber = '${req.body.ProjectCycleNumber}' 
                         ${req.body.ProjectCycleId
      ? " and ProjectCycleId <> " +
      req.body.ProjectCycleId
      : ""
    }`;

  console.log(duplicateQuery);
  connection.query(duplicateQuery, function (obj) {
    if (obj.response.length) {
      return res.status(400).send({
        success: false,
        message: `This Project Cycle Number "${req.body.ProjectCycleNumber}" has already been assigned to another project cycle in this project.`,
        data: null,
      });
    } else {
      let crupQuery = req.body.ProjectCycleId
        ? `UPDATE project_cycle SET ProjectCycleNumber = '${req.body.ProjectCycleNumber}',
            ${req.body.ProjectCycleDescription ? "ProjectCycleDescription = '" +
          req.body.ProjectCycleDescription.replace(/'/g, "\\'") + "'" + "," : ""} 
             PlannedStartDate =  '${req.body.PlannedStartDate}', 
             PlannedEndDate = '${req.body.PlannedEndDate}',
            Duration = '${req.body.Duration}'  WHERE ProjectCycleId ='${req.body.ProjectCycleId}'`

        :

        `INSERT INTO project_cycle (ProjectId,ProjectCycleTypeId,ProjectCycleNumber,${req.body.ProjectCycleDescription
          ? "ProjectCycleDescription,"
          : ""
        } CreatedBy, PlannedStartDate, Duration, PlannedEndDate)
              VALUES('${req.body.ProjectId}', '${req.body.ProjectCycleTypeId}', '${req.body.ProjectCycleNumber}',${req.body.ProjectCycleDescription ? "'" + req.body.ProjectCycleDescription.replace(/'/g, "\\'") +
          "'" + "," : ""}'${req.body.CreatedBy}','${req.body.PlannedStartDate}','${req.body.Duration}', '${req.body.PlannedEndDate}' )`;

      connection.query(crupQuery, function (obj) {
        res.send({
          success: obj.error == null,
          message: obj.error || `Success`,
          data: obj.response,
        });
      });
    }
  });
};

exports.project_cycle_details = (req, res) => {
  query = `SELECT pc.*,p.* FROM project_cycle pc JOIN project p ON pc.ProjectId = p.ProjectId WHERE pc.ProjectCycleId = '${req.params.ProjectCycleId}'`;

  connection.query(query, function (obj) {
    res.send({
      success: obj.error == null,
      message: obj.error || `Success`,
      data: obj.response,
    });
  });
};

// Get Project Cycle List by Project ID

exports.get_projectCycle_list = (req, res) => {
  let query = `SELECT pc.*, p.ProjectId, p.ProjectCode, p.ProjectTypeId, ptm.ProjectCycleTypeId, ptm.ProjectCycleTypeName
                FROM project_cycle pc
                JOIN project p ON pc.ProjectId = p.ProjectId
                JOIN project_cycle_type_master ptm ON pc.ProjectCycleTypeId = ptm.ProjectCycleTypeId
                WHERE pc.ProjectId = '${req.params.ProjectId}'`;

  console.log(query);

  connection.query(query, function (obj) {
    res.send({
      success: obj.error == null,
      message: obj.error || `Success`,
      data: build_projectcycle_list(obj.response),
    });
  });
};

// Utility function, to group by project cycle type
function build_projectcycle_list(workitems) {
  var return_list = [];

  workitems.forEach((e) => {
    var project_obj = return_list.find(
      (x) => x.ProjectCycleTypeId == e.ProjectCycleTypeId
    );

    if (!project_obj) {
      return_list.push({
        ProjectCycleTypeId: e.ProjectCycleTypeId,
        ProjectCycleTypeName: e.ProjectCycleTypeName,
        ProjectCycles: [e],
      });
    } else {
      project_obj.ProjectCycles.push(e);
    }
  });

  return return_list;
}

//change ProjectCycle Start Date  best on Id
exports.changeProjectCycleDate = (req, res) => {

  let query = `SELECT pc.*  from project_cycle pc WHERE pc.ProjectId ='${req.body.ProjectId}' AND pc.ActualStartDate IS NOT NULL  and pc.ActualEndDate is NULL`;

  console.log(query);
  connection.query(query, function (obj) {
    if (obj.response.length) {

      res.status(400).send({
        success: false,
        message: `You cannot start a new project cycle while another one is still active.`,
        data: null
      });
    } else {
      let crupQuery = `UPDATE project_cycle set 
                    ActualStartDate ='${req.body.StartDate}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                     where ProjectCycleId =${req.body.ProjectCycleId}`;

      connection.query(crupQuery, function (obj) {
        res.send({
          success: obj.error == null,
          message: obj.error || `Success`,
          data: obj.response,
        });
      });
    }
  });
};

// Get Project Cycle List by  work item Project ID

exports.get_projectCycle_list_By_projectId = (req, res) => {
  let query = `SELECT pc.*,p.*,ptm.* FROM project_cycle pc
                 JOIN project p ON pc.ProjectId = p.ProjectId
                 JOIN project_cycle_type_master ptm ON pc.ProjectCycleTypeId = ptm.ProjectCycleTypeId
                 WHERE pc.ProjectId = '${req.params.ProjectId}' and pc.ActualEndDate IS NULL`;

  console.log(query);

  connection.query(query, function (obj) {
    res.send({
      success: obj.error == null,
      message: obj.error || `Success`,
      data: obj.response,
    });
  });
};

//change ProjectCycle Actual End Date   best on Id
exports.updateProjectCycleEndDate = (req, res) => {
  let crupQuery = `UPDATE project_cycle set 
                     ActualEndDate ='${req.body.ActualEndDate}',
                    LastUpdatedBy = '${req.body.LastUpdatedBy}'
                    where ProjectCycleId =${req.body.ProjectCycleId}`;

  connection.query(crupQuery, function (obj) {
    res.send({
      success: obj.error == null,
      message: obj.error || `Success`,
      data: obj.response,
    });
  });
};

// check all closed work items by Project Cycle Id
exports.checkClosedWorkItems = (req, res) => {
  let query = `
                SELECT count(t.TaskId) AS "TotalWorkItems" from task t
                JOIN task_iteration_map im ON  t.TaskId=im.TaskId
                JOIN project_cycle pc ON im.IterationId=pc.ProjectCycleId
                Where pc.ProjectCycleId='${req.body.ProjectCycleId}';

                SELECT count(t.TaskId) AS "ClosedWorkItems"  from task t
                JOIN task_iteration_map im ON  t.TaskId=im.TaskId
                JOIN project_cycle pc ON im.IterationId=pc.ProjectCycleId
                Where pc.ProjectCycleId='${req.body.ProjectCycleId}' AND t.WorkitemStatusId IN(6,8);
                 `;

  console.log(query);
  connection.query(query, function (obj) {
    res.status(200).send({
      status: true,
      message: "",
      data: buildClosedWorkItems(obj.response),
    });
  });
};

function buildClosedWorkItems(data) {
  var responseObj = [];
  //var finalResult = [];
  console.log(data);

  var list1 = data[0];
  var list2 = data[1];
  let totalWorkItems = 0;
  let closedWorkItems = 0;

  list1.forEach((e) => {
    totalWorkItems = e.TotalWorkItems;
  });
  list2.forEach((m) => {
    closedWorkItems = m.ClosedWorkItems;
  });
  if (totalWorkItems == closedWorkItems) {
    responseObj.push({
      category: true,
    });
  } else {
    responseObj.push({
      category: false,
    });
  }
  console.log(responseObj);

  return responseObj;
}

// Get Project Cycle List

exports.get_All_projectCycle_list = (req, res) => {
  let query = `SELECT pc.*,pctm.ProjectCycleTypeName FROM project_cycle pc
               JOIN project_cycle_type_master pctm ON pc.ProjectCycleTypeId = pctm.ProjectCycleTypeId 
               Where pc.Deleted='N' AND  pc.ProjectId = '${req.params.ProjectId}' and pc.ActualEndDate IS NULL`;

  console.log(query);

  connection.query(query, function (obj) {
    res.send({
      success: obj.error == null,
      message: obj.error || `Success`,
      data: obj.response,
    });
  });
};

// update tasks to project cycle
exports.updatetaskstoiteration = (req, res) => {
  console.log("Enter --" + req.body.ProjectCycleId)
  let TaskIds = ``;
  req.body.selectedTasks.forEach((e, i) => {
    TaskIds += `${e},`;
  });

  TaskIds = TaskIds.substr(0, TaskIds.length - 1);
  console.log(TaskIds);

  if (!req.body.ProjectCycleId) {
    return res.status(400).send({
      success: false,
      message: "ProjectCycleId cannot be empty",
      data: null,
    });
  }

  if (req.body.ProjectCycleId == "-1") {

    let query = `DELETE FROM task_iteration_map WHERE TaskId IN (${TaskIds})`;

    connection.query(query, function (obj) {
      res.send({
        success: obj.error == null,
        message: obj.error || `Success`,
        data: obj.response,
      });
    });

  } else {

    let query = `DELETE FROM task_iteration_map WHERE TaskId IN (${TaskIds})`;

    connection.query(query, function (objDel) {
      if (objDel.error != null) {
        res.status(400).send({
          success: false,
          message:
            "Error: Code 90001. Please contact your system admin with this code.",
          data: null,
        });
      }

      let query = `INSERT INTO task_iteration_map (IterationId, TaskId) VALUES `;

      req.body.selectedTasks.forEach((e, i) => {
        query += `('${req.body.ProjectCycleId}','${e}'),`;
      });

      query = query.substr(0, query.length - 1) + `;`;

      console.log(query);
      // res.send(query);
      // return;

      connection.query(query, function (obj) {
        res.send({
          success: obj.error == null,
          message: obj.error || `Success`,
          data: obj.response,
        });
      });
    });
  }
};


exports.getCycleTypesForProject = (req, res) => {

  if (!req.params.ProjectMethodologyId) {
    return res.status(400).send({
      success: false,
      message: 'ProjectMethodologyId is required',
      data: null
    })
  }

  let query = `SELECT * FROM project_cycle_type_master pct 
                JOIN projectcycle_type_methodology_map pctm
                ON pct.ProjectCycleTypeId = pctm.ProjectCycleTypeId
                WHERE pctm.ProjectMethodologyId = ${req.params.ProjectMethodologyId}`;
  console.log(query)
  connection.query(query, function (obj) {
    return res.status(200).send({
      success: true,
      message: 'Success',
      data: obj.response
    })
  })

}


// get the last project cycle for this type
exports.getLastProjectCycle = (req, res) => {

  if (!req.query.ProjectId) {
    return res.status(400).send({
      success: false,
      message: 'ProjectId is required',
      data: null
    })
  }

  if (!req.query.ProjectCycleTypeId) {
    return res.status(400).send({
      success: false,
      message: 'ProjectCycleTypeId is required',
      data: null
    })
  }

  let query = `SELECT * FROM project_cycle pc WHERE pc.ProjectId = ${req.query.ProjectId}
                AND pc.ProjectCycleTypeId = ${req.query.ProjectCycleTypeId}
                ORDER BY pc.ProjectCycleNumber DESC 
                LIMIT 0,1`;

  console.log(query);

  connection.query(query, function (obj) {
    return res.status(200).send({
      success: true,
      message: 'Success',
      data: obj.response
    })
  })
}

// Mark Items Ready to Review 

exports.mark_items_assign_for_review = (req, res) => {

  let QTL_search_query = `SELECT EmployeeId FROM project_employee_map WHERE ProjectId ='${req.body.ProjectId}' AND ProjectRoleId=3`

  connection.query(QTL_search_query, function (obj) {
    var AssigneeId = obj.response[0].EmployeeId;

    var query = ``;
    req.body.MarkReviewItems.forEach(e => {
      query += `UPDATE task SET AssigneeId = '${AssigneeId}', WorkitemStatusId = '${req.body.WorkitemStatusId}' WHERE TaskId ='${e.TaskId}';`
    })

    connection.query(query, function (obj) {
      res.send({
        success: obj.error == null,
        message: obj.error || `Success`,
        data: obj.response,
      });
    });
  })

}