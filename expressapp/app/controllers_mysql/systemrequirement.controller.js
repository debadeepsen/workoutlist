const connection = require('./mysql.controller');
const { save_review_comments } = require('./workitem.controller');

exports.crup = (req, res) => {

    let crupQuery = req.body.SystemRequirementId ?
        `UPDATE system_requirement set 
                        SystemRequirementType='${req.body.SystemRequirementType}',
                        SystemRequirementName='${req.body.SystemRequirementName.replace(/'/g, "\\'")}',
                        SystemRequirementDescription='${ req.body.SystemRequirementDescription ? req.body.SystemRequirementDescription.replace(/'/g, "\\'") : ""}',
                        ${ req.body.FunctionalAreaId ? "FunctionalAreaId = '" + req.body.FunctionalAreaId + "'," : ""}
                        ${ req.body.SubTypeMasterId ? "SubTypeMasterId = '" + req.body.SubTypeMasterId + "'," : ""}
                        ProjectId = '${req.body.ProjectId}',
                        SystemRequirementCode = '${req.body.SystemRequirementCode}',
                        LastUpdatedBy='${req.body.CreatedBy}'
                        WHERE SystemRequirementId=${req.body.SystemRequirementId}` :
        `INSERT INTO system_requirement (SystemRequirementType,SystemRequirementName,${req.body.SystemRequirementDescription ? "SystemRequirementDescription," : ""}
                                        ${req.body.FunctionalAreaId ? "FunctionalAreaId," : ""} ProjectId,SystemRequirementCode,${req.body.SubTypeMasterId ? "SubTypeMasterId," : ""}CreatedBy) 
                                    VALUES('${req.body.SystemRequirementType}',
                                    '${req.body.SystemRequirementName.replace(/'/g, "\\'")}',
                                    ${req.body.SystemRequirementDescription ? "'" + req.body.SystemRequirementDescription.replace(/'/g, "\\'") + "'" + "," : ""}
                                    ${req.body.FunctionalAreaId ? req.body.FunctionalAreaId + "," : ""}
                                    '${req.body.ProjectId}',
                                    '${req.body.SystemRequirementCode}',
                                    ${req.body.SubTypeMasterId ? req.body.SubTypeMasterId + "," : ""}
                                    '${req.body.CreatedBy}' ) `;

    connection.query(crupQuery, function (obj) {

        if (obj.error != null) {
            res.status(400).send({
                success: false,
                message: obj.message || `ERROR`,
                data: null
            });
            return;
        }

        let systemRequirementId = req.body.SystemRequirementId ? req.body.SystemRequirementId : obj.response.insertId;
        var actors = (req.body.selectedActors) ? req.body.selectedActors : [];
        var acceptances = (req.body.addToAcceptance) ? req.body.addToAcceptance : [];
        var business = (req.body.addToBusinessRules) ? req.body.addToBusinessRules : [];
        var attachments = (req.body.attachments) ? req.body.attachments : [];

        let attachmentFileNames = ``;
        attachments.forEach(e => {
            attachmentFileNames += `(${systemRequirementId},'${e}', ${req.body.CreatedBy}),`
        });

        attachmentFileNames = attachmentFileNames.substr(0, attachmentFileNames.length - 1) + `;`;

        let actorsIds = ``;
        actors.forEach(e => {
            actorsIds += `(${systemRequirementId},'${e}'),`
        });
        actorsIds = actorsIds.substr(0, actorsIds.length - 1) + `;`

        let filesQuery = `DELETE FROM requirement_files WHERE SystemRequirementId = ${systemRequirementId};`

        if (attachments.length) {
            filesQuery += `INSERT INTO requirement_files (SystemRequirementId, FileURL, CreatedBy) VALUES ${attachmentFileNames}` //do nothing if no files are getting uploaded
        }

        filesQuery += `DELETE FROM system_requirement_actor_map WHERE SystemRequirementId = ${systemRequirementId};`

        if (actors.length) {
            filesQuery += `INSERT INTO system_requirement_actor_map (SystemRequirementId, ActorId) VALUES ${actorsIds}`
        }

        let acceptanceInfo = ``;
        let acceptanceIsData = false;
        acceptances.forEach(e => {
            if (e.AcceptanceCriteriaName != "") {
                acceptanceIsData = true;
                acceptanceInfo += `(${systemRequirementId},'${e.AcceptanceCriteriaName}', ${req.body.CreatedBy}),`
            }
        });

        acceptanceInfo = acceptanceInfo.substr(0, acceptanceInfo.length - 1) + `;`

        filesQuery += `DELETE FROM acceptance_criteria WHERE SystemRequirementId =${systemRequirementId};`

        if (acceptanceIsData) {

            filesQuery += `INSERT INTO acceptance_criteria (SystemRequirementId, AcceptanceCriteriaName, CreatedBy) VALUES ${acceptanceInfo}`

        }

        // let businessInfo = ``;
        // let businessIsData = false;
        // business.forEach(e => {
        //     if (e.AcceptanceCriteriaName != "") {
        //         businessIsData = true;
        //         businessInfo += `(${systemRequirementId},'${e.BusinessRuleName}', ${req.body.CreatedBy}),`
        //     }
        // });

        // businessInfo = businessInfo.substr(0, businessInfo.length - 1) + `;`

        // filesQuery += `DELETE FROM business_rule WHERE SystemRequirementId =${systemRequirementId};`

        // if (businessIsData) {

        //     filesQuery += `INSERT INTO business_rule (SystemRequirementId, BusinessRuleName, CreatedBy) VALUES ${businessInfo}`

        // }

        business.forEach(e => {
            if (e.BusinessRuleName != "") {
                var businessQuery = e.BusinessRuleId ?
                    `UPDATE business_rule SET
                     BusinessRuleName ='${e.BusinessRuleName}'
                     WHERE BusinessRuleId ='${e.BusinessRuleId}'` :
                    `INSERT INTO business_rule (SystemRequirementId, BusinessRuleName, CreatedBy) VALUES (${systemRequirementId},'${e.BusinessRuleName}', ${req.body.CreatedBy})`;

                connection.query(businessQuery, function (obj) {

                    if (obj.error != null) {
                        res.status(400).send({
                            success: false,
                            message: obj.message || `ERROR`,
                            data: null
                        });
                        return;
                    }
                    let businessRuleId = e.BusinessRuleId ? e.BusinessRuleId : obj.response.insertId;

                    if (e.BusinessRuleAttachment != "") {
                        var businessAttachmentQuery = e.BusinessRuleFileId ?
                            `UPDATE business_rule_files SET BusinessRuleFileURL='${e.BusinessRuleAttachment}' WHERE BusinessRuleFileId ='${e.BusinessRuleFileId}' ; ` :
                            `INSERT INTO business_rule_files (BusinessRuleId,BusinessRuleFileURL,CreatedBy) VALUES (${businessRuleId},'${e.BusinessRuleAttachment}',${req.body.CreatedBy})`;


                        connection.query(businessAttachmentQuery, function (obj) {

                            if (obj.error != null) {
                                res.status(400).send({
                                    success: false,
                                    message: obj.message || `ERROR`,
                                    data: null
                                });
                                return;
                            }
                            return;
                        })
                    }
                })

            }
        });


        console.log(filesQuery)

        if (actors.length || acceptances.length || business.length || attachments.length) {
            console.log(filesQuery)
            connection.query(filesQuery, function (obj) {

                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response
                });

            })
        } else {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        }
    });
}

