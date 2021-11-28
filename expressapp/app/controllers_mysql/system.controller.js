const connection = require('./mysql.controller');


// Creating a project
exports.menu = (req, res) => {
    connection.query(`SELECT MenuCategory, 
                        GROUP_CONCAT(MenuCaption ORDER BY SortOrder SEPARATOR'___') MenuCaptions,
                        GROUP_CONCAT(MenuHtmlId ORDER BY SortOrder SEPARATOR'___') MenuHtmlIds,
                        GROUP_CONCAT(URL ORDER BY SortOrder SEPARATOR'___') URLs,
                        GROUP_CONCAT(Hidden ORDER BY SortOrder SEPARATOR'___') Hiddens
                        FROM menu_master 
                        WHERE Deleted = 'N' 
                        GROUP BY MenuCategory, CategoryOrder
                        ORDER BY CategoryOrder`, 
        function (obj) {
            var response = [];

            obj.response.forEach(function(item, index) {
                var currObj = {};
                currObj.MenuCategory = item.MenuCategory;
                currObj.MenuItems = [];

                var count = item.MenuCaptions.split('___').length;

                var menuCaptions = item.MenuCaptions.split('___');
                var menuHtmlIds = item.MenuHtmlIds.split('___');
                var URLs = item.URLs.split('___');
                var hiddens = item.Hiddens.split('___');


                for (let i = 0; i < count; i++) {
                    menu = {};
                    menu.MenuCaption = menuCaptions[i];
                    menu.MenuHtmlId = menuHtmlIds[i];
                    menu.URL = URLs[i];
                    menu.Hidden = hiddens[i];

                    currObj.MenuItems.push(menu);
                }

                response.push(currObj);
            });

            res.status(200).send({
                success: true,
                message: `Success`,
                data: response
            });
        });
}


exports.url_map = (req, res) => {
    connection.query(`SELECT * FROM system_role_function_map srfm JOIN url_list_master ulm ON srfm.UrlListId = ulm.UrlListId
JOIN (SELECT * FROM employee_system_role_map WHERE EmployeeId = ${req.params.employeeId}) esrm ON esrm.SystemRoleId = srfm.SystemRoleId;`, function (obj) {
        
    })
}

