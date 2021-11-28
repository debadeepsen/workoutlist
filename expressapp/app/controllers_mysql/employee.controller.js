const connection = require('./mysql.controller');
const mail = require('./mail.controller');


// Logging into the portal
exports.login = (req, res) => {

    // Validate request
    if (!req.body.Username) {
        return res.status(400).send({
            message: "Username cannot be empty"
        });
    }

    if (!req.body.Password) {
        return res.status(400).send({
            message: "Password cannot be empty"
        });
    }

    let query = `SELECT *
                FROM employee e
                JOIN organization o ON e.OrganizationId = o.OrganizationId
                LEFT JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId
                WHERE e.EmployeeCode = '${req.body.Username}' 
                AND e.Password = MD5(CONCAT_WS('${req.body.Password}', '|', e.Salt))`;

    console.log(query);

    connection.query(query, function (obj) {
        if (obj.response.length) {
            var employeeInfo = obj.response[0];
            var systemRoleQuery = `SELECT SystemRoleId FROM employee_system_role_map WHERE EmployeeId = ${employeeInfo.EmployeeId} ORDER BY 1`;

            connection.query(systemRoleQuery, function (objSr) {
                employeeInfo.SystemRoleIdList = [];
                objSr.response.forEach(e => employeeInfo.SystemRoleIdList.push(e.SystemRoleId));

                //get access list

                connection.query(`SELECT srfm.UrlListId, ulm.URL, srfm.CanAccess FROM system_role_function_map srfm JOIN url_list_master ulm ON srfm.UrlListId = ulm.UrlListId
                                    JOIN (SELECT * FROM employee_system_role_map WHERE EmployeeId = ${employeeInfo.EmployeeId}) esrm 
                                    ON esrm.SystemRoleId = srfm.SystemRoleId AND srfm.CanAccess = 'Y'`, function (objAccessList) {
                    employeeInfo.AccessList = [];
                    objAccessList.response.forEach(e => {
                        console.log(e);
                        employeeInfo.AccessList.push(e.URL)
                    });

                    // GET PROJECT ROLE LIST 
                    connection.query(`SELECT pem.ProjectRoleId FROM  project p
                                      JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                                      WHERE p.Closed <>'Y' AND pem.EmployeeId= ${employeeInfo.EmployeeId}`, function (objProjectRoleIdList) {
                        employeeInfo.ProjectRoleIdList = [];
                        objProjectRoleIdList.response.forEach(e => employeeInfo.ProjectRoleIdList.push(e.ProjectRoleId));

                        // GET HIDDEN PROJECT LIST 

                        connection.query(`SELECT p.*,pem.ProjectHidden,pem.EmployeeId FROM project p
                                         JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                                         WHERE pem.ProjectHidden ='Y' AND pem.EmployeeId= ${employeeInfo.EmployeeId}`, function (objHiddenProjectList) {
                            employeeInfo.HiddenProjectList = [];
                            objHiddenProjectList.response.forEach(e => employeeInfo.HiddenProjectList.push(e));

                            connection.query(`SELECT CONVERT( MAX(n.TimeStampSeen), CHAR ) LastNotificationSeen FROM notification n WHERE n.RecipientId = ${employeeInfo.EmployeeId}`, function (obj) {

                                employeeInfo.LastNotificationSeen = obj.response[0].LastNotificationSeen;

                                res.status(200).send({
                                    success: true,
                                    message: null,
                                    data: employeeInfo
                                });
                            });
                        });
                    });

                });
            });
        } else
            res.status(400).send({
                success: false,
                message: `Invalid login`,
                data: null
            });
    });


}


exports.list = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            message: "Organization Id cannot be empty"
        });
    }

    connection.query(`SELECT *
                        FROM employee e
                        JOIN organization o ON e.OrganizationId = o.OrganizationId AND e.OrganizationId = ${req.query.OrganizationId}                     
                        JOIN department d ON e.DepartmentId = d.DepartmentId
                        JOIN system_role sr ON e.SystemRoleId = sr.SystemRoleId
                        LEFT JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId
                        WHERE e.Released ='N'
                        ORDER BY e.FullName
                        `, function (obj) {
        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: ``,
                data: null
            });
    });

}