exports.fetch_system_requirement_by_id = (req, res) => {

    let query = `SELECT DISTINCT  sr.*,srm.ActorId,srm.ActorName,ac.AcceptanceCriteriaId,ac.AcceptanceCriteriaName ,
                 br.BusinessRuleId,br.BusinessRuleName,rf.RequirementFileId,rf.FileURL,rf.Deleted AS "File_Deleted",
                 brs.BusinessRuleFileId,brs.BusinessRuleFileURL,brs.BusinessRuleId AS "Business_Rule_ID",stm.SubTypeMasterId,stm.SubTypeName
                 from system_requirement sr 
            LEFT JOIN sub_type_master stm ON sr.SubTypeMasterId = stm.SubTypeMasterId 
            LEFT JOIN
                 (SELECT a.ActorId,a.ActorName,sram.SystemRequirementId from system_requirement_actor_map sram JOIN actor a ON sram.ActorId = a.ActorId) srm  ON sr.SystemRequirementId = srm.SystemRequirementId
            LEFT JOIN 
                 (Select DISTINCT aa.AcceptanceCriteriaId,aa.AcceptanceCriteriaName,srr.SystemRequirementId FROM acceptance_criteria aa JOIN system_requirement srr ON aa.SystemRequirementId = srr.SystemRequirementId ) ac ON sr.SystemRequirementId = ac.SystemRequirementId
            LEFT JOIN 
                 (SELECT  DISTINCT bs.BusinessRuleId,bs.BusinessRuleName,s.SystemRequirementId FROM business_rule bs  JOIN  system_requirement s ON bs.SystemRequirementId = s.SystemRequirementId ) br ON sr.SystemRequirementId = br.SystemRequirementId
            LEFT JOIN
                (SELECT f.RequirementFileId,f.FileURL,f.Deleted,rfs.SystemRequirementId FROM  requirement_files f JOIN  system_requirement rfs ON f.SystemRequirementId = rfs.SystemRequirementId) rf  ON sr.SystemRequirementId = rf.SystemRequirementId 
            LEFT JOIN 
                 (SELECT b.BusinessRuleId,b.SystemRequirementId,brf.BusinessRuleFileId,brf.BusinessRuleFileURL FROM  business_rule b
                  JOIN  business_rule_files brf ON b.BusinessRuleId = brf.BusinessRuleId) brs ON sr.SystemRequirementId = brs.SystemRequirementId
                  where sr.SystemRequirementId=${req.params.RequirementId} ; `;

    console.log(query)
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}




