const connection = require('./mysql.controller');

// Get all subordinates of a manager
exports.getChildren = (req, res) => {

    if (!req.query.ParentId) {
        return res.status(400).send({
            success: false,
            message: 'ParentId is required',
            data: null
        });
    }

    let nodes = [];
    let children = [];
    nodes.push(parseInt(req.query.ParentId));

    connection.query(`SELECT SupervisorId, SuperviseeId FROM employee_supervisor_map`,
        function (obj) {
            let map = [];
            obj.response.forEach(e => {
                map.push([e.SupervisorId, e.SuperviseeId]);
            });

            if (map.findIndex(e => e[0] == req.query.ParentId) < 0)
                return res.send({
                    success: true,
                    message: '',
                    data: []
                });;

            findChildren(map, nodes, children);

            let employeeIds = '(' + children.join() + ')';

            connection.query(`SELECT e.EmployeeId, e.EmployeeCode, e.FullName, ep.ProfilePic 
                                FROM employee e
                                LEFT JOIN employee_profile ep ON e.EmployeeId = ep.EmployeeId WHERE e.EmployeeId IN ${employeeIds}`,
                function (objEmp) {
                    res.send({
                        success: true,
                        message: '',
                        data: objEmp.response
                    });
                });
        }
    );
}

function findChildren(map, nodes, children) {

    // console.log(map, nodes, children);

    let childrenCount = children.length;
    map.forEach(m => {
        let parent = m[0];
        let child = m[1];

        if (!nodes.includes(parent))
            return;

        if (!children.includes(child))
            children.push(child);
    });

    if (children.length == childrenCount)
        return;

    findChildren(map, children, children);
}


//List of all supervisors in all projects
exports.supervisors = (req, res) => {

    if (!req.query.OrganizationId && !req.query.SupervisorId) {
        return res.status(400).send({
            success: false,
            message: "Organization or Supervisor Id is required",
            data: null
        })
    }

    var query;
    if(req.query.OrganizationId){
        query = `SELECT Distinct sem.SupervisorId, CONCAT(E1.FirstName,'  ',E1.LastName) as SupervisorName 
        FROM employee_supervisor_map sem join employee E1 where sem.SupervisorId = E1.EmployeeId
         and E1.OrganizationId = '${req.query.OrganizationId}' order by 2;`
    }

    if(req.query.SupervisorId){
        query = `Select distinct esm1.SupervisorId , E.FullName as SupervisorName from employee_supervisor_map esm1 
        join employee E on esm1.SupervisorId = E.EmployeeId  join employee_supervisor_map esm2 on 
        esm1.SupervisorId = esm2.SuperviseeId where esm2.SupervisorId = 6  
        UNION 
        Select E.EmployeeId as SupervisorId , E.FullName as SupervisorName from employee E
         where E.EmployeeId = 6 order by 2 ;`
    }


    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}




//List of all Projects with their Project Managers
exports.projectManagers = (req, res) => {
    if (!req.query.OrganizationId) {
        return res.status(400).send({
            success: false,
            message: "Organization is required",
            data: null
        })
    }

    let query = `SELECT p.ProjectId,  p.ProjectName, p.ProjectCode,  pem.EmployeeId as ManagerId, CONCAT(E.FirstName, ' ', E.LastName) as ManagerName FROM project p 
    JOIN project_employee_map pem ON p.ProjectId = pem.ProjectId join employee E on pem.EmployeeId = E.EmployeeId where p.OrganizationId = '${req.query.OrganizationId}'
    AND pem.ProjectRoleId = 1
    order by p.ProjectId;`
    connection.query(query, function (obj) {
        res.send({
            success: true,
            message: `Success`,
            data: obj.response
        });
    });
}