exports.listByProject = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            message: "Organization Id cannot be empty"
        });
    }

    if (!req.query.ProjectId) {
        return res.status(400).send({
            message: "Project Id cannot be empty"
        });
    }

    connection.query(`SELECT e.*, o.*,ep.*
                        FROM employee e
                        JOIN organization o ON e.OrganizationId = o.OrganizationId  
                        JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId
                        JOIN project_employee_map pem ON e.EmployeeId = pem.EmployeeId
                        AND pem.ProjectId = '${req.query.ProjectId}'
                        ORDER BY e.FullName
                        `, function (obj) {
        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: ``,
                data: null
            });
    });
}
// Creating a Employee
exports.crup = (req, res) => {

    console.log(req.body);
    // Validate request

    // from textbox
    if (!req.body.FirstName) {
        return res.status(400).send({
            success: false,
            message: "Employee First name cannot be empty",
            data: null
        });
    }

    // from textbox
    if (!req.body.LastName) {
        return res.status(400).send({
            success: false,
            message: "Employee Last name cannot be empty",
            data: null
        });
    }

    // if (!req.body.EmployeeTypeId) {
    //     return res.status(400).send({
    //         success: false, message: "Employee Type Id cannot be empty", data: null
    //     });
    // }

    // from textbox
    if (!req.body.Email) {
        return res.status(400).send({
            success: false,
            message: "Employee Email cannot be empty",
            data: null
        });
    }

    //from localStorage
    if (!req.body.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: "Organization Id  cannot be empty",
            data: null
        });
    }

    let MiddleName = ``;
    if (req.body.MiddleName) {
        MiddleName = req.body.MiddleName;
    } else {
        MiddleName = "";
    }

    let Gender = ``;
    if (req.body.Gender) {
        Gender = req.body.Gender;
    } else {
        Gender = "";
    }

    let Designation = ``;
    if (req.body.Designation) {
        Designation = req.body.Designation;
    } else {
        Designation = "";
    }

    //from dropdown
    // if (!req.body.DepartmentId) {
    //     return res.status(400).send({
    //         success: false, message: "Department Id  cannot be empty", data: null
    //     });
    // }

    //generate employee code (DEBADEEP)
    let empCodePrefix = ''; // this is left blank for now, organizations should later be able to pick their prefix codes #TODO
    let empCodeQuery = `SELECT CONCAT('${empCodePrefix}', REPLACE(MAX(employee.EmployeeCode),'${empCodePrefix}','') + 1) ECode FROM employee`;
    connection.query(empCodeQuery, function (obj, employeeCode) {
        if (obj.response.length) {
            let employeeCode = obj.response[0].ECode;
            console.log(employeeCode);

            let duplicateQuery = `SELECT Email FROM employee where Email ='${req.body.Email}'${req.body.EmployeeId ? " and EmployeeId <> " + req.body.EmployeeId : ""} `;


            console.log(duplicateQuery);

            connection.query(duplicateQuery, function (obj) {
                if (obj.response.length)
                    res.status(400).send({
                        success: false,
                        message: `The Employee Email "${req.body.Email}" has already been assigned to another Employee in your organization.`,
                        data: null
                    });
            });
            console.log(employeeCode);
            let crupQuery = req.body.EmployeeId ?
                `UPDATE employee set
                             Salutation ='${req.body.Salutation}',
                             FirstName ='${req.body.FirstName}',
                             MiddleName ='${MiddleName}',
                             LastName ='${req.body.LastName}',
                             FullName = CONCAT('${req.body.FirstName}',' ','${MiddleName}',' ','${req.body.LastName}'),
                             Email = '${req.body.Email}',
                             OrganizationId = '${req.body.OrganizationId}',
                             DepartmentId = '${1}',
                             LastUpdatedBy = '${req.body.LastUpdatedBy}'
                             where EmployeeId = ${req.body.EmployeeId}` :
                `INSERT INTO employee (Salutation,FirstName,MiddleName,LastName,FullName,EmployeeCode,Salt,Email,OrganizationId,DepartmentId,CreatedBy)
                            VALUES('${req.body.Salutation}',
                            '${req.body.FirstName}',
                            '${MiddleName}',
                            '${req.body.LastName}',
                            CONCAT('${req.body.FirstName}',' ','${MiddleName}',' ','${req.body.LastName}'),
                            '${req.body.EmployeeCode}',
                            UUID(),
                            '${req.body.Email}',
                            '${req.body.OrganizationId}',
                            '${1}',
                             '${req.body.CreatedBy}')`;

            if (req.body.EmployeeId && req.query.delete) {
                crupQuery = `UPDATE employee set  Deleted ='Y',DeletedBy='${req.body.LastUpdatedBy}',DeletedDateTime=now() where EmployeeId = ${req.body.EmployeeId}`;
                console.log(crupQuery);
            }

            console.log(crupQuery);

            connection.query(crupQuery, function (obj) {

                // assign a default password if a new employee is being added to the system
                if (crupQuery.startsWith('INSERT')) {
                    let passwordQuery = `UPDATE employee SET Password = MD5(CONCAT_WS('1234', '|', Salt)) WHERE EmployeeCode = '${employeeCode}'`;
                    connection.query(passwordQuery, function (objPassword) {
                        console.log(passwordQuery);
                        console.log(objPassword);
                    });
                }
                // assign a supervisor
                let SuperviseeId = obj.response.insertId;

                // Assign a Employee Profile 
                console.log("Gender " + req.body.Gender);
                let employeProfileQuery = req.body.EmployeeId ?
                    `UPDATE employee_profile set 
                                 ${req.body.Gender ? "Gender = '" + req.body.Gender + "'," : ""}
                                 ${req.body.Designation ? "Designation = '" + req.body.Designation + "'," : ""}
                                 Bio = '${req.body.Bio ? req.body.Bio.replace(/'/g, "\\'") : ""}'
                                 Where EmployeeId = ${req.body.EmployeeId}` :
                    `INSERT INTO  employee_profile (EmployeeId,
                                                    Gender,
                                                    ${req.body.Designation ? "Designation," : ""}
                                                    Bio)
                                            VALUES('${SuperviseeId}',
                                            '${Gender}',
                                            ${req.body.Designation ? req.body.Designation + "," : ""}
                                            '${req.body.Bio ? req.body.Bio.replace(/'/g, "\\'") : ""}')`;

                connection.query(employeProfileQuery, function (objProfile) {
                    console.log(employeProfileQuery);
                    console.log(objProfile);
                });

                let deletQuery = req.body.EmployeeId ?
                    `DELETE FROM employee_supervisor_map where  SuperviseeId = ${req.body.EmployeeId}` :
                    `DELETE FROM employee_supervisor_map where  SuperviseeId = ${SuperviseeId}`;

                console.log(deletQuery);
                connection.query(deletQuery, function (obj) {

                    if (!req.body.SupervisorId) {
                        return res.send({
                            success: obj.error == null,
                            message: obj.error || `Success`,
                            data: obj.response
                        });
                    }

                    let query = req.body.EmployeeId ?
                        `INSERT INTO employee_supervisor_map (SupervisorId,SuperviseeId,StartDate,CreatedBy)
                                        VALUES('${req.body.SupervisorId}',
                                        '${req.body.EmployeeId}',
                                        now(),
                                        '${req.body.CreatedBy}')` :
                        `INSERT INTO employee_supervisor_map (SupervisorId,SuperviseeId,StartDate,CreatedBy) 
                                        VALUES('${req.body.SupervisorId}',
                                        '${SuperviseeId}',
                                        now(),
                                        '${req.body.CreatedBy}')`;
                    console.log(query)
                    connection.query(query, function (obj) {

                        res.send({
                            success: obj.error == null,
                            message: obj.error || `Success`,
                            data: obj.response

                        });
                    });
                });

            });
        }
    });

}