exports.fetch_system_requirement_details_by_projectId = (req, res) => {

    let query = `SELECT sr.*,stm.SubTypeName ,p.ProjectId,ProjectCode,p.ProjectName,fa.FunctionalAreaId,fa.FunctionalAreaCode,fa.Description FROM system_requirement sr
               INNER JOIN project p ON sr.ProjectId= p.ProjectId 
               LEFT JOIN functional_area fa ON  sr.FunctionalAreaId=fa.FunctionalAreaId
               LEFT JOIN sub_type_master stm ON stm.SubTypeMasterId = sr.SubTypeMasterId
               WHERE sr.ProjectId=${req.params.ProjectId}`
    console.log(query)
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}


// Filter System Requirement Detail by text search 
exports.fetch_system_requirement_details_by_text = (req, res) => {

    var whereString = ``;
    console.log(!req.query.ProjectId)

    // if (req.query.ProjectId) {
    //     whereString = `WHERE sr.ProjectId=${req.query.ProjectId} AND (fa.FunctionalAreaCode LIKE '%${req.query.searchTerm}%' OR fa.Description LIKE '%${req.query.searchTerm}%')`
    // } else {
    //     whereString = `WHERE  fa.FunctionalAreaCode LIKE '%${req.query.searchTerm}%' OR fa.Description LIKE '%${req.query.searchTerm}%'`
    // }

    let query = `SELECT sr.* ,p.ProjectId,ProjectCode,p.ProjectName,fa.FunctionalAreaId,fa.FunctionalAreaCode,fa.Description FROM system_requirement sr
               INNER JOIN project p ON sr.ProjectId= p.ProjectId 
               LEFT JOIN functional_area fa ON  sr.FunctionalAreaId=fa.FunctionalAreaId
               WHERE sr.ProjectId=${req.query.ProjectId} AND fa.FunctionalAreaId =${req.query.searchTerm} ;`
    console.log(query)
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

exports.get_system_requirement_by_projectId = (req, res) => {

    let query = `SELECT sr.* FROM system_requirement sr where sr.ProjectId= '${req.params.ProjectId}' and sr.Deleted='N' `;

    console.log(query)
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

exports.actor_bulk_save = (req, res) => {

    var duplicates = ``;
    var query = `INSERT INTO actor (ActorName,ActorDescription, ProjectId, CreatedBy) VALUES `;
    var duplicatesCount = ``;
    var duplicateQuery = ``;

    req.body.Items.forEach(e => {
        duplicatesCount += "'" + e.ActorName + "',";
        query += `('${e.ActorName.replace(/'/g, '\\\'')}','${e.ActorDescription.replace(/'/g, '\\\'')}','${req.body.ProjectId}','${req.body.EmployeeId}'),`;


    });

    duplicatesCount = duplicatesCount.substr(0, duplicatesCount.length - 1);
    console.log(duplicatesCount)

    duplicateQuery = `SELECT ActorName FROM actor where ActorName  IN (${duplicatesCount}) and ProjectId='${req.body.ProjectId}' `;

    console.log(duplicateQuery)

    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length) {
            obj.response.forEach(e => {
                duplicates += e.ActorName + ",";
            })
        } else {
            query = query.substr(0, query.length - 1);
            console.log(query);
            connection.query(query, function (obj) {

                return res.status(200).send({
                    success: obj.error == null,
                    message: `Actor Created Successfully`,
                    data: obj.response
                });


            });
        }
        if (duplicates) {
            duplicates = duplicates.substr(0, duplicates.length - 1);
            return res.status(400).send({
                success: false,
                message: `The codes '${duplicates}' have already been assigned to other Actors in this project.`,
                data: null
            });


        }

    });

}

exports.actor_list = (req, res) => {
    let listQuery = `SELECT a.*,p.ProjectCode FROM actor a INNER JOIN project p On a.ProjectId=p.ProjectId
    where a.ProjectId='${req.params.ProjectId}' AND a.Deleted='N'`;

    console.log(listQuery)
    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}


