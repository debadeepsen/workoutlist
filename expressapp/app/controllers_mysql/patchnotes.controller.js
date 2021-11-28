const connection = require('./mysql.controller');

exports.patchnotes_list = (req, res) => {

    let query = `select * from patch_notes where Deleted='N' order by ReleaseDate DESC`;
    connection.query(query, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: obj.response
        });
    });

}