// fetch employee Details by employee Id
exports.employeeDetails_By_EmployeeId = (req, res) => {

    var query = `SELECT e.*,esm.SupervisorId,ep.* FROM  employee as e 
                LEFT JOIN employee_supervisor_map as esm
                ON e.EmployeeId = esm.SuperviseeId
                LEFT JOIN employee_profile as ep
                ON e.EmployeeId = ep.EmployeeId where e.EmployeeId = '${req.params.EmployeeId}'`;


    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}

exports.profile = (req, res) => {

    if (!req.params.employeeCode) {
        return res.status(400).send({
            success: false,
            message: "Employee Code is required",
            data: null
        });
    }

    let query = `SELECT * FROM employee e 
                    JOIN department d ON e.DepartmentId
                    JOIN system_role sr ON e.SystemRoleId = sr.SystemRoleId
                    LEFT JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId
                    WHERE e.EmployeeCode = '${req.params.employeeCode}'`;

    connection.query(query, function (obj) {

        if (!obj.response.length) {
            return res.status(204).send({
                success: false,
                message: "No employee found",
                data: null
            });
        }

        let employeeDetails = obj.response[0];
        let empId = employeeDetails.EmployeeId;

        console.log(employeeDetails);
        console.log(empId);

        let projQuery = `SELECT p.ProjectId, p.ProjectName, p.ProjectCode, pr.ProjectRoleName
                        FROM project p 
                        JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                        JOIN project_role pr ON pem.ProjectRoleId = pr.ProjectRoleId
                        WHERE pem.EmployeeId = '${empId}'`;

        let projDetails = [];


        connection.query(projQuery, function (objProj) {

            projDetails = objProj.response;

            let systemRoleQuery = `SELECT sr.* FROM employee_system_role_map esrm JOIN system_role sr
                                    ON esrm.SystemRoleId = sr.SystemRoleId
                                    AND esrm.EmployeeId = '${empId}'`;

            let sysRoles = [];


            connection.query(systemRoleQuery, function (objSr) {

                sysRoles = objSr.response;

                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: {
                        profile: employeeDetails,
                        projects: projDetails,
                        systemRoles: sysRoles
                    }
                });

            });

        });

    });

}