//Get All Business Rules
exports.business_rule = (req, res) => {
    let listQuery = `SELECT br.*,brf.* FROM business_rule br
    LEFT JOIN business_rule_files brf ON br.BusinessRuleId =brf.BusinessRuleId
	WHERE br.SystemRequirementId='${req.params.SystemRequirementId}' `;

    console.log(listQuery)
    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}


//Acceptance Criteria
exports.acceptance_criteria = (req, res) => {
    let listQuery = `SELECT ac.* FROM  acceptance_criteria ac INNER JOIN system_requirement sr 
    ON sr.SystemRequirementId=ac.SystemRequirementId
    WHERE ac.SystemRequirementId='${req.params.SystemRequirementId}' `;

    console.log(listQuery)
    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}

//System requirement Projects and Functional Area Details
exports.project_functional_details = (req, res) => {
    let listQuery = `SELECT SR.*,P.ProjectCode,P.ProjectName,FA.FunctionalAreaCode,FA.Description
    FROM system_requirement SR 
    JOIN project P 
    ON SR.ProjectId =P.ProjectId
    LEFT JOIN functional_area FA 
    ON SR.FunctionalAreaId = FA.FunctionalAreaId
    WHERE SR.SystemRequirementId='${req.params.SystemRequirementId}' `;

    console.log(listQuery)
    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}


//Actor Details
exports.actor_details = (req, res) => {
    let listQuery = `SELECT sr.*,A.*,sram.* FROM system_requirement sr
    LEFT JOIN system_requirement_actor_map sram ON sr.SystemRequirementId=sram.SystemRequirementId
    LEFT JOIN actor A ON sram.ActorId=A.ActorId
    WHERE sr.SystemRequirementId='${req.params.SystemRequirementId}' `;

    console.log(listQuery)
    connection.query(listQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });
}

//Attachments based on system requirement id
exports.attachments_requirements_files = (req, res) => {
    let query = `SELECT sr.*,rf.* FROM system_requirement sr JOIN requirement_files rf
    ON sr.SystemRequirementId=rf.SystemRequirementId WHERE sr.SystemRequirementId='${req.params.SystemRequirementId}'`

    console.log(query)
    connection.query(query, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });
    });
}





exports.actor_edit = (req, res) => {

    let duplicateQuery = `SELECT ActorName FROM actor where ActorName='${req.body.ActorName.replace(/'/g, '\\\'')}'
    and ProjectId='${req.body.ProjectId}' ${req.body.ActorId ? " and ActorId <> " + req.body.ActorId : ""}`;

    console.log(duplicateQuery);
    connection.query(duplicateQuery, function (obj) {
        if (obj.response.length) {

            return res.status(400).send({
                success: false,
                message: `The code '${req.body.ActorName}' has already been assigned to another Actor in this project.`,
                data: null
            });
        } else {

            editQuery = `Update actor set ActorDescription='${req.body.ActorDescription}',
               ActorName='${req.body.ActorName}'
               where ProjectId='${req.body.ProjectId}' and ActorId='${req.body.ActorId}'`;

            connection.query(editQuery, function (obj) {
                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response
                });
            });
        }
    });

}


// Save Workitems to system requirement map
exports.assign_workitem_to_system_requirement = (req, res) => {

    if (!req.body.SystemRequirementId) {
        return res.status(400).send({
            success: false,
            message: "System Requirement Id cannot be empty",
            data: null
        });
    }

    let query = `DELETE FROM system_requirement_workitem_map WHERE SystemRequirementId = '${req.body.SystemRequirementId}';`;

    connection.query(query, function (objDel) {

        if (objDel.error != null) {
            res.status(400).send({
                success: false,
                message: "Error: Code 90001. Please contact your system admin with this code.",
                data: null
            });
        }

        let query = `INSERT INTO system_requirement_workitem_map (SystemRequirementId, TaskId) VALUES `;

        req.body.selectedTasks.forEach((e, i) => {
            query += `('${req.body.SystemRequirementId}','${e}'),`;
        });

        query = query.substr(0, query.length - 1) + `;`;

        console.log(query);
        // res.send(query);
        // return;

        connection.query(query, function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        });

    });
}

// Get All System Requirement 
exports.get_All_system_requirement_list = (req, res) => {

    let getQuery = `SELECT sr.* FROM system_requirement sr  where  sr.Deleted ='N'`

    connection.query(getQuery, function (obj) {
        res.status(200).send({
            success: true,
            message: null,
            data: obj.response
        });

    });

}


// Save actor to system requirement map
exports.assign_actor_to_system_requirement_map = (req, res) => {

    if (!req.body.SystemRequirementId) {
        return res.status(400).send({
            success: false,
            message: "System Requirement Id cannot be empty",
            data: null
        });
    }

    let query = `DELETE FROM system_requirement_actor_map WHERE SystemRequirementId = '${req.body.SystemRequirementId}';`;

    connection.query(query, function (objDel) {

        if (objDel.error != null) {
            res.status(400).send({
                success: false,
                message: "Error: Code 90001. Please contact your system admin with this code.",
                data: null
            });
        }

        let query = `INSERT INTO system_requirement_actor_map (SystemRequirementId, ActorId) VALUES `;

        req.body.selectedTasks.forEach((e, i) => {
            query += `('${req.body.SystemRequirementId}','${e}'),`;
        });

        query = query.substr(0, query.length - 1) + `;`;

        console.log(query);
        // res.send(query);
        // return;

        connection.query(query, function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        });

    });
}

// get assign workitem to system requirement map table 
exports.get_assign_workitem_to_system_requirement_map = (req, res) => {
    console.log("Enter Here ")

    let query = `SELECT srwm.* FROM system_requirement_workitem_map  srwm WHERE srwm.SystemRequirementId=${req.query.SystemRequirementId}`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}