// Reset all passwords (for all users)
exports.updateallpasswords = (req, res) => {
    let query = '';

    for (let i = 0; i < 100; i++) {
        query = `UPDATE employee SET Salt = UUID() WHERE EmployeeId = ${i};
                UPDATE employee SET Password = MD5(CONCAT_WS('1234', '|', Salt)) WHERE EmployeeId = ${i}`;

        connection.query(query, function (obj) {
            console.log(query);
        });
    }

    res.send({
        s: 'success'
    });
}


// Reset all passwords (for all users)
exports.resetpassword = (req, res) => {

    console.log(req.body);

    if (!req.body.Email) {
        return res.status(400).send({
            success: false,
            message: 'Email is required',
            data: null
        })
    }

    if (req.body.Password) {

        if (!req.body.OldPassword) {
            return res.status(400).send({
                success: false,
                message: 'Old Password is required',
                data: null
            })
        }

        let checkPasswordQuery = `SELECT Count(EmployeeId) empCount FROM employee 
                                    WHERE Email = '${req.body.Email}' 
                                    AND Password = MD5(CONCAT_WS('${req.body.Password}', '|', Salt))`;

        let oldPasswordCheckFailed = false;
        connection.query(checkPasswordQuery, function (objCheckPassword) {
            console.log(objCheckPassword);

            if (!objCheckPassword.response[0].empCount) {
                oldPasswordCheckFailed = true;
                return;
            }
        });

        if (oldPasswordCheckFailed) {
            return res.status(400).send({
                success: false,
                message: 'Old Password is incorrect',
                data: null
            });
        }

    }

    // let checkQuery = `SELECT Count(EmployeeId) empCount FROM employee WHERE Email = '${req.body.Email}'`;

    // connection.query(checkQuery, function (objCheck) {

    //     // console.log(objCheck);res.send({message:'test'});return;


    //     if (!objCheck || !objCheck.response[0].empCount) {
    //         res.status(400).send({
    //             success: false,
    //             message: `Email address not found`,
    //             data: null
    //         });
    //         return;
    //     }
    // });



    let letter_count = 8;
    let tempPassword = '';
    for (let l = 0; l < letter_count; l++) {
        let ucase = Math.floor((Math.random() * 26) + 97);
        let lcase = Math.floor((Math.random() * 26) + 65);
        let num = Math.floor((Math.random() * 10) + 48);
        let arr = [ucase, lcase, num];
        let index = Math.floor(Math.random() * 3);
        let charCode = arr[index];
        tempPassword += String.fromCharCode(charCode);
    }

    let password = !req.body.Password ? tempPassword : req.body.Password;

    console.log(password);


    let query = `UPDATE employee SET Salt = UUID() WHERE Email = '${req.body.Email}';
                UPDATE employee SET Password = MD5(CONCAT_WS('${password}', '|', Salt)) WHERE Email = '${req.body.Email}';`;


    console.log(query);


    let isReset = !req.body.Password;
    let currentEmail = req.body.Email;

    connection.query(query, function (obj) {

        // send out a mail, only for password resets
        if (isReset) {
            let emailObj = {
                message: {
                    from: "\"🔔 SEPM Admin\"  sepm.management@gmail.com",
                    to: [
                        currentEmail
                    ],
                    subject: "Password Reset",
                    html: `<div 
                            style="
                                width:55%;
                                padding:35px;
                                font-family:Verdana,Tahoma,Arial,sans-serif;
                                background:#eee;
                                border:1px solid #777;
                                margin:10px auto
                            ">
                            <h1 style="color:#7ad;font-family:Tahoma,Arial,sans-serif;font-weight:200">Your password has been reset</h1>
                            <p>
                                You (or someone else) has requested a password reset for your SEPM account. Please log in to SEPM with the password 
                                <code style="font-size:20px;color:#699;font-weight:bold">${tempPassword}</code>. Please remember to change your password afterwards.
                            </p>
                        </div>`,
                }
            };

            mail.sendgmailfunction(emailObj);
        }

        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });

    });

}