// get assign actor to system requirement actor map table 
exports.get_assign_actor_to_system_requirement_map = (req, res) => {
    console.log("Enter Here ")

    let query = `SELECT sram.* FROM system_requirement_actor_map  sram WHERE sram.SystemRequirementId=${req.query.SystemRequirementId}`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// get actor info by actor id 

exports.get_actor_details_by_actorId = (req, res) => {

    let query = `SELECT a.*,p.ProjectCode,p.ProjectName FROM actor a 
                 JOIN project p ON a.ProjectId = p.ProjectId Where a.ActorId = '${req.params.ActorId}'`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}


// Save actor to multiple system requirement map
exports.save_actor_to_system_requirement_map = (req, res) => {

    if (!req.body.ActorId) {
        return res.status(400).send({
            success: false,
            message: "Actor Id cannot be empty",
            data: null
        });
    }

    let query = `DELETE FROM system_requirement_actor_map WHERE ActorId = '${req.body.ActorId}';`;

    connection.query(query, function (objDel) {

        if (objDel.error != null) {
            res.status(400).send({
                success: false,
                message: "Error: Code 90001. Please contact your system admin with this code.",
                data: null
            });
        }

        let query = `INSERT INTO system_requirement_actor_map ( ActorId ,SystemRequirementId) VALUES `;

        req.body.selectedTasks.forEach((e, i) => {
            query += `('${req.body.ActorId}','${e}'),`;
        });

        query = query.substr(0, query.length - 1) + `;`;

        console.log(query);
        // res.send(query);
        // return;

        connection.query(query, function (obj) {
            res.send({
                success: obj.error == null,
                message: obj.error || `Success`,
                data: obj.response
            });
        });

    });
}


// Map Requirement Details by Actor Id
exports.getMapRequirementDetails = (req, res) => {

    let query = `Select SystemRequirementId from system_requirement_actor_map Where ActorId= ${req.params.ActorId}`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}

// Delete Business Rule and attachment By BusinessRule Id
exports.delete_bussiness_rule_by_id = (req, res) => {

    let dltQuery = `DELETE FROM business_rule_files WHERE  BusinessRuleId = ${req.body.BusinessRuleId} AND BusinessRuleFileURL = '${req.body.BusinessRuleAttachment}'; DELETE FROM business_rule WHERE BusinessRuleId = ${req.body.BusinessRuleId}; `

    console.log(dltQuery);
    connection.query(dltQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// Delete Acceptance Criteria By BusinessRule Id
exports.delete_acceptance_criteria_by_id = (req, res) => {

    let dltQuery = ` DELETE FROM acceptance_criteria WHERE AcceptanceCriteriaId = ${req.body.AcceptanceCriteriaId}; `

    console.log(dltQuery);
    connection.query(dltQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}

// get the last system requirement code for this type
exports.getLastSystemRequirementCode = (req, res) => {

    let WhereClause = ``;
    console.log(req.query.FunctionalAreaId)
    if (req.query.FunctionalAreaId == 1 && req.query.SystemRequirementType == "NFR") {
        WhereClause = `WHERE sr.ProjectId = ${req.query.ProjectId} AND sr.SystemRequirementType = '${req.query.SystemRequirementType}'`
    } else if (req.query.FunctionalAreaId == 1) {
        WhereClause = `WHERE sr.ProjectId = ${req.query.ProjectId} AND sr.SystemRequirementType = 'NFR'`
    } else {
        WhereClause = ` WHERE sr.ProjectId = ${req.query.ProjectId} AND sr.FunctionalAreaId = ${req.query.FunctionalAreaId}`
    }

    let query = `SELECT sr.* ,fa.* FROM system_requirement sr 
                 LEFT JOIN functional_area fa ON sr.FunctionalAreaId = fa.FunctionalAreaId
                ${WhereClause}
                 ORDER BY sr.SystemRequirementCode DESC 
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


// Edit AcceptanceCriteria by System Requirement Id
exports.edit_acceptanceCriteria_by_requirement_id = (req, res) => {

    let query = `UPDATE acceptance_criteria SET
                       AcceptanceCriteriaName = '${req.body.AcceptanceCriteriaName}'
                       WHERE SystemRequirementId ='${req.body.SystemRequirementId}' AND AcceptanceCriteriaId ='${req.body.AcceptanceCriteriaId}'`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


// Edit Business Rule by System Requirement Id
exports.edit_businessRule_by_requirement_id = (req, res) => {

    let query = `UPDATE business_rule SET
                       BusinessRuleName = '${req.body.BusinessRuleName}'
                       WHERE SystemRequirementId ='${req.body.SystemRequirementId}' AND BusinessRuleId ='${req.body.BusinessRuleId}'`;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });
}


// fetch Sub types Master 
exports.fetch_sub_types_master = (req, res) => {

    let query = `SELECT stm.* FROM sub_type_master stm WHERE stm.Subtype ='${req.params.type}'`;

    console.log(query);

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: true,
            message: 'Success',
            data: obj.response
        })
    })
}

// search systemRequirement List Individual
exports.systemRequirement_List_searched = (req, res) => {

    let querys = `SELECT DISTINCT  sr.*,stm.SubTypeName,p.ProjectId,p.ProjectCode,p.ProjectName,fa.FunctionalAreaId,fa.FunctionalAreaCode,fa.Description FROM system_requirement sr
                    INNER JOIN project p ON sr.ProjectId= p.ProjectId
                    JOIN sub_type_master stm ON sr.SubTypeMasterId = stm.SubTypeMasterId 
                    LEFT JOIN functional_area fa ON  sr.FunctionalAreaId=fa.FunctionalAreaId
                    JOIN system_requirement_workitem_map srwm ON sr.SystemRequirementId = srwm.SystemRequirementId WHERE 1=1`
    console.log(querys);


    console.log(querys + filter_by(req));

    connection.query(querys + filter_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response,
        });
    });
};

// search systemRequirement no work items map
exports.systemRequirement_no_items_map = (req, res) => {

    let querys = `SELECT DISTINCT  sr.*,stm.SubTypeName ,p.ProjectId,ProjectCode,p.ProjectName,fa.FunctionalAreaId,fa.FunctionalAreaCode,fa.Description FROM system_requirement sr
                    INNER JOIN project p ON sr.ProjectId= p.ProjectId
                    JOIN sub_type_master stm ON sr.SubTypeMasterId = stm.SubTypeMasterId 
                    LEFT JOIN functional_area fa ON  sr.FunctionalAreaId=fa.FunctionalAreaId
                    JOIN system_requirement_workitem_map srwm ON sr.SystemRequirementId != srwm.SystemRequirementId WHERE 1=1`
    console.log(querys);


    console.log(querys + filter_by(req));

    connection.query(querys + filter_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: obj.response,
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response,
        });
    });
};

function filter_by(req) {
    var filterObj = req.body;
    console.log(req.body)

    var filterClause = ``;

    if (filterObj.ProjectId) {
        filterClause += ` AND p.ProjectId ='${filterObj.ProjectId}' `;
    }

    if (filterObj.FunctionalAreaId) {
        filterClause += ` AND fa.FunctionalAreaId ='${filterObj.FunctionalAreaId}' `;
    }

    if (filterObj.SystemRequirementCode) {
        filterClause += ` AND sr.SystemRequirementCode  LIKE '%${filterObj.SystemRequirementCode}%' `;
    }

    if (filterObj.SystemRequirementName) {
        filterClause += ` AND sr.SystemRequirementName  LIKE '%${filterObj.SystemRequirementName}%' `;
    }

    if (filterObj.SystemRequirementType) {
        filterClause += ` AND sr.SystemRequirementType ='${filterObj.SystemRequirementType}' `;
    }

    if (filterObj.SubTypeMasterId != ``) {
        filterClause += ` AND sr.SubTypeMasterId ='${filterObj.SubTypeMasterId}' `;
    }


    console.log("FILTERCLAUSE: " + filterClause);

    return filterClause;
}


// System Requirement Mapping Reports

exports.system_requirement_mapping_reports = (req, res) => {

    let query = ` SELECT 
    p.ProjectName, p.ProjectCode,
    it.ProjectCycleNumber,it.ProjectCycleId,it.ActualStartDate,it.Duration,it.PlannedEndDate,it.ActualEndDate,it.ProjectCycleTypeName,
    ea.FullName AssigneeFullName,
    er.FullName ReportedByFullName,
    erv.FullName ReviewerFullName,
    tt.TaskTypeName, tt.IconClass,
    tp.PriorityText, tp.PriorityIcon, tp.PriorityColor,
    tpar.TaskId ParentTaskId, tpar.TaskName ParentTaskName,tpar.WorkItemKey ParentWorkItemKey , CONCAT(p.ProjectCode, '-', tpar.WorkItemKey) ParentKey,
    ts.StatusText, ts.IsWorklogItem, ts.IsOpenStatus, ts.IsInProgressStatus, ts.NextStatusId, ts.StatusIconClass AS StatusIconClass,
    ec.FullName CreatorFullName,
    elu.FullName LastEditorFullName,fa.Description,fa.FunctionalAreaCode,sr.Remarks StatusRemarks,sr.StatusRemarkId,  
    t.*,req.*
    FROM system_requirement_workitem_map srwm 
    JOIN system_requirement req ON srwm.SystemRequirementId = req.SystemRequirementId 
    JOIN task t ON srwm.TaskId = t.TaskId
    JOIN project p ON t.ProjectId = p.ProjectId
    JOIN employee er ON t.ReportedBy = er.EmployeeId
    JOIN employee ec ON t.CreatedBy = ec.EmployeeId
    JOIN employee elu ON t.CreatedBy = elu.EmployeeId
    JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
    JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
    LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
    LEFT JOIN employee erv ON t.ReviewerId = erv.EmployeeId
    LEFT JOIN functional_area fa ON req.FunctionalAreaId = fa.FunctionalAreaId
    LEFT JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
    LEFT JOIN task tpar ON tpar.TaskId = t.ParentTaskId
    LEFT JOIN status_remarks sr ON sr.TaskId = t.TaskId
    LEFT JOIN
    (SELECT pc.ProjectCycleNumber,pc.ProjectCycleId,pc.ActualStartDate,pc.Duration,pc.PlannedEndDate,pc.ActualEndDate,ptm.ProjectCycleTypeName, tim.TaskId from task_iteration_map tim JOIN project_cycle pc ON tim.IterationId = pc.ProjectCycleId
    JOIN project_cycle_type_master ptm ON pc.ProjectCycleTypeId = ptm.ProjectCycleTypeId) it  ON t.TaskId = it.TaskId
    WHERE req.ProjectId = '${req.params.ProjectId}';`

    console.log(query);

    connection.query(query, function (obj) {
        return res.status(200).send({
            success: true,
            message: 'Success',
            data: build_mapping_report_list(obj.response)
        })
    })
}


// Utility function, to group by System Requirement
function build_mapping_report_list(workitems) {
    var return_list = [];

    workitems.forEach((e) => {
        var mapping_obj = return_list.find((x) => x.SystemRequirementId == e.SystemRequirementId);

        if (!mapping_obj) {
            return_list.push({
                SystemRequirementId: e.SystemRequirementId,
                SystemRequirementName: e.SystemRequirementName,
                SystemRequirementCode: e.SystemRequirementCode,
                WorkItems: [e],
            });
        } else {
            mapping_obj.WorkItems.push(e);
        }
    });

    return return_list;
}

function report_filter_by(req) {
    var filterObj = req.body;
    console.log(req.body)

    var filterClause = ``;

    if (filterObj.ProjectId) {
        filterClause += ` AND p.ProjectId ='${filterObj.ProjectId}' `;
    }

    if (filterObj.FunctionalAreaId) {
        filterClause += ` AND fa.FunctionalAreaId ='${filterObj.FunctionalAreaId}' `;
    }

    if (filterObj.SystemRequirementCode) {
        filterClause += ` AND req.SystemRequirementCode  LIKE '%${filterObj.SystemRequirementCode}%' `;
    }

    if (filterObj.SystemRequirementName) {
        filterClause += ` AND req.SystemRequirementName  LIKE '%${filterObj.SystemRequirementName}%' `;
    }

    if (filterObj.SystemRequirementType) {
        filterClause += ` AND req.SystemRequirementType ='${filterObj.SystemRequirementType}' `;
    }

    if (filterObj.SubTypeMasterId != ``) {
        filterClause += ` AND req.SubTypeMasterId ='${filterObj.SubTypeMasterId}' `;
    }


    console.log("FILTERCLAUSE: " + filterClause);

    return filterClause;
}

// search systemRequirement mapping items 
exports.systemRequirement_mapping_report_filter = (req, res) => {

    let querys = ` SELECT 
    p.ProjectName, p.ProjectCode,
    it.ProjectCycleNumber,it.ProjectCycleId,it.ActualStartDate,it.Duration,it.PlannedEndDate,it.ActualEndDate,it.ProjectCycleTypeName,
    ea.FullName AssigneeFullName,
    er.FullName ReportedByFullName,
    erv.FullName ReviewerFullName,
    tt.TaskTypeName, tt.IconClass,
    tp.PriorityText, tp.PriorityIcon, tp.PriorityColor,
    tpar.TaskId ParentTaskId, tpar.TaskName ParentTaskName,tpar.WorkItemKey ParentWorkItemKey , CONCAT(p.ProjectCode, '-', tpar.WorkItemKey) ParentKey,
    ts.StatusText, ts.IsWorklogItem, ts.IsOpenStatus, ts.IsInProgressStatus, ts.NextStatusId, ts.StatusIconClass AS StatusIconClass,
    ec.FullName CreatorFullName,
    elu.FullName LastEditorFullName,fa.Description,fa.FunctionalAreaCode,sr.Remarks StatusRemarks,sr.StatusRemarkId,  
    t.*,req.*
    FROM system_requirement_workitem_map srwm 
    JOIN system_requirement req ON srwm.SystemRequirementId = req.SystemRequirementId 
    JOIN task t ON srwm.TaskId = t.TaskId
    JOIN project p ON t.ProjectId = p.ProjectId
    JOIN employee er ON t.ReportedBy = er.EmployeeId
    JOIN employee ec ON t.CreatedBy = ec.EmployeeId
    JOIN employee elu ON t.CreatedBy = elu.EmployeeId
    JOIN task_type tt ON t.TaskTypeId = tt.TaskTypeId
    JOIN task_priority tp ON t.TaskPriorityId = tp.TaskPriorityId
    LEFT JOIN employee ea ON t.AssigneeId = ea.EmployeeId
    LEFT JOIN employee erv ON t.ReviewerId = erv.EmployeeId
    LEFT JOIN functional_area fa ON req.FunctionalAreaId = fa.FunctionalAreaId
    LEFT JOIN workitem_status ts ON t.WorkitemStatusId = ts.WorkitemStatusId
    LEFT JOIN task tpar ON tpar.TaskId = t.ParentTaskId
    LEFT JOIN status_remarks sr ON sr.TaskId = t.TaskId
    LEFT JOIN
    (SELECT pc.ProjectCycleNumber,pc.ProjectCycleId,pc.ActualStartDate,pc.Duration,pc.PlannedEndDate,pc.ActualEndDate,ptm.ProjectCycleTypeName, tim.TaskId from task_iteration_map tim JOIN project_cycle pc ON tim.IterationId = pc.ProjectCycleId
    JOIN project_cycle_type_master ptm ON pc.ProjectCycleTypeId = ptm.ProjectCycleTypeId) it  ON t.TaskId = it.TaskId
    WHERE 1=1`
    console.log(querys);


    console.log(querys + report_filter_by(req));

    connection.query(querys + report_filter_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: build_mapping_report_list(obj.response),
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_mapping_report_list(obj.response),
        });
    });
};

// search systemRequirement no work items map
exports.systemRequirement_mapping_report_no_items_map = (req, res) => {

    let querys = `SELECT DISTINCT  sr.*,stm.SubTypeName ,p.ProjectId,ProjectCode,p.ProjectName,fa.FunctionalAreaId,fa.FunctionalAreaCode,fa.Description FROM system_requirement sr
                    INNER JOIN project p ON sr.ProjectId= p.ProjectId
                    JOIN sub_type_master stm ON sr.SubTypeMasterId = stm.SubTypeMasterId 
                    LEFT JOIN functional_area fa ON  sr.FunctionalAreaId=fa.FunctionalAreaId
                    JOIN system_requirement_workitem_map srwm ON sr.SystemRequirementId != srwm.SystemRequirementId WHERE 1=1`
    console.log(querys);


    console.log(querys + filter_by(req));

    connection.query(querys + filter_by(req), function (obj) {
        if (obj.error) {
            return res.status(400).send({
                success: false,
                message: "An unexpected error occurred",
                data: build_mapping_report_list(obj.response),
            });
        }

        res.send({
            success: obj.error == null,
            message: "success",
            data: build_mapping_report_list(obj.response),
        });
    });
};