//list All Employee By Manager Or Organization 
exports.listByAllEmployee = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            message: "Organization Id cannot be empty"
        });
    }


    connection.query(`SELECT e.*, o.*
                        FROM employee e
                        JOIN organization o ON e.OrganizationId = o.OrganizationId    
                        ORDER BY e.FullName
                        `, function (obj) {
        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: ``,
                data: null
            });
    });
}

// list Employee Best on Project And Manager 
exports.EmployeeList_best_on_ManagerId = (req, res) => {

    var projects = [];
    var query = `SELECT p.* FROM project p 
                JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId
                WHERE pem.EmployeeId = '${req.query.EmployeeId}'
                AND pem.ProjectRoleId = 1  
                group by p.ProjectName, p.ProjectId`;

    connection.query(query, function (obj) {

        for (var i = 0; i < obj.response.length; i++) {

            projects.push(obj.response[i].ProjectId);
        }

        let empQuery = `SELECT DISTINCT e.*, o.*
        FROM employee e
        JOIN organization o ON e.OrganizationId = o.OrganizationId     
        JOIN project_employee_map pem ON e.EmployeeId = pem.EmployeeId
        AND pem.ProjectId IN (${projects})
        ORDER BY e.FullName`;
        console.log(empQuery);
        connection.query(empQuery, function (obj) {
            if (obj.response.length)
                res.status(200).send({
                    success: true,
                    message: null,
                    data: obj.response
                });
            else
                res.status(400).send({
                    success: false,
                    message: ``,
                    data: null
                });
        });
    });

}

exports.missing_work_logs_listByProject = (req, res) => {

    if (!req.query.OrganizationId) {
        return res.status(400).send({
            message: "Organization Id cannot be empty"
        });
    }

    if (!req.query.ProjectId) {
        return res.status(400).send({
            message: "Project Id cannot be empty"
        });
    }

    connection.query(`SELECT DISTINCT  e.*, o.*
                        FROM employee e
                        JOIN organization o ON e.OrganizationId = o.OrganizationId     
                        JOIN project_employee_map pem ON e.EmployeeId = pem.EmployeeId
                        AND pem.ProjectId IN (${req.query.ProjectId})
                        ORDER BY e.FullName
                        `, function (obj) {
        if (obj.response.length)
            res.status(200).send({
                success: true,
                message: null,
                data: obj.response
            });
        else
            res.status(400).send({
                success: false,
                message: ``,
                data: null
            });
    });
}

// Fetch Release Resource 
exports.release_resource_filter = (req, res) => {

    var whereClose = ``;

    if (req.query.FullName != "undefined" && req.query.ProjectId != "") {
        whereClose = ` e.FullName like '%${req.query.FullName}%' and p.ProjectId = ${req.query.ProjectId}`
    }
    else if (req.query.ProjectId != "" && req.query.FullName == "undefined") {
        whereClose = ` p.ProjectId = ${req.query.ProjectId}`
    } else if (req.query.ProjectId == "" && req.query.FullName != "undefined") {
        whereClose = ` e.FullName like '%${req.query.FullName}%'`
    }

    var query = `
                 SELECT   
                 p.ProjectName, p.ProjectCode, p.ProjectId,
                 e.EmployeeId,e.FullName,e.EmployeeCode,
                 ep.ProfilePic,
                 esm.FullName AS Supervisor
                 FROM employee e
                 JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId
                 JOIN( SELECT p.ProjectName, p.ProjectCode,p.ProjectId ,pem.EmployeeId FROM project_employee_map  pem 
                 JOIN project p ON  pem.ProjectId =  p.ProjectId) p ON  e.EmployeeId = p.EmployeeId

                 JOIN ( SELECT ee.FullName,ee.EmployeeId,es.SuperviseeId,es.SupervisorId FROM  employee_supervisor_map es 
                 JOIN employee ee ON ee.EmployeeId = es.SupervisorId) esm ON e.EmployeeId = esm.SuperviseeId

                 Where  ${whereClose} and e.Released='N'
                 GROUP BY e.FullName `;

    console.log(query);
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: "success",
            data: obj.response,
        });
    });
}

// Release Resource from employee , project and workitem list 
// DELETE FROM project_employee_map WHERE EmployeeId= '${req.body.EmployeeId}' ;

exports.release_resource_info_update = (req, res) => {

    let updateEmployeeQuery = `UPDATE  employee SET  Released='${req.body.Released}' ,
                                       ReleasedBy='${req.body.ReleasedBy}',
                                       ReleasedDateTime ='${req.body.ReleasedDateTime}'
                                       WHERE EmployeeId= '${req.body.EmployeeId}' `;


    console.log(updateEmployeeQuery);

    connection.query(updateEmployeeQuery, function (obj) {
        if (obj.error != null) {
            res.status(400).send({
                success: false,
                message: obj.message || `ERROR`,
                data: null
            });
            return;
        }

        let employeeProjectListQuery = `   SELECT p.*,pem.*
                                           FROM project p 
                                           JOIN project_employee_map  pem ON p.ProjectId = pem.ProjectId
                                           Where pem.EmployeeId='${req.body.EmployeeId}'`;
        console.log(updateEmployeeQuery);

        connection.query(employeeProjectListQuery, function (obj) {

            if (obj.error != null) {
                res.status(400).send({
                    success: false,
                    message: obj.message || `ERROR`,
                    data: null
                });
                return;
            }
            var projectList = [];
            projectList = obj.response;
            let updateQuery = ``;
            projectList.forEach(p => {
                updateQuery += `UPDATE task SET AssigneeId = '${p.DefaultAssigneeId}' WHERE AssigneeId = '${req.body.EmployeeId}' AND ProjectId ='${p.ProjectId}' ; 
                INSERT INTO project_employee_map_archive (ProjectId,EmployeeId,ProjectRoleId,ProjectHidden)
                VALUES('${p.ProjectId}','${p.EmployeeId}','${p.ProjectRoleId}','${p.ProjectHidden}'); `
            })

            updateQuery += `DELETE FROM project_employee_map  WHERE EmployeeId = '${req.body.EmployeeId}' ;`

            console.log(updateQuery)

            connection.query(updateQuery, function (obj) {

                res.send({
                    success: obj.error == null,
                    message: obj.error || `Success`,
                    data: obj.response,
                });

            });

        });

    });
}


exports.showHideClosedProjects = (req, res) => {

    const { EmployeeId, ShowClosedProjects } = req.body;

    if (!EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null
        });
    }

    if (!ShowClosedProjects) {
        return res.status(400).send({
            success: false,
            message: "ShowClosedProjects is required",
            data: null
        });
    }

    connection.query(`UPDATE employee SET ShowClosedProjects='${ShowClosedProjects}' 
                        WHERE EmployeeId=${EmployeeId}`, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}


exports.getShowClosedProjects = (req, res) => {

    const EmployeeId = req.params.EmployeeId;

    if (!EmployeeId) {
        return res.status(400).send({
            success: false,
            message: "EmployeeId is required",
            data: null
        });
    }

    connection.query(`SELECT ShowClosedProjects FROM employee WHERE EmployeeId=${EmployeeId}`, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response[0]
        });
    });